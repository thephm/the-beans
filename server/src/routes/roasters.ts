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

// Required auth middleware
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Roaster:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         website:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zipCode:
 *           type: string
 *         country:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         hours:
 *           type: object
 *         priceRange:
 *           type: string
 *         specialties:
 *           type: array
 *           items:
 *             type: string
 *         verified:
 *           type: boolean
 *         featured:
 *           type: boolean
 *         rating:
 *           type: number
 *         reviewCount:
 *           type: integer
 */

/**
 * @swagger
 * /api/roasters:
 *   get:
 *     summary: Get all roasters with filtering and pagination
 *     tags: [Roasters]
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
 *         name: specialty
 *         schema:
 *           type: string
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
 *           default: 50
 *     responses:
 *       200:
 *         description: List of roasters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roasters:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Roaster'
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
  query('latitude').optional().isFloat(),
  query('longitude').optional().isFloat(),
  query('radius').optional().isFloat({ min: 1, max: 500 }),
], optionalAuth, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { search, city, state, specialty, latitude, longitude, radius = 50 } = req.query;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { specialties: { has: search } },
      ];
    }
    
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    
    if (state) {
      where.state = { contains: state, mode: 'insensitive' };
    }
    
    if (specialty) {
      where.specialties = { has: specialty };
    }

    // Get roasters
    const roasters = await prisma.roaster.findMany({
      where,
      skip,
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
        cafes: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          }
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ]
    });

    // If location-based search, filter by distance
    let filteredRoasters = roasters;
    if (latitude && longitude) {
      filteredRoasters = roasters.filter(roaster => {
        if (!roaster.latitude || !roaster.longitude) return false;
        
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          roaster.latitude,
          roaster.longitude
        );
        
        return distance <= parseFloat(radius);
      });
    }

    const total = await prisma.roaster.count({ where });
    const pages = Math.ceil(total / limit);

    res.json({
      roasters: filteredRoasters,
      pagination: {
        page,
        limit,
        total,
        pages,
      }
    });
  } catch (error) {
    console.error('Get roasters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roasters/{id}:
 *   get:
 *     summary: Get roaster by ID
 *     tags: [Roasters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Roaster details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Roaster'
 *       404:
 *         description: Roaster not found
 */
router.get('/:id', [
  param('id').isString(),
], optionalAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    const roaster = await prisma.roaster.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
        cafes: true,
        beans: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
          }
        }
      }
    });

    if (!roaster) {
      return res.status(404).json({ error: 'Roaster not found' });
    }

    // Check if current user has favorited this roaster
    let isFavorited = false;
    if (req.userId) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_roasterId: {
            userId: req.userId,
            roasterId: id,
          }
        }
      });
      isFavorited = !!favorite;
    }

    res.json({
      ...roaster,
      isFavorited,
    });
  } catch (error) {
    console.error('Get roaster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roasters:
 *   post:
 *     summary: Create a new roaster
 *     tags: [Roasters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               priceRange:
 *                 type: string
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Roaster created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', [
  body('name').isLength({ min: 1, max: 100 }),
  body('description').optional().isLength({ max: 1000 }),
  body('email').optional().isEmail(),
  body('phone').optional().isLength({ max: 20 }),
  body('website').optional().isURL(),
  body('address').optional().isLength({ max: 200 }),
  body('city').optional().isLength({ max: 100 }),
  body('state').optional().isLength({ max: 50 }),
  body('zipCode').optional().isLength({ max: 20 }),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('priceRange').optional().isIn(['$', '$$', '$$$', '$$$$']),
  body('specialties').optional().isArray(),
], requireAuth, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const roasterData = {
      ...req.body,
      ownerId: req.userId,
    };

    const roaster = await prisma.roaster.create({
      data: roasterData,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    res.status(201).json({
      message: 'Roaster created successfully',
      roaster,
    });
  } catch (error) {
    console.error('Create roaster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate distance between two points
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
