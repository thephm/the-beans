import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';

// Updated search routes with image URL support - roasters only
const router = Router();
// Use shared Prisma client

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
  query('radius').optional().isFloat({ min: 1, max: 20037 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, search, type = 'roasters', latitude, longitude } = req.query;
    // Accept both ?q= and ?search= for search term
    const searchQuery = (typeof q === 'string' && q) || (typeof search === 'string' && search) || '';

    // Get user's preferred search radius from settings, or use provided radius, or default to 25
    const user = (req as any).user;
    let defaultRadius = 25;
    if (user?.settings?.preferences?.searchRadius) {
      defaultRadius = user.settings.preferences.searchRadius;
    }
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : defaultRadius;

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
    let roasters = await prisma.roaster.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        roasterSpecialties: {
          include: {
            specialty: {
              include: {
                translations: true
              }
            }
          }
        },
        roasterImages: {
          orderBy: [
            { isPrimary: 'desc' },
            { uploadedAt: 'asc' }
          ]
        }
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
        (roaster.roasterSpecialties && roaster.roasterSpecialties.some((rs: any) => 
          rs.specialty.translations.some((t: any) => t.name.toLowerCase() === qLower || t.name.toLowerCase().includes(qLower))
        ))
        || roaster.name.toLowerCase().includes(qLower)
        || (roaster.description && roaster.description.toLowerCase().includes(qLower))
        || (roaster.city && roaster.city.toLowerCase().includes(qLower))
        || (roaster.state && roaster.state.toLowerCase().includes(qLower))
      );
    }

    // Progressive loading: separate exact city matches from radius matches
    let exactMatches: any[] = [];
    let radiusMatches: any[] = [];

    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const maxRadius = typeof radius === 'number' ? radius : parseFloat(radius as string);
      const qLower = searchQuery.trim().toLowerCase();
      
      roasters.forEach((roaster: any) => {
        // Check if this is an exact city match
        const isExactCityMatch = roaster.city && roaster.city.toLowerCase().includes(qLower);
        
        // Calculate distance if coordinates exist
        if (roaster.latitude && roaster.longitude) {
          const distance = calculateDistance(
            lat,
            lng,
            roaster.latitude,
            roaster.longitude
          );
          
          if (distance <= maxRadius) {
            // Add distance info to roaster
            (roaster as any).distance = distance;
            
            // Categorize as exact or radius match
            if (isExactCityMatch) {
              exactMatches.push(roaster);
            } else {
              radiusMatches.push(roaster);
            }
          }
        } else if (isExactCityMatch) {
          // Include exact city matches even without coordinates
          exactMatches.push(roaster);
        }
      });
    } else {
      // No radius filtering, all results are "exact" matches
      exactMatches = roasters;
    }

    // Helper function to transform roaster data
    const transformRoaster = (roaster: any, matchType: string) => {
      let imageUrl = null;
      if (roaster.roasterImages && roaster.roasterImages.length > 0) {
        imageUrl = roaster.roasterImages[0].url;
      } else if (roaster.images && roaster.images.length > 0) {
        imageUrl = roaster.images[0];
      } else {
        imageUrl = 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=600&fit=crop';
      }

      const specialties = roaster.roasterSpecialties?.map((rs: any) => ({
        id: rs.specialty.id,
        name: rs.specialty.translations[0]?.name || 'Unknown',
        deprecated: rs.specialty.deprecated
      })) || [];

      return {
        ...roaster,
        imageUrl,
        specialties,
        matchType, // 'exact' or 'radius'
        distance: roaster.distance || null
      };
    };

    // Transform both sets
    const exactRoasters = exactMatches.map(r => transformRoaster(r, 'exact'));
    const radiusRoasters = radiusMatches.map(r => transformRoaster(r, 'radius'));

    res.json({
      roasters: [...exactRoasters, ...radiusRoasters],
      exact: exactRoasters,
      radius: radiusRoasters,
      total: exactRoasters.length + radiusRoasters.length,
      counts: {
        exact: exactRoasters.length,
        radius: radiusRoasters.length
      }
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
  query('radius').optional().isFloat({ min: 1, max: 20037 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, specialty, location, sort, latitude, longitude } = req.query;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    
    // Get user's preferred search radius from settings, or use provided radius, or default to 25
    const user = (req as any).user;
    let defaultRadius = 25;
    if (user?.settings?.preferences?.searchRadius) {
      defaultRadius = user.settings.preferences.searchRadius;
    }
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : defaultRadius;
    
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

    // Build AND clause combining search query and location filters
    const andClauses: any[] = [];

    if (q && typeof q === 'string') {
      const qLower = q.trim();
      andClauses.push({
        OR: [
          { name: { contains: qLower, mode: 'insensitive' } },
          { description: { contains: qLower, mode: 'insensitive' } },
          { city: { contains: qLower, mode: 'insensitive' } },
          { state: { contains: qLower, mode: 'insensitive' } },
          {
            roasterSpecialties: {
              some: {
                specialty: {
                  translations: {
                    some: { name: { contains: qLower, mode: 'insensitive' } }
                  }
                }
              }
            }
          }
        ]
      });
    }
    
    // Only add location text filter if no coordinates provided (otherwise we'll do radius filtering)
    if (location && !(latitude && longitude)) {
      andClauses.push({
        OR: [
          { city: { contains: location as string, mode: 'insensitive' } },
          { state: { contains: location as string, mode: 'insensitive' } },
          { address: { contains: location as string, mode: 'insensitive' } },
        ]
      });
    }

    // Combine all filters with AND logic
    if (andClauses.length > 0) {
      whereClause.AND = andClauses;
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

    // Add distance calculation and filtering if coordinates provided
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const maxRadius = typeof radius === 'number' ? radius : parseFloat(radius as string);

      // Fetch candidates matching textual/location filters
      const candidates = await prisma.roaster.findMany({
        where: whereClause,
        include: {
          owner: { select: { id: true, username: true } },
          reviews: { select: { rating: true } },
          roasterSpecialties: { include: { specialty: { include: { translations: true } } } },
          roasterImages: { orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }] }
        },
        orderBy,
      });

      const filtered = candidates.filter((roaster: any) => {
        if (!roaster.latitude || !roaster.longitude) return false;
        const distance = calculateDistance(lat, lng, roaster.latitude, roaster.longitude);
        return distance <= maxRadius;
      });

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const pageStart = (page - 1) * limit;
      const pageItems = filtered.slice(pageStart, pageStart + limit);

      const roastersWithImageUrl = pageItems.map((roaster: any) => {
        let imageUrl = null;
        if (roaster.roasterImages && roaster.roasterImages.length > 0) {
          imageUrl = roaster.roasterImages[0].url;
        } else if (roaster.images && roaster.images.length > 0) {
          imageUrl = roaster.images[0];
        } else {
          imageUrl = 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=600&fit=crop';
        }

        const specialties = roaster.roasterSpecialties?.map((rs: any) => ({
          id: rs.specialty.id,
          name: rs.specialty.translations[0]?.name || 'Unknown',
          deprecated: rs.specialty.deprecated
        })) || [];

        return { ...roaster, imageUrl, specialties };
      });

      return res.json({ roasters: roastersWithImageUrl, pagination: { total, page, limit, totalPages } });
    }

    // No coordinates provided: use DB pagination
    const total = await prisma.roaster.count({ where: whereClause });
    const roasters = await prisma.roaster.findMany({
      where: whereClause,
      include: {
        owner: { select: { id: true, username: true } },
        reviews: { select: { rating: true } },
        roasterSpecialties: { include: { specialty: { include: { translations: true } } } },
        roasterImages: { orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }] }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const roastersWithImageUrl = roasters.map((roaster: any) => {
      let imageUrl = null;
      if (roaster.roasterImages && roaster.roasterImages.length > 0) {
        imageUrl = roaster.roasterImages[0].url;
      } else if (roaster.images && roaster.images.length > 0) {
        imageUrl = roaster.images[0];
      } else {
        imageUrl = 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=600&fit=crop';
      }

      const specialties = roaster.roasterSpecialties?.map((rs: any) => ({
        id: rs.specialty.id,
        name: rs.specialty.translations[0]?.name || 'Unknown',
        deprecated: rs.specialty.deprecated
      })) || [];

      return { ...roaster, imageUrl, specialties };
    });

    res.json({ roasters: roastersWithImageUrl, pagination: { total, page, limit, totalPages } });
  } catch (error) {
    console.error('Roaster search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
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
