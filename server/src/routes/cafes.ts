import { Router } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Middleware to extract user from token (optional for public routes)
const optionalAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
      req.userId = decoded.userId;
    }
    next();
  } catch (error) {
    next(); // Continue without user authentication
  }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Cafe:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - city
 *         - state
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         phone:
 *           type: string
 *         website:
 *           type: string
 *         hours:
 *           type: string
 *         rating:
 *           type: number
 *         reviewCount:
 *           type: integer
 *         imageUrl:
 *           type: string
 *         roasterName:
 *           type: string
 *         roasterId:
 *           type: string
 *         features:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/cafes:
 *   get:
 *     summary: Get all cafes with filtering and pagination
 *     tags: [Cafes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, rating, reviewCount]
 *           default: name
 *     responses:
 *       200:
 *         description: List of cafes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cafes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cafe'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isIn(['name', 'rating', 'reviewCount']),
], optionalAuth, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'name';
    
    const { search, city, state } = req.query;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    
    if (state) {
      where.state = { contains: state, mode: 'insensitive' };
    }

    // Build order by clause
    let orderBy: any = {};
    switch (sort) {
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'reviewCount':
        orderBy = { reviewCount: 'desc' };
        break;
      default:
        orderBy = { name: 'asc' };
    }

    // Get cafes
    const cafes = await prisma.cafe.findMany({
      where,
      skip,
      take: limit,
      include: {
        roaster: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            reviews: true,
          }
        }
      },
      orderBy,
    });

    // Transform data to match frontend expectations
    const transformedCafes = cafes.map(cafe => ({
      id: cafe.id,
      name: cafe.name,
      description: '', // Not in the schema, provide default
      address: cafe.address || '',
      city: cafe.city || '',
      state: cafe.state || '',
      phone: cafe.phone || '',
      website: cafe.website || '',
      hours: JSON.stringify(cafe.hours) || '',
      rating: cafe.rating || 0,
      reviewCount: cafe._count.reviews,
      imageUrl: cafe.images?.[0] || '/images/default-cafe.svg',
      roasterName: cafe.roaster?.name || '',
      roasterId: cafe.roaster?.id || '',
      features: cafe.amenities || [],
    }));

    const total = await prisma.cafe.count({ where });
    const pages = Math.ceil(total / limit);

    res.json({
      cafes: transformedCafes,
      pagination: {
        page,
        limit,
        total,
        pages,
      }
    });
  } catch (error) {
    console.error('Get cafes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/cafes/{id}:
 *   get:
 *     summary: Get a specific cafe by ID
 *     tags: [Cafes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The cafe ID
 *     responses:
 *       200:
 *         description: The cafe details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cafe'
 *       404:
 *         description: Cafe not found
 */
router.get('/:id', [
  param('id').isLength({ min: 1 }).withMessage('Invalid cafe ID'),
], optionalAuth, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const cafe = await prisma.cafe.findUnique({
      where: { id },
      include: {
        roaster: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            reviews: true,
          }
        }
      },
    });

    if (!cafe) {
      return res.status(404).json({ error: 'Cafe not found' });
    }

    // Transform data to match frontend expectations
    const transformedCafe = {
      id: cafe.id,
      name: cafe.name,
      description: '', // Not in schema, provide default
      address: cafe.address || '',
      city: cafe.city || '',
      state: cafe.state || '',
      phone: cafe.phone || '',
      website: cafe.website || '',
      email: '', // Not in schema, provide default
      rating: cafe.rating || 0,
      reviewCount: cafe._count.reviews,
      priceRange: '$', // Not in schema, provide default
      amenities: cafe.amenities || [],
      hours: cafe.hours || {},
      atmosphere: '', // Not in schema, provide default
      seatingCapacity: 0, // Not in schema, provide default
      wifi: cafe.amenities?.includes('WiFi') || false,
      parking: cafe.amenities?.includes('Parking') || false,
      imageUrl: cafe.images?.[0] || '/images/default-cafe.svg',
      roasterName: cafe.roaster?.name || '',
      roasterId: cafe.roaster?.id || '',
    };

    res.json(transformedCafe);
  } catch (error) {
    console.error('Get cafe by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
