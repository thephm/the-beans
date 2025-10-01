import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

// Updated search routes with image URL support - roasters only
const router = Router();
const prisma = new PrismaClient();

// Middleware to extract user from token (optional for public routes)
const optionalAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, settings: true }
      });
      req.user = user;
    }
    next();
  } catch (error) {
    next(); // Continue without user authentication
  }
};

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
  optionalAuth,
  query('q').isLength({ min: 1 }).withMessage('Search query is required'),
  query('type').optional().isIn(['roasters']),
  query('latitude').optional().isFloat(),
  query('longitude').optional().isFloat(),
  query('radius').optional().isFloat({ min: 1, max: 100 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, search, type = 'roasters', latitude, longitude, radius = 25 } = req.query;
    // Accept both ?q= and ?search= for search term
    const searchQuery = (typeof q === 'string' && q) || (typeof search === 'string' && search) || '';

    // Log the search query to the Search table
    if (searchQuery && searchQuery.trim().length > 0) {
      const sqLower = searchQuery.trim().toLowerCase();
      const existing = await prisma.search.findFirst({ where: { query: sqLower } });
      if (existing) {
        await prisma.search.update({
          where: { id: existing.id },
          data: { count: { increment: 1 } },
        });
      } else {
        await prisma.search.create({
          data: { query: sqLower, count: 1 },
        });
      }
    }

    // Check user role for verification filtering
    const user = (req as any).user;
    let userRole = 'user';
    if (user) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
      });
      if (currentUser) {
        userRole = currentUser.role;
      }
    }

    // Build where clause for search
    let whereClause: any = {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { city: { contains: searchQuery, mode: 'insensitive' } },
        { state: { contains: searchQuery, mode: 'insensitive' } },
      ],
    };

    // Only show verified roasters to non-admin users
    if (userRole !== 'admin') {
      whereClause.verified = true;
    }

    // Search roasters in DB
    let roasters: any[] = await prisma.roaster.findMany({
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
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
    });

    // Filter by specialty (case-insensitive) if searchQuery is present
    if (searchQuery) {
      const qLower = searchQuery.trim().toLowerCase();
      roasters = roasters.filter(roaster =>
        (Array.isArray(roaster.specialties) &&
          (roaster.specialties as string[]).some((s: string) => s.toLowerCase() === qLower))
        || roaster.name.toLowerCase().includes(qLower)
        || (roaster.description && roaster.description.toLowerCase().includes(qLower))
        || (roaster.city && roaster.city.toLowerCase().includes(qLower))
        || (roaster.state && roaster.state.toLowerCase().includes(qLower))
      );
    }
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const maxRadius = parseFloat(radius as string);
      roasters = roasters.filter((roaster: any) => {
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

    // Add imageUrl field for frontend compatibility
    const roastersWithImageUrl = roasters.map((roaster: any) => ({
      ...roaster,
      imageUrl: roaster.images && roaster.images.length > 0 ? roaster.images[0] : 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=600&fit=crop',
    }));

    res.json({
      roasters: roastersWithImageUrl,
      total: roastersWithImageUrl.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Specialty search route for roasters
router.get('/roasters', [
  optionalAuth,
  query('q').optional().isLength({ min: 1 }),
  query('specialty').optional().isLength({ min: 1 }),
  query('location').optional().isLength({ min: 1 }),
  query('sort').optional().isIn(['name', '-name', '-rating', '-reviewCount', 'city']),
  query('latitude').optional().isFloat(),
  query('longitude').optional().isFloat(),
  query('radius').optional().isFloat({ min: 1, max: 100 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, specialty, location, sort, latitude, longitude, radius = 25 } = req.query;
    let whereClause: any = {};

    // Log the search query to the Search table (for popular searches)
    if (q && typeof q === 'string' && q.trim().length > 0) {
      try {
        const qLower = q.trim().toLowerCase();
        const existing = await prisma.search.findFirst({ where: { query: qLower } });
        if (existing) {
          await prisma.search.update({
            where: { id: existing.id },
            data: { count: { increment: 1 } },
          });
        } else {
          await prisma.search.create({
            data: { query: qLower, count: 1 },
          });
        }
      } catch (error) {
        console.error('Error tracking search query:', error);
      }
    }

    if (q && typeof q === 'string') {
      // Remove Prisma filtering for search query; filter in JS below
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

    // Check user role for verification filtering
    const user = (req as any).user;
    let userRole = 'user';
    if (user) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
      });
      if (currentUser) {
        userRole = currentUser.role;
      }
    }
    
    // Only show verified roasters to non-admin users
    if (userRole !== 'admin') {
      whereClause.verified = true;
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
    // Filter by all fields (including specialties, case-insensitive, partial match) in JS if q is present
    if (q && typeof q === 'string') {
      const qLower = q.trim().toLowerCase();
      roasters = roasters.filter(roaster =>
        (Array.isArray(roaster.specialties) &&
          (roaster.specialties as string[]).some((s: string) => s.toLowerCase().includes(qLower)))
        || (roaster.name && roaster.name.toLowerCase().includes(qLower))
        || (roaster.description && roaster.description.toLowerCase().includes(qLower))
        || (roaster.city && roaster.city.toLowerCase().includes(qLower))
        || (roaster.state && roaster.state.toLowerCase().includes(qLower))
      );
    }

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

    // Add imageUrl field for frontend compatibility
    const roastersWithImageUrl = roasters.map((roaster: any) => ({
      ...roaster,
      imageUrl: roaster.images && roaster.images.length > 0 ? roaster.images[0] : 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=600&fit=crop',
    }));

    res.json({
      roasters: roastersWithImageUrl,
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


// Popular searches endpoint
router.get('/popular', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const popular = await prisma.search.findMany({
      orderBy: { count: 'desc' },
      take: limit,
      select: { query: true, count: true },
    });
    res.json({ popular });
  } catch (error) {
    console.error('Popular searches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
