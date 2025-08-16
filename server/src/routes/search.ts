import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

// Updated search routes with image URL support
const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search roasters and cafes
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
 *           enum: [roasters, cafes, all]
 *           default: all
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
 *                 cafes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cafe'
 *                 total:
 *                   type: integer
 */
router.get('/', [
  query('q').isLength({ min: 1 }).trim(),
  query('type').optional().isIn(['roasters', 'cafes', 'all']),
  query('latitude').optional().isFloat(),
  query('longitude').optional().isFloat(),
  query('radius').optional().isFloat({ min: 1, max: 500 }),
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, type = 'all', latitude, longitude, radius = 25 } = req.query;

    let roasters: any[] = [];
    let cafes: any[] = [];

    // Search roasters
    if (type === 'all' || type === 'roasters') {
      roasters = await prisma.roaster.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
            { state: { contains: q, mode: 'insensitive' } },
            { specialties: { has: q } },
          ]
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            }
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
            }
          }
        },
        take: 20,
        orderBy: [
          { featured: 'desc' },
          { rating: 'desc' },
        ]
      });
    }

    // Search cafes
    if (type === 'all' || type === 'cafes') {
      cafes = await prisma.cafe.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
            { state: { contains: q, mode: 'insensitive' } },
            { amenities: { has: q } },
          ]
        },
        include: {
          roaster: {
            select: {
              id: true,
              name: true,
              specialties: true,
            }
          },
          _count: {
            select: {
              reviews: true,
            }
          }
        },
        take: 20,
        orderBy: { rating: 'desc' }
      });
    }

    // Filter by location if provided
    if (latitude && longitude) {
      roasters = roasters.filter(roaster => {
        if (!roaster.latitude || !roaster.longitude) return false;
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          roaster.latitude,
          roaster.longitude
        );
        return distance <= parseFloat(radius);
      });

      cafes = cafes.filter(cafe => {
        if (!cafe.latitude || !cafe.longitude) return false;
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          cafe.latitude,
          cafe.longitude
        );
        return distance <= parseFloat(radius);
      });
    }

    res.json({
      roasters,
      cafes,
      total: roasters.length + cafes.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/search/roasters:
 *   get:
 *     summary: Search roasters specifically
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location to search near
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Coffee specialty filter
 *       - in: query
 *         name: distance
 *         schema:
 *           type: number
 *           default: 25
 *         description: Search radius in miles
 *     responses:
 *       200:
 *         description: List of roasters
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Roaster'
 */
router.get('/roasters', async (req: any, res: any) => {
  try {
    const { search, location, specialty, distance = 25 } = req.query;
    
    let whereClause: any = {};
    
    // Build search conditions
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { specialties: { has: search } }, // Also search in specialties array
      ];
    }
    
    if (specialty) {
      whereClause.specialties = { has: specialty };
    }
    
    if (location) {
      whereClause.OR = whereClause.OR || [];
      whereClause.OR.push(
        { city: { contains: location, mode: 'insensitive' } },
        { state: { contains: location, mode: 'insensitive' } },
        { address: { contains: location, mode: 'insensitive' } }
      );
    }

    const roasters = await prisma.roaster.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
        _count: {
          select: {
            reviews: true,
            cafes: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Add mock distance and rating for frontend  
    const roastersWithExtras = roasters.map((roaster: any) => {
      // Add imageUrl for frontend compatibility
      const result = {
        ...roaster,
        imageUrl: roaster.images && roaster.images.length > 0 ? roaster.images[0] : 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=600&fit=crop',
        distance: parseFloat((Math.random() * parseFloat(distance.toString())).toFixed(1)), // Mock distance for now
        priceRange: '$$$', // Mock price range
      };

      // Round rating to 1 decimal place
      if (roaster.rating && typeof roaster.rating === 'number') {
        result.rating = parseFloat(roaster.rating.toFixed(1));
      } else {
        result.rating = parseFloat((4.5 + Math.random() * 0.5).toFixed(1)); // Mock rating between 4.5-5.0
      }
      
      return result;
    });

    res.json(roastersWithExtras);
  } catch (error) {
    console.error('Roasters search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;
