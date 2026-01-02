import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

import { auditBefore, auditAfter } from '../middleware/auditMiddleware';
import { createAuditLog, getClientIP, getUserAgent, getEntityName } from '../lib/auditService';

const router = Router();
// Use shared Prisma client

// Middleware to check if user is admin
const requireAdmin = async (req: any, res: Response, next: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.id },
    select: { role: true }
  });

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// GET /api/specialties - Get all specialties with translations and roaster count
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('language').optional().isString(),
  query('includeDeprecated').optional().isString(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { language = 'en', includeDeprecated = 'false', sortBy, sortOrder } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;
    
    const whereClause = includeDeprecated === 'true' ? {} : { deprecated: false };

    // Build orderBy clause
    // Note: name and description are in translations, so we need special handling
    let orderBy: any = { createdAt: 'asc' }; // Default
    if (sortBy) {
      const direction = sortOrder === 'desc' ? 'desc' : 'asc';
      switch (sortBy) {
        case 'deprecated':
        case 'createdAt':
        case 'updatedAt':
          orderBy = { [sortBy]: direction };
          break;
        // For name, description, roasterCount we'll sort in memory after fetching
        // since they require joins/aggregations
        default:
          orderBy = { createdAt: 'asc' };
      }
    }

    const specialties = await prisma.specialty.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        translations: {
          where: {
            language: language as string
          }
        },
        roasters: {
          select: {
            id: true
          }
        }
      },
      orderBy: orderBy
    });

    const total = await prisma.specialty.count({ where: whereClause });
    const pages = Math.ceil(total / limit);

    // Format response to include roaster count and primary translation
    let formattedSpecialties = specialties.map(specialty => ({
      id: specialty.id,
      name: specialty.translations[0]?.name || 'Unnamed',
      description: specialty.translations[0]?.description || '',
      deprecated: specialty.deprecated,
      roasterCount: specialty.roasters.length,
      createdAt: specialty.createdAt,
      updatedAt: specialty.updatedAt
    }));

    // Apply client-side sorting for fields that can't be sorted in the query
    if (sortBy === 'name' || sortBy === 'description' || sortBy === 'roasterCount') {
      const direction = sortOrder === 'desc' ? -1 : 1;
      formattedSpecialties.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return direction * aValue.localeCompare(bValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return direction * (aValue - bValue);
        }
        return 0;
      });
    }

    res.json({
      specialties: formattedSpecialties,
      pagination: {
        page,
        limit,
        total,
        pages,
      }
    });
  } catch (error) {
    console.error('Error fetching specialties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/specialties/:id - Get a single specialty with all translations
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const specialty = await prisma.specialty.findUnique({
      where: { id },
      include: {
        translations: true,
        roasters: {
          select: {
            id: true
          }
        }
      }
    });

    if (!specialty) {
      return res.status(404).json({ error: 'Specialty not found' });
    }

    // Format translations as a map by language
    const translationsMap: Record<string, { name: string; description: string }> = {};
    specialty.translations.forEach(trans => {
      translationsMap[trans.language] = {
        name: trans.name,
        description: trans.description || ''
      };
    });

    const formattedSpecialty = {
      id: specialty.id,
      deprecated: specialty.deprecated,
      roasterCount: specialty.roasters.length,
      translations: translationsMap,
      createdAt: specialty.createdAt,
      updatedAt: specialty.updatedAt
    };

    res.json(formattedSpecialty);
  } catch (error) {
    console.error('Error fetching specialty:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/specialties - Create a new specialty (admin only)
router.post('/', 
  requireAuth, 
  requireAdmin,
  [
    body('translations').isObject().withMessage('Translations must be an object'),
    body('translations.en.name').notEmpty().withMessage('English name is required'),
    body('translations.fr.name').notEmpty().withMessage('French name is required'),
  ],
  auditBefore('specialty', 'CREATE'),
  async (req: Request, res: Response) => {

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { translations, deprecated = false } = req.body;
      req.userId = typeof req.user?.id === 'string' ? req.user.id : undefined;

      // Create specialty with translations
      const translationsData = Object.entries(translations).map(([language, data]: [string, any]) => ({
        language,
        name: data.name,
        description: data.description || ''
      }));

      const specialty = await prisma.specialty.create({
        data: {
          deprecated,
          translations: {
            create: translationsData
          }
        },
        include: {
          translations: true
        }
      });

      // Store entity for audit logging
      res.locals.auditEntity = specialty;

      res.status(201).json(specialty);
    } catch (error) {
      console.error('Error creating specialty:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  auditAfter()
);

// PUT /api/specialties/:id - Update a specialty (admin only)
router.put('/:id',
  requireAuth,
  requireAdmin,
  [
    body('translations').optional().isObject().withMessage('Translations must be an object'),
    body('deprecated').optional().isBoolean().withMessage('Deprecated must be a boolean'),
  ],
  auditBefore('specialty', 'UPDATE'),
  async (req: Request, res: Response) => {

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { translations, deprecated } = req.body;
      req.userId = typeof req.user?.id === 'string' ? req.user.id : undefined;

      // Capture old values for audit (including translations)
      const oldSpecialty = await prisma.specialty.findUnique({
        where: { id },
        include: { translations: true }
      });
      
      if (!oldSpecialty) {
        return res.status(404).json({ error: 'Specialty not found' });
      }

      // Update specialty
      const updateData: any = {};
      if (deprecated !== undefined) {
        updateData.deprecated = deprecated;
      }

      const specialty = await prisma.specialty.update({
        where: { id },
        data: updateData,
        include: {
          translations: true
        }
      });

      // Update translations if provided
      if (translations) {
        for (const [language, data] of Object.entries(translations) as [string, any][]) {
          await prisma.specialtyTranslation.upsert({
            where: {
              specialtyId_language: {
                specialtyId: id,
                language
              }
            },
            update: {
              name: data.name,
              description: data.description || ''
            },
            create: {
              specialtyId: id,
              language,
              name: data.name,
              description: data.description || ''
            }
          });
        }
      }

      // Fetch updated specialty with translations for audit comparison
      const updatedSpecialty = await prisma.specialty.findUnique({
        where: { id },
        include: { translations: true }
      });

      // Create audit log directly to ensure translation changes are captured
      if (updatedSpecialty) {
        if (typeof req.userId !== 'string') {
          return res.status(400).json({ error: 'Missing or invalid userId' });
        }
        await createAuditLog({
          action: 'UPDATE',
          entityType: 'specialty',
          entityId: id,
          entityName: getEntityName('specialty', updatedSpecialty),
          userId: req.userId,
          ipAddress: getClientIP(req),
          userAgent: getUserAgent(req),
          oldValues: oldSpecialty as Record<string, any>,
          newValues: updatedSpecialty as Record<string, any>,
        });
      }

      res.json(updatedSpecialty);
    } catch (error) {
      console.error('Error updating specialty:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/specialties/:id - Delete a specialty (admin only)
router.delete('/:id',
  requireAuth,
  requireAdmin,
  auditBefore('specialty', 'DELETE'),
  async (req: Request, res: Response) => {

    try {
      const { id } = req.params;
      req.userId = typeof req.user?.id === 'string' ? req.user.id : undefined;

      // Check if specialty exists and get it for audit
      const specialty = await prisma.specialty.findUnique({
        where: { id },
        include: { 
          translations: true,
          roasters: true
        }
      });

      if (!specialty) {
        return res.status(404).json({ error: 'Specialty not found' });
      }

      // Check if specialty is in use
      if (specialty.roasters.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete specialty that is in use by roasters. Consider deprecating it instead.' 
        });
      }

      // Store for audit
      res.locals.auditEntity = {
        entityName: 'specialty',
        entityId: specialty.id,
        entityData: specialty
      };

      // Delete specialty (translations will cascade)
      await prisma.specialty.delete({
        where: { id }
      });

      res.json({ message: 'Specialty deleted successfully' });
    } catch (error) {
      console.error('Error deleting specialty:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  auditAfter()
);

export default router;
