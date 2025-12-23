import { Router } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { prisma } from '../lib/prisma';
import { upload, deleteImage, uploadImageFromUrl } from '../lib/cloudinary';
import { canEditRoaster } from '../middleware/roasterAuth';
import { auditBefore, auditAfter, captureOldValues, storeEntityForAudit } from '../middleware/auditMiddleware';
import { createAuditLog, getClientIP, getUserAgent, getEntityName } from '../lib/auditService';

const router = Router();
// Use shared Prisma client

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
 *         founded:
 *           type: integer
 *           description: Year the roaster was founded
 *         socialNetworks:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Social network URLs/handles (e.g. instagram, facebook, x, etc.)
 *         people:
 *           type: array
 *           description: Array of people/contacts for the roaster
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *               title:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPrimary:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
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
    
    console.log('GET /api/roasters - userId:', req.userId, 'userRole:', userRole);
    
    // Only show verified roasters to non-admin users
    if (userRole !== 'admin') {
      where.verified = true;
      console.log('Non-admin user, filtering to verified roasters only');
    } else {
      console.log('Admin user, showing all roasters (verified and unverified)');
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { roasterSpecialties: { 
            some: { 
              specialty: { 
                translations: { 
                  some: { 
                    name: { contains: search, mode: 'insensitive' } 
                  } 
                } 
              } 
            } 
          } 
        },
      ];
    }
    
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    
    if (state) {
      where.state = { contains: state, mode: 'insensitive' };
    }
    
    if (specialty) {
      where.roasterSpecialties = {
        some: {
          specialty: {
            translations: {
              some: {
                name: { equals: specialty, mode: 'insensitive' }
              }
            }
          }
        }
      };
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
          }
        },
        people: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        roasterImages: {
          orderBy: [
            { isPrimary: 'desc' },
            { uploadedAt: 'asc' }
          ]
        },
        roasterSpecialties: {
          include: {
            specialty: {
              include: {
                translations: {
                  where: {
                    language: req.query.lang || 'en'
                  }
                }
              }
            }
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

    // Add imageUrl and specialties fields for frontend compatibility
    const roastersWithImageUrl = filteredRoasters.map((roaster: any) => {
      // Use the primary image from roasterImages if available, fall back to old images array
      let imageUrl = null;
      if (roaster.roasterImages && roaster.roasterImages.length > 0) {
        // Find primary image first, or use the first image (they're ordered by isPrimary desc)
        imageUrl = roaster.roasterImages[0].url;
      } else if (roaster.images && roaster.images.length > 0) {
        // Fall back to old images array
        imageUrl = roaster.images[0];
      }

      // Transform roasterSpecialties to simple specialty objects
      const specialties = roaster.roasterSpecialties?.map((rs: any) => ({
        id: rs.specialty.id,
        name: rs.specialty.translations[0]?.name || 'Unknown',
        deprecated: rs.specialty.deprecated
      })) || [];

      const result = {
        ...roaster,
        imageUrl,
        specialties,
      };
      
      // Round rating to 1 decimal place
      if (roaster.rating && typeof roaster.rating === 'number') {
        result.rating = parseFloat(roaster.rating.toFixed(1));
      }
      
      // Round distance to 1 decimal place (only available if location filtering was applied)
      if (roaster.distance && typeof roaster.distance === 'number') {
        result.distance = parseFloat(roaster.distance.toFixed(1));
      }

      // Only expose socialNetworks field
      (result as any).socialNetworks = roaster.socialNetworks ?? null;
      
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
          }
        },
        beans: true,
        roasterImages: {
          orderBy: [
            { isPrimary: 'desc' },
            { uploadedAt: 'asc' }
          ]
        },
        roasterSpecialties: {
          include: {
            specialty: {
              include: {
                translations: {
                  where: {
                    language: req.query.lang || 'en'
                  }
                }
              }
            }
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
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

    // Add imageUrl and specialties fields for frontend compatibility
    // Use the primary image from roasterImages if available, fall back to old images array
    let imageUrl = null;
    if (roaster.roasterImages && roaster.roasterImages.length > 0) {
      // Find primary image first, or use the first image (they're ordered by isPrimary desc)
      imageUrl = roaster.roasterImages[0].url;
    } else if (roaster.images && roaster.images.length > 0) {
      // Fall back to old images array
      imageUrl = roaster.images[0];
    }

    // Transform roasterSpecialties to simple specialty objects
    const specialties = roaster.roasterSpecialties?.map((rs: any) => ({
      id: rs.specialty.id,
      name: rs.specialty.translations[0]?.name || 'Unknown',
      deprecated: rs.specialty.deprecated
    })) || [];

    const roasterWithImageUrl = {
      ...roaster,
      imageUrl,
      specialties,
      isFavorited,
    };

    // Only expose socialNetworks field
    (roasterWithImageUrl as any).socialNetworks = roaster.socialNetworks ?? null;

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
  body('specialtyIds').optional().isArray().withMessage('Specialty IDs must be an array'),
  // New nested owner contact validation
  body('ownerContact.email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid owner email address'),
  body('ownerContact.name').optional().isLength({ max: 100 }).withMessage('Owner name must be less than 100 characters'),
  body('ownerContact.bio').optional().isLength({ max: 1000 }).withMessage('Owner bio must be less than 1000 characters'),
  body('ownerContact.mobile').optional().isLength({ max: 20 }).withMessage('Owner mobile must be less than 20 characters'),
  
  // Legacy individual field validation (for backward compatibility)
  body('ownerEmail').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid owner email address'),
  
  // Social network validation
  // New consolidated socialNetworks object (key -> url/handle)
  body('socialNetworks').optional().custom(value => {
    if (typeof value !== 'object' || Array.isArray(value)) throw new Error('socialNetworks must be an object');
    return true;
  }).withMessage('socialNetworks must be an object mapping network->url'),
  // Removed legacy ownerName, ownerBio, ownerMobile validation
  body('sourceType').optional().isIn(['Suggestion','Google','Reddit','ChatGPT','Claude','GoogleMaps','YouTube','Instagram','TikTok','API','Other']).withMessage('Invalid sourceType'),
  body('sourceDetails').optional().isString().isLength({ max: 1000 }).withMessage('Source details must be less than 1000 characters'),
], requireAuth, auditBefore('roaster', 'CREATE'), async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let ownerId = req.userId; // Default to current user
    
    // If ownerEmail is provided, find the owner by email
    if (req.body.ownerEmail && req.body.ownerEmail.trim() !== '') {
      const ownerUser = await prisma.user.findUnique({
        where: { email: req.body.ownerEmail },
        select: { id: true }
      });
      
      if (!ownerUser) {
        return res.status(400).json({ error: 'Owner email not found. User must be registered first.' });
      }
      
      ownerId = ownerUser.id;
    }

    // Check if current user is admin to auto-verify roaster
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });
    const isAdmin = currentUser?.role === 'admin';

    // Consolidate social network fields into socialNetworks object
    const socialKeys = ['instagram','tiktok','facebook','linkedin','youtube','threads','pinterest','bluesky','x','reddit'];
    const socialNetworks: Record<string, string> = {};
    socialKeys.forEach(key => {
      if (req.body[key] && typeof req.body[key] === 'string' && req.body[key].trim() !== '') {
        socialNetworks[key] = req.body[key];
      }
    });
    // If socialNetworks provided as object, merge it in
    if (req.body.socialNetworks && typeof req.body.socialNetworks === 'object' && !Array.isArray(req.body.socialNetworks)) {
      Object.assign(socialNetworks, req.body.socialNetworks);
    }

    const roasterData = {
      ...req.body,
      ownerId: ownerId,
      sourceType: req.body.sourceType,
      sourceDetails: req.body.sourceDetails,
      socialNetworks: Object.keys(socialNetworks).length > 0 ? socialNetworks : undefined,
      verified: false, // Always set verified to false by default
    };
    // Remove fields that aren't part of the Roaster schema
    delete roasterData.ownerEmail;
    delete roasterData.ownerName;
    delete roasterData.ownerBio;
    delete roasterData.ownerMobile;
    delete roasterData.ownerContact; // Remove nested owner contact object
    delete roasterData.specialtyIds; // Will be handled separately
    // Remove individual social fields
    socialKeys.forEach(key => delete roasterData[key]);

    const roaster = await prisma.roaster.create({
      data: {
        ...roasterData,
        createdById: req.userId, // Track who created it
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        },
        roasterSpecialties: {
          include: {
            specialty: {
              include: {
                translations: true
              }
            }
          }
        }
      }
    });

    // Create specialty relationships if provided
    if (req.body.specialtyIds && Array.isArray(req.body.specialtyIds) && req.body.specialtyIds.length > 0) {
      await prisma.roasterSpecialty.createMany({
        data: req.body.specialtyIds.map((specialtyId: string) => ({
          roasterId: roaster.id,
          specialtyId: specialtyId,
        })),
        skipDuplicates: true,
      });
    }

    // Process any image URLs in the images array - upload them to Cloudinary
    if (roasterData.images && Array.isArray(roasterData.images) && roasterData.images.length > 0) {
      try {
        const imageUploadPromises = roasterData.images.map(async (imageUrl: string, index: number) => {
          // Check if it's an external URL (not already a Cloudinary URL)
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') && !imageUrl.includes('cloudinary.com')) {
            const uploadResult = await uploadImageFromUrl(imageUrl, roaster.id);
            if (uploadResult) {
              // Create a RoasterImage record
              await prisma.roasterImage.create({
                data: {
                  roasterId: roaster.id,
                  url: uploadResult.url,
                  publicId: uploadResult.publicId,
                  isPrimary: index === 0, // First image is primary
                  uploadedById: req.userId,
                }
              });
              return uploadResult.url;
            }
          }
          return imageUrl; // Return original URL if already processed or failed
        });

        const processedImages = await Promise.all(imageUploadPromises);
        
        // Update the roaster's images array with the new Cloudinary URLs
        await prisma.roaster.update({
          where: { id: roaster.id },
          data: { 
            images: processedImages.filter(Boolean) // Remove any null/undefined results
          }
        });
      } catch (imageError) {
        console.error('Error processing images for roaster:', imageError);
        // Don't fail the roaster creation if image processing fails
      }
    }

    // Store entity for audit logging and call audit log synchronously
    res.locals.auditEntity = roaster;
    try {
      const { getClientIP, getUserAgent, getEntityName, createAuditLog } = require('../lib/auditService');
      await createAuditLog({
        action: 'CREATE',
        entityType: 'roaster',
        entityId: roaster.id,
        entityName: getEntityName('roaster', roaster),
        userId: req.userId,
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
        oldValues: undefined,
        newValues: roaster
      });
    } catch (auditErr) {
      console.error('Failed to write CREATE audit log for roaster:', auditErr);
    }

    res.status(201).json({
      message: 'Roaster created successfully',
      roaster,
    });
  } catch (error) {
    console.error('Create roaster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}, auditAfter());

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
  body('specialtyIds').optional().isArray().withMessage('Specialty IDs must be an array'),
  body('verified').optional().isBoolean().withMessage('Verified must be true or false'),
  body('featured').optional().isBoolean().withMessage('Featured must be true or false'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  body('ownerEmail').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid owner email address'),
  
  // Social network validation
  // New consolidated socialNetworks object (key -> url/handle)
  body('socialNetworks').optional().custom(value => {
    if (typeof value !== 'object' || Array.isArray(value)) throw new Error('socialNetworks must be an object');
    return true;
  }).withMessage('socialNetworks must be an object mapping network->url'),
  // Removed legacy ownerName, ownerBio, ownerMobile validation
  body('sourceType').optional().isIn(['Suggestion','Google','Reddit','ChatGPT','Claude','GoogleMaps','YouTube','Instagram','TikTok','API','Other']).withMessage('Invalid sourceType'),
  body('sourceDetails').optional().isString().isLength({ max: 1000 }).withMessage('Source details must be less than 1000 characters'),
], requireAuth, auditBefore('roaster', 'UPDATE'), captureOldValues(prisma.roaster), async (req: any, res: any) => {
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
  // Consolidate social network fields into socialNetworks object
  const socialKeys = ['instagram','tiktok','facebook','linkedin','youtube','threads','pinterest','bluesky','x','reddit'];
  const socialNetworks: Record<string, string> = {};
  socialKeys.forEach(key => {
    if (req.body[key] && typeof req.body[key] === 'string' && req.body[key].trim() !== '') {
      socialNetworks[key] = req.body[key];
    }
  });
  // If socialNetworks provided as object, merge it in
  if (req.body.socialNetworks && typeof req.body.socialNetworks === 'object' && !Array.isArray(req.body.socialNetworks)) {
    Object.assign(socialNetworks, req.body.socialNetworks);
  }

  const updateData = { ...req.body };
  if (req.body.sourceType) updateData.sourceType = req.body.sourceType;
  if (req.body.sourceDetails) updateData.sourceDetails = req.body.sourceDetails;
  // Remove deprecated contact fields if present
  delete updateData.ownerName;
  delete updateData.ownerBio;
  delete updateData.ownerMobile;
  delete updateData.ownerContact; // Remove nested owner contact object
  // Remove individual social fields
  socialKeys.forEach(key => delete updateData[key]);
  // Set consolidated socialNetworks
  updateData.socialNetworks = Object.keys(socialNetworks).length > 0 ? socialNetworks : undefined;
  // Handle specialty IDs separately
  const specialtyIds = updateData.specialtyIds;
  delete updateData.specialtyIds;

    // Handle ownerEmail if provided
    if (updateData.ownerEmail !== undefined) {
      if (updateData.ownerEmail && updateData.ownerEmail.trim() !== '') {
        const ownerUser = await prisma.user.findUnique({
          where: { email: updateData.ownerEmail },
          select: { id: true }
        });
        
        if (!ownerUser) {
          return res.status(400).json({ error: 'Owner email not found. User must be registered first.' });
        }
        
        updateData.ownerId = ownerUser.id;
      } else {
        // If ownerEmail is empty, set ownerId to null (no owner)
        updateData.ownerId = null;
      }
      
      // Remove ownerEmail from data as it's not part of the schema
      delete updateData.ownerEmail;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Final cleanup: ensure no top-level social fields remain in updateData before Prisma call
    socialKeys.forEach(key => delete updateData[key]);

    // Capture old specialty IDs for audit trail BEFORE updating
    const oldSpecialtyIds = specialtyIds !== undefined ? (
      await prisma.roasterSpecialty.findMany({
        where: { roasterId: id },
        select: { specialtyId: true }
      })
    ).map((rs: { specialtyId: string }) => rs.specialtyId).sort() : undefined;

    const roaster = await prisma.roaster.update({
      where: { id },
      data: {
        ...updateData,
        updatedById: req.userId, // Track who updated it
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        },
        roasterSpecialties: {
          include: {
            specialty: {
              include: {
                translations: true
              }
            }
          }
        }
      }
    });

    // Update specialty relationships if provided
    if (specialtyIds !== undefined) {
      // Delete existing specialty relationships
      await prisma.roasterSpecialty.deleteMany({
        where: { roasterId: id }
      });
      
      // Create new relationships
      if (Array.isArray(specialtyIds) && specialtyIds.length > 0) {
        await prisma.roasterSpecialty.createMany({
          data: specialtyIds.map((specialtyId: string) => ({
            roasterId: id,
            specialtyId: specialtyId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Process any image URLs in the images array - upload them to Cloudinary
    if (updateData.images && Array.isArray(updateData.images) && updateData.images.length > 0) {
      try {
        const imageUploadPromises = updateData.images.map(async (imageUrl: string, index: number) => {
          // Check if it's an external URL (not already a Cloudinary URL)
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') && !imageUrl.includes('cloudinary.com')) {
            const uploadResult = await uploadImageFromUrl(imageUrl, roaster.id);
            if (uploadResult) {
              // Check if this roaster already has images, to determine if this should be primary
              const existingImageCount = await prisma.roasterImage.count({
                where: { roasterId: roaster.id }
              });
              
              // Create a RoasterImage record
              await prisma.roasterImage.create({
                data: {
                  roasterId: roaster.id,
                  url: uploadResult.url,
                  publicId: uploadResult.publicId,
                  isPrimary: existingImageCount === 0 && index === 0, // First image is primary only if no existing images
                  uploadedById: req.userId,
                }
              });
              return uploadResult.url;
            }
          }
          return imageUrl; // Return original URL if already processed or failed
        });

        const processedImages = await Promise.all(imageUploadPromises);
        
        // Update the roaster's images array with the new Cloudinary URLs
        await prisma.roaster.update({
          where: { id: roaster.id },
          data: { 
            images: processedImages.filter(Boolean) // Remove any null/undefined results
          }
        });
      } catch (imageError) {
        console.error('Error processing images for roaster update:', imageError);
        // Don't fail the roaster update if image processing fails
      }
    }

    // Fetch the updated roaster WITHOUT relations for accurate audit comparison
    const roasterForAudit = await prisma.roaster.findUnique({
      where: { id }
    });

    // Capture new specialty IDs for audit trail AFTER updating
    const newSpecialtyIds = specialtyIds !== undefined ? (
      await prisma.roasterSpecialty.findMany({
        where: { roasterId: id },
        select: { specialtyId: true }
      })
    ).map((rs: { specialtyId: string }) => rs.specialtyId).sort() : undefined;

    // Create audit log directly
    if (roasterForAudit) {
      const oldValues = req.auditData?.oldValues as Record<string, any>;
      const newValues = roasterForAudit as Record<string, any>;
      
      // Add specialty changes to the values if specialties were updated
      if (oldSpecialtyIds !== undefined && newSpecialtyIds !== undefined) {
        oldValues.specialtyIds = oldSpecialtyIds;
        newValues.specialtyIds = newSpecialtyIds;
      }
      
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'roaster',
        entityId: id,
        entityName: getEntityName('roaster', roasterForAudit),
        userId: req.userId,
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
        oldValues,
        newValues,
      });
    }

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
], requireAuth, auditBefore('roaster', 'DELETE'), captureOldValues(prisma.roaster), async (req: any, res: any) => {
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

    // Store the deleted entity for audit (it's already captured in oldValues)
    const deletedEntity = req.auditData?.oldValues || { id };
    res.locals.auditEntity = deletedEntity;

    const deletedRoaster = await prisma.roaster.delete({
      where: { id }
    });

    // Write DELETE audit log synchronously
    try {
      const { getClientIP, getUserAgent, getEntityName, createAuditLog } = require('../lib/auditService');
      await createAuditLog({
        action: 'DELETE',
        entityType: 'roaster',
        entityId: deletedRoaster.id,
        entityName: getEntityName('roaster', deletedRoaster),
        userId: req.userId,
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
        oldValues: deletedRoaster,
        newValues: undefined
      });
    } catch (auditErr) {
      console.error('Failed to write DELETE audit log for roaster:', auditErr);
    }

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
}, auditAfter());

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
          }
        },
        roasterImages: {
          orderBy: [
            { isPrimary: 'desc' },
            { uploadedAt: 'asc' }
          ]
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
    const roastersWithImageUrl = roasters.map((roaster: any) => {
      // Use the primary image from roasterImages if available, fall back to old images array
      let imageUrl = null;
      if (roaster.roasterImages && roaster.roasterImages.length > 0) {
        // Find primary image first, or use the first image (they're ordered by isPrimary desc)
        imageUrl = roaster.roasterImages[0].url;
      } else if (roaster.images && roaster.images.length > 0) {
        // Fall back to old images array
        imageUrl = roaster.images[0];
      }

      return {
        ...roaster,
        imageUrl,
      };
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
], requireAuth, auditBefore('roaster', 'UPDATE'), captureOldValues(prisma.roaster), async (req: any, res: any) => {
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
          }
        }
      }
    });

    // Store entity for audit logging
    res.locals.auditEntity = roaster;

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
}, auditAfter());

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
], requireAuth, auditBefore('roaster_image', 'CREATE'), canEditRoaster, upload.array('images', 10), async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.locals.errorMessage = `Validation failed: ${errors.array().map(e => e.msg).join(', ')}`;
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
    const imagePromises = files.map(async (file: any, index: number) => {
      const isPrimary = setPrimary ? parseInt(setPrimary) === index : false;
      
      // For Cloudinary, file.path is the full URL and file.filename is the public_id
      const imageUrl = file.path; // Cloudinary URL
      const publicId = file.filename; // Cloudinary public_id
      
      return prisma.roasterImage.create({
        data: {
          url: imageUrl,
          publicId: publicId,
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

    // Store entity for audit logging
    res.locals.auditEntity = createdImages.length > 0 ? createdImages[0] : null;
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
    res.locals.errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: 'Internal server error' });
  }
}, auditAfter());

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
], requireAuth, auditBefore('roaster_image', 'UPDATE'), captureOldValues(prisma.roasterImage, 'imageId'), canEditRoaster, async (req: any, res: any) => {
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

    // Store entity for audit logging
    res.locals.auditEntity = updatedImage;

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
}, auditAfter());

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
], requireAuth, auditBefore('roaster_image', 'DELETE'), captureOldValues(prisma.roasterImage, 'imageId'), canEditRoaster, async (req: any, res: any) => {
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

    // Store entity for audit logging (use captured old values)
    res.locals.auditEntity = req.auditData?.oldValues || { id: imageId };

    res.json({
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete roaster image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}, auditAfter());

/**
 * @swagger
 * /api/roasters/{id}/source-countries:
 *   get:
 *     summary: Get roaster's source countries
 *     tags: [Roasters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of source countries for the roaster
 *       404:
 *         description: Roaster not found
 */
router.get('/:id/source-countries', async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const roaster = await prisma.roaster.findUnique({
      where: { id },
      include: {
        sourceCountries: {
          include: {
            country: {
              include: {
                region: true
              }
            }
          }
        }
      }
    });

    if (!roaster) {
      return res.status(404).json({ error: 'Roaster not found' });
    }

    const countries = roaster.sourceCountries.map(sc => sc.country);
    res.json(countries);
  } catch (error) {
    console.error('Error fetching roaster source countries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/roasters/{id}/source-countries:
 *   put:
 *     summary: Update roaster's source countries
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
 *               countryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Source countries updated successfully
 *       404:
 *         description: Roaster not found
 *       403:
 *         description: Not authorized to edit this roaster
 */
router.put('/:id/source-countries', [
  requireAuth,
  param('id').isString().notEmpty(),
  body('countryIds').isArray(),
  body('countryIds.*').isString().notEmpty()
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { countryIds } = req.body;

    // Check if roaster exists and user has permission
    const roaster = await prisma.roaster.findUnique({
      where: { id }
    });

    if (!roaster) {
      return res.status(404).json({ error: 'Roaster not found' });
    }

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user can edit this roaster (admin or owner)
    const isAdmin = user.role === 'admin';
    const isOwner = roaster.ownerId === req.userId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to edit this roaster' });
    }

    // Validate that all country IDs exist
    if (countryIds.length > 0) {
      const countries = await prisma.country.findMany({
        where: { id: { in: countryIds } }
      });

      if (countries.length !== countryIds.length) {
        return res.status(400).json({ error: 'One or more country IDs are invalid' });
      }
    }

    // Remove existing source countries and add new ones
    await prisma.roasterSourceCountry.deleteMany({
      where: { roasterId: id }
    });

    if (countryIds.length > 0) {
      await prisma.roasterSourceCountry.createMany({
        data: countryIds.map((countryId: string) => ({
          roasterId: id,
          countryId
        }))
      });
    }

    // Fetch updated roaster with source countries
    const updatedRoaster = await prisma.roaster.findUnique({
      where: { id },
      include: {
        sourceCountries: {
          include: {
            country: {
              include: {
                region: true
              }
            }
          }
        }
      }
    });

    const countries = updatedRoaster?.sourceCountries.map(sc => sc.country) || [];
    res.json({
      message: 'Source countries updated successfully',
      countries
    });
  } catch (error) {
    console.error('Error updating roaster source countries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
// trigger restart
