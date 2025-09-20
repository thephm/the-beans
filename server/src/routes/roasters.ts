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
  query('sort').optional().isString(),
], optionalAuth, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { search, city, state, specialty, latitude, longitude, radius = 50, sort } = req.query;

    // Build orderBy clause based on sort parameter
    let orderBy: any[] = [];
    
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
        // Default sorting when no sort parameter or invalid value
        orderBy = [
          { featured: 'desc' },
          { rating: 'desc' },
          { reviewCount: 'desc' },
        ];
    }

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
        _count: {
          select: {
            reviews: true,
            favorites: true,
          }
        }
      },
      orderBy: orderBy
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

    // Add imageUrl field for frontend compatibility
    const roastersWithImageUrl = filteredRoasters.map((roaster: any) => {
      const result = {
        ...roaster,
        imageUrl: roaster.images && roaster.images.length > 0 ? roaster.images[0] : 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=600&fit=crop',
      };
      
      // Round rating to 1 decimal place
      if (roaster.rating && typeof roaster.rating === 'number') {
        result.rating = parseFloat(roaster.rating.toFixed(1));
      }
      
      // Round distance to 1 decimal place (only available if location filtering was applied)
      if (roaster.distance && typeof roaster.distance === 'number') {
        result.distance = parseFloat(roaster.distance.toFixed(1));
      }
      
      return result;
    });

    res.json({
      roasters: roastersWithImageUrl,
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
  body('name').isLength({ min: 1, max: 100 }).withMessage('Name is required and must be between 1-100 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email address'),
  body('phone').optional().isLength({ max: 20 }).withMessage('Phone number must be less than 20 characters'),
  body('website').optional({ checkFalsy: true }).isURL().withMessage('Please enter a valid website URL'),
  body('address').optional().isLength({ max: 200 }).withMessage('Address must be less than 200 characters'),
  body('city').optional().isLength({ max: 100 }).withMessage('City must be less than 100 characters'),
  body('state').optional().isLength({ max: 50 }).withMessage('State must be less than 50 characters'),
  body('zipCode').optional().isLength({ max: 20 }).withMessage('Zip code must be less than 20 characters'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('specialties').optional().isArray().withMessage('Specialties must be an array'),
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

/**
 * @swagger
 * /api/roasters/{id}:
 *   put:
 *     summary: Update a roaster (admin only)
 *     tags: [Roasters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               country:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *               verified:
 *                 type: boolean
 *               featured:
 *                 type: boolean
 *               rating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Roaster updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Roaster not found
 */
router.put('/:id', [
  param('id').isString(),
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1-100 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email address'),
  body('phone').optional().isLength({ max: 20 }).withMessage('Phone number must be less than 20 characters'),
  body('website').optional({ checkFalsy: true }).isURL().withMessage('Please enter a valid website URL'),
  body('address').optional().isLength({ max: 200 }).withMessage('Address must be less than 200 characters'),
  body('city').optional().isLength({ max: 100 }).withMessage('City must be less than 100 characters'),
  body('state').optional().isLength({ max: 50 }).withMessage('State must be less than 50 characters'),
  body('zipCode').optional().isLength({ max: 20 }).withMessage('Zip code must be less than 20 characters'),
  body('country').optional().isLength({ max: 100 }).withMessage('Country must be less than 100 characters'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('specialties').optional().isArray().withMessage('Specialties must be an array'),
  body('verified').optional().isBoolean().withMessage('Verified must be true or false'),
  body('featured').optional().isBoolean().withMessage('Featured must be true or false'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
], requireAuth, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const roaster = await prisma.roaster.update({
      where: { id },
      data: updateData,
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

    res.json({
      message: 'Roaster updated successfully',
      roaster,
    });
  } catch (error: any) {
    console.error('Update roaster error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Roaster not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roasters/{id}:
 *   delete:
 *     summary: Delete a roaster (admin only)
 *     tags: [Roasters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Roaster deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Roaster not found
 */
router.delete('/:id', [
  param('id').isString(),
], requireAuth, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    await prisma.roaster.delete({
      where: { id }
    });

    res.json({
      message: 'Roaster deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete roaster error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Roaster not found' });
    }
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
// trigger restart
