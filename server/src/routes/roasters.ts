import { Router } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { upload, deleteImage } from '../lib/localStorage';
import { canEditRoaster } from '../middleware/roasterAuth';

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
    
    // Get current user's role to determine if they can see unverified roasters
    let userRole = 'user'; // Default to regular user
    if (req.userId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { role: true, settings: true }
      });
      if (currentUser) {
        userRole = currentUser.role;
      }
    }
    
    // Only show verified roasters to non-admin users
    if (userRole !== 'admin') {
      where.verified = true;
    }
    
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
        imageUrl: roaster.images && roaster.images.length > 0 ? roaster.images[0] : null,
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

    // Check if current user is admin or if roaster is verified
    let userRole = 'user';
    if (req.userId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { role: true }
      });
      if (currentUser) {
        userRole = currentUser.role;
      }
    }
    
    // Non-admin users can only see verified roasters
    if (userRole !== 'admin' && !roaster.verified) {
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

    // Add imageUrl field for frontend compatibility (filename only)
    const roasterWithImageUrl = {
      ...roaster,
      imageUrl: roaster.images && roaster.images.length > 0 ? roaster.images[0] : null,
      isFavorited,
    };

    res.json(roasterWithImageUrl);
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

/**
 * @swagger
 * /api/roasters/admin/unverified:
 *   get:
 *     summary: Get all unverified roasters (admin only)
 *     tags: [Roasters]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: List of unverified roasters
 *       403:
 *         description: Admin access required
 */
router.get('/admin/unverified', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get unverified roasters
    const roasters = await prisma.roaster.findMany({
      where: { verified: false },
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
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.roaster.count({ where: { verified: false } });
    const pages = Math.ceil(total / limit);

    // Add imageUrl field for frontend compatibility (filename only)
    const roastersWithImageUrl = roasters.map((roaster: any) => ({
      ...roaster,
      imageUrl: roaster.images && roaster.images.length > 0 ? roaster.images[0] : null,
    }));

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
    console.error('Get unverified roasters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roasters/{id}/verify:
 *   patch:
 *     summary: Verify a roaster (admin only)
 *     tags: [Roasters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Roaster verified successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Roaster not found
 */
router.patch('/:id/verify', [
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

    const roaster = await prisma.roaster.update({
      where: { id },
      data: { verified: true },
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
      message: 'Roaster verified successfully',
      roaster,
    });
  } catch (error: any) {
    console.error('Verify roaster error:', error);
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

/**
 * @swagger
 * /api/roasters/{id}/images:
 *   get:
 *     summary: Get all images for a roaster
 *     tags: [Roasters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of roaster images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       url:
 *                         type: string
 *                       description:
 *                         type: string
 *                       isPrimary:
 *                         type: boolean
 *                       uploadedAt:
 *                         type: string
 *       404:
 *         description: Roaster not found
 */
router.get('/:id/images', [
  param('id').isString(),
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const roaster = await prisma.roaster.findUnique({
      where: { id },
      include: {
        roasterImages: {
          orderBy: [
            { isPrimary: 'desc' },
            { uploadedAt: 'asc' }
          ],
          select: {
            id: true,
            url: true,
            description: true,
            isPrimary: true,
            uploadedAt: true,
            filename: true
          }
        }
      }
    });

    if (!roaster) {
      return res.status(404).json({ error: 'Roaster not found' });
    }

    res.json({
      images: roaster.roasterImages,
    });
  } catch (error) {
    console.error('Get roaster images error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roasters/{id}/images:
 *   post:
 *     summary: Upload images to a roaster (owner or admin only)
 *     tags: [Roasters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               descriptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional descriptions for each image
 *               setPrimary:
 *                 type: integer
 *                 description: Index of image to set as primary (0-based)
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only owner or admin can upload images
 *       404:
 *         description: Roaster not found
 */
router.post('/:id/images', [
  param('id').isString(),
], requireAuth, canEditRoaster, upload.array('images', 10), async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: roasterId } = req.params;
    const { descriptions = [], setPrimary } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    // Parse descriptions if it's a string (from form data)
    let imageDescriptions: string[] = [];
    if (typeof descriptions === 'string') {
      try {
        imageDescriptions = JSON.parse(descriptions);
      } catch {
        imageDescriptions = [descriptions];
      }
    } else if (Array.isArray(descriptions)) {
      imageDescriptions = descriptions;
    }

    // Create image records in database
    const imagePromises = files.map(async (file, index) => {
      const isPrimary = setPrimary ? parseInt(setPrimary) === index : false;
      
      // Store just the filename, let frontend handle the URL
      const imageUrl = file.filename;
      
      return prisma.roasterImage.create({
        data: {
          url: imageUrl,
          publicId: file.filename, // Use filename as public ID for local storage
          filename: file.originalname,
          description: imageDescriptions[index] || null,
          isPrimary,
          roasterId,
          uploadedById: req.userId,
        },
      });
    });

    const createdImages = await Promise.all(imagePromises);

    // If setting a new primary image, unset previous primary
    if (setPrimary !== undefined) {
      const primaryIndex = parseInt(setPrimary);
      if (primaryIndex >= 0 && primaryIndex < createdImages.length) {
        await prisma.roasterImage.updateMany({
          where: {
            roasterId,
            id: { not: createdImages[primaryIndex].id }
          },
          data: { isPrimary: false }
        });
      }
    }

    // Update the roaster's images array for backward compatibility
    const allImages = await prisma.roasterImage.findMany({
      where: { roasterId },
      orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }],
      select: { url: true }
    });

    await prisma.roaster.update({
      where: { id: roasterId },
      data: {
        images: allImages.map(img => img.url)
      }
    });

    res.status(201).json({
      message: 'Images uploaded successfully',
      images: createdImages.map(img => ({
        id: img.id,
        url: img.url,
        description: img.description,
        isPrimary: img.isPrimary,
        uploadedAt: img.uploadedAt,
        filename: img.filename
      })),
    });
  } catch (error) {
    console.error('Upload roaster images error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roasters/{id}/images/{imageId}:
 *   put:
 *     summary: Update image details (owner or admin only)
 *     tags: [Roasters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageId
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
 *               description:
 *                 type: string
 *               isPrimary:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Image updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only owner or admin can update images
 *       404:
 *         description: Roaster or image not found
 */
router.put('/:id/images/:imageId', [
  param('id').isString(),
  param('imageId').isString(),
  body('description').optional().isString(),
  body('isPrimary').optional().isBoolean(),
], requireAuth, canEditRoaster, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: roasterId, imageId } = req.params;
    const { description, isPrimary } = req.body;

    // Check if image belongs to this roaster
    const existingImage = await prisma.roasterImage.findFirst({
      where: {
        id: imageId,
        roasterId
      }
    });

    if (!existingImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // If setting as primary, unset other primary images
    if (isPrimary) {
      await prisma.roasterImage.updateMany({
        where: {
          roasterId,
          id: { not: imageId }
        },
        data: { isPrimary: false }
      });
    }

    const updatedImage = await prisma.roasterImage.update({
      where: { id: imageId },
      data: {
        description: description !== undefined ? description : undefined,
        isPrimary: isPrimary !== undefined ? isPrimary : undefined,
      },
    });

    // Update the roaster's images array for backward compatibility
    const allImages = await prisma.roasterImage.findMany({
      where: { roasterId },
      orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }],
      select: { url: true }
    });

    await prisma.roaster.update({
      where: { id: roasterId },
      data: {
        images: allImages.map(img => img.url)
      }
    });

    res.json({
      message: 'Image updated successfully',
      image: {
        id: updatedImage.id,
        url: updatedImage.url,
        description: updatedImage.description,
        isPrimary: updatedImage.isPrimary,
        uploadedAt: updatedImage.uploadedAt,
        filename: updatedImage.filename
      },
    });
  } catch (error) {
    console.error('Update roaster image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roasters/{id}/images/{imageId}:
 *   delete:
 *     summary: Delete a roaster image (owner or admin only)
 *     tags: [Roasters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only owner or admin can delete images
 *       404:
 *         description: Roaster or image not found
 */
router.delete('/:id/images/:imageId', [
  param('id').isString(),
  param('imageId').isString(),
], requireAuth, canEditRoaster, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: roasterId, imageId } = req.params;

    // Get image details before deletion
    const image = await prisma.roasterImage.findFirst({
      where: {
        id: imageId,
        roasterId
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete from Cloudinary
    const cloudinaryDeleted = await deleteImage(image.publicId);
    if (!cloudinaryDeleted) {
      console.warn(`Failed to delete image from Cloudinary: ${image.publicId}`);
    }

    // Delete from database
    await prisma.roasterImage.delete({
      where: { id: imageId }
    });

    // Update the roaster's images array for backward compatibility
    const allImages = await prisma.roasterImage.findMany({
      where: { roasterId },
      orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }],
      select: { url: true }
    });

    await prisma.roaster.update({
      where: { id: roasterId },
      data: {
        images: allImages.map(img => img.url)
      }
    });

    res.json({
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete roaster image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
// trigger restart
