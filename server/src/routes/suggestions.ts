import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { createAuditLog, getClientIP, getUserAgent } from '../lib/auditService';

const router = express.Router();

// Validation rules for creating a suggestion
const createSuggestionValidation = [
  body('roasterName').trim().notEmpty().withMessage('Roaster name is required'),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('website').trim().isURL().withMessage('Valid website URL is required'),
  body('submitterRole')
    .trim()
    .isIn(['customer', 'rando', 'scout', 'owner', 'admin', 'marketing'])
    .withMessage('Valid role is required'),
  body('submitterFirstName').optional().trim(),
  body('submitterLastName').optional().trim(),
  body('submitterEmail').optional().trim().custom((value, { req }) => {
    // Email is required for all roles except 'rando'
    if (req.body.submitterRole !== 'rando' && !value) {
      throw new Error('Email is required for this role');
    }
    // If email is provided, validate it
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error('Valid email is required');
    }
    return true;
  }),
  body('submitterPhone').optional().trim(),
];

/**
 * POST /api/suggestions
 * Create a new roaster suggestion
 */
router.post('/', createSuggestionValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      roasterName,
      city,
      state,
      country,
      website,
      submitterRole,
      submitterFirstName,
      submitterLastName,
      submitterEmail,
    } = req.body;

    const suggestion = await prisma.roasterSuggestion.create({
      data: {
        roasterName,
        city,
        state,
        country,
        website,
        submitterRole,
        submitterFirstName,
        submitterLastName,
        submitterEmail,
        status: 'pending',
      },
    });

    // Log audit trail
    await createAuditLog({
      action: 'CREATE',
      entityType: 'RoasterSuggestion',
      entityId: suggestion.id,
      entityName: roasterName,
      userId: (req as any).user?.id || null,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      newValues: {
        submitterEmail,
        submitterRole,
        city,
        state,
        country,
      },
    });

    res.status(201).json(suggestion);
  } catch (error) {
    console.error('Error creating roaster suggestion:', error);
    res.status(500).json({ error: 'Failed to create suggestion' });
  }
});

/**
 * GET /api/suggestions
 * Get all roaster suggestions (admin only)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const suggestions = await prisma.roasterSuggestion.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

/**
 * PATCH /api/suggestions/:id
 * Update a roaster suggestion status (admin only)
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    const suggestion = await prisma.roasterSuggestion.update({
      where: { id },
      data: {
        status,
        adminNotes,
        reviewedAt: new Date(),
      },
    });

    // Log audit trail
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'RoasterSuggestion',
      entityId: suggestion.id,
      entityName: suggestion.roasterName,
      userId: (req as any).user?.id || null,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      newValues: {
        status,
        adminNotes,
      },
    });

    res.json(suggestion);
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ error: 'Failed to update suggestion' });
  }
});

export default router;
