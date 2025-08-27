import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

// Updated search routes with image URL support - roasters only
const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search roasters
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [roasters]
 *           default: roasters
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 25
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roasters:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Roaster'
 *                 total:
 *                   type: number
 */
router.get('/', [
  query('q').isLength({ min: 1 }).withMessage('Search query is required'),
  query('type').optional().isIn(['roasters']),
  query('latitude').optional().isFloat(),
  query('longitude').optional().isFloat(),
  query('radius').optional().isFloat({ min: 1, max: 100 }),
], async (req: import('express').Request, res: import('express').Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, type = 'roasters', latitude, longitude, radius = 25 } = req.query;
    const searchQuery = q as string;
    
    let roasters: any[] = [];

    // Search roasters
    roasters = await prisma.roaster.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          { city: { contains: searchQuery, mode: 'insensitive' } },
          { state: { contains: searchQuery, mode: 'insensitive' } },
          { specialties: { has: searchQuery } },
          { specialties: { hasSome: searchQuery.split(' ') } },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
    });

    // Add distance calculation if coordinates provided
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const maxRadius = parseFloat(radius as string);

      roasters = roasters.filter(roaster => {
        if (!roaster.latitude || !roaster.longitude) return false;
        
        const distance = calculateDistance(
          lat,
          lng,
          roaster.latitude,
          roaster.longitude
        );
        return distance <= maxRadius;
      });
    }

    res.json({
      roasters,
      total: roasters.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Specialty search route for roasters
router.get('/roasters', [
  query('specialty').optional().isLength({ min: 1 }),
  query('location').optional().isLength({ min: 1 }),
  query('sort').optional().isIn(['name', '-name', '-rating', '-reviewCount', 'city']),
  query('latitude').optional().isFloat(),
  query('longitude').optional().isFloat(),
  query('radius').optional().isFloat({ min: 1, max: 100 }),
], async (req: import('express').Request, res: import('express').Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { specialty, location, sort, latitude, longitude, radius = 25 } = req.query;
    
    let whereClause: any = {};
    
    if (specialty) {
      const specialtyQuery = specialty as string;
      
      // French to English specialty translation mapping for backend search
      const frenchToEnglishSpecialties: {[key: string]: string} = {
        'Espresso': 'Espresso',
        'Origine unique': 'Single Origin',
        'Café froid': 'Cold Brew',
        'Commerce équitable': 'Fair Trade',
        'Biologique': 'Organic',
        'Infusion lente': 'Pour Over',
        'Commerce direct': 'Direct Trade',
        'Dégustation': 'Cupping'
      };
      
      // Check if the specialty is in French and convert to English for database search
      const englishSpecialty = frenchToEnglishSpecialties[specialtyQuery] || specialtyQuery;
      
      whereClause.specialties = {
        has: englishSpecialty
      };
    }
    
    if (location) {
      whereClause.OR = [
        { city: { contains: location as string, mode: 'insensitive' } },
        { state: { contains: location as string, mode: 'insensitive' } },
        { address: { contains: location as string, mode: 'insensitive' } },
      ];
    }

    // Dynamic sorting
    let orderBy: any[] = [];
    if (sort) {
      switch (sort) {
        case 'name':
          orderBy = [{ name: 'asc' }];
          break;
        case '-name':
          orderBy = [{ name: 'desc' }];
          break;
        case '-rating':
          orderBy = [{ rating: 'desc' }];
          break;
        case '-reviewCount':
          orderBy = [{ reviewCount: 'desc' }];
          break;
        case 'city':
          orderBy = [{ city: 'asc' }];
          break;
        default:
          orderBy = [{ featured: 'desc' }, { rating: 'desc' }, { reviewCount: 'desc' }];
      }
    } else {
      orderBy = [{ featured: 'desc' }, { rating: 'desc' }, { reviewCount: 'desc' }];
    }

    let roasters = await prisma.roaster.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy,
    });

    // Add distance calculation and filtering if coordinates provided
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const maxRadius = parseFloat(radius as string);

      roasters = roasters.filter(roaster => {
        if (!roaster.latitude || !roaster.longitude) return false;
        
        const distance = calculateDistance(
          lat,
          lng,
          roaster.latitude,
          roaster.longitude
        );
        return distance <= maxRadius;
      });
    }

    res.json({
      roasters,
      pagination: {
        total: roasters.length,
        page: 1,
        limit: roasters.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('Roaster search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of the Earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in miles
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default router;
