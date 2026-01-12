import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { createAuditLog, getClientIP, getUserAgent } from '../lib/auditService';

const router = express.Router();

// Admin only middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    
    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper function to infer social network from URL
function inferSocialNetwork(url: string): string {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) {
    return 'Instagram';
  } else if (urlLower.includes('threads.net') || urlLower.includes('threads.com')) {
    return 'Threads';
  } else if (urlLower.includes('reddit.com')) {
    return 'Reddit';
  } else if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) {
    return 'Facebook';
  } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'Twitter';
  } else if (urlLower.includes('tiktok.com')) {
    return 'TikTok';
  } else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'YouTube';
  } else if (urlLower.includes('linkedin.com')) {
    return 'LinkedIn';
  }
  
  return 'Other';
}

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts (admin only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: roasterId
 *         schema:
 *           type: string
 *         description: Filter by roaster ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of posts
 */
router.get('/', requireAdmin, async (req: any, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const roasterId = req.query.roasterId as string;
    const sortBy = (req.query.sortBy as string) || 'postedAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const where: any = {};
    if (roasterId) {
      where.roasterId = roasterId;
    }

    // Handle sorting by roaster (relation) - need to sort by roaster.name
    let orderBy: any;
    if (sortBy === 'roaster') {
      orderBy = { roaster: { name: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          roaster: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              country: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.post.count({ where })
    ]);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post (admin only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roasterId
 *               - url
 *             properties:
 *               roasterId:
 *                 type: string
 *               url:
 *                 type: string
 *               postedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Post created successfully
 */
router.post(
  '/',
  requireAdmin,
  [
    body('roasterId').notEmpty().withMessage('Roaster ID is required'),
    body('url').isURL().withMessage('Valid URL is required')
  ],
  async (req: any, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { roasterId, url, postedAt } = req.body;

      // Verify roaster exists
      const roaster = await prisma.roaster.findUnique({
        where: { id: roasterId }
      });

      if (!roaster) {
        return res.status(404).json({ error: 'Roaster not found' });
      }

      // Infer social network from URL
      const socialNetwork = inferSocialNetwork(url);

      // Create post
      const post = await prisma.post.create({
        data: {
          roasterId,
          url,
          socialNetwork,
          postedAt: postedAt ? new Date(postedAt) : new Date(),
          createdById: req.userId
        },
        include: {
          roaster: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              country: true
            }
          }
        }
      });

      // Create audit log
      await createAuditLog({
        action: 'CREATE',
        entityType: 'Post',
        entityId: post.id,
        entityName: `${roaster.name} - ${socialNetwork}`,
        newValues: { roasterId, url, socialNetwork },
        userId: req.userId,
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      res.status(201).json(post);
    } catch (error: any) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }
);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post (admin only)
 *     tags: [Posts]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roasterId:
 *                 type: string
 *               url:
 *                 type: string
 *               postedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Post updated successfully
 */
router.put(
  '/:id',
  requireAdmin,
  [
    body('url').optional().isURL().withMessage('Valid URL is required')
  ],
  async (req: any, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { roasterId, url, postedAt } = req.body;

      // Get existing post
      const existingPost = await prisma.post.findUnique({
        where: { id },
        include: { roaster: true }
      });

      if (!existingPost) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // If roasterId is changing, verify new roaster exists
      if (roasterId && roasterId !== existingPost.roasterId) {
        const roaster = await prisma.roaster.findUnique({
          where: { id: roasterId }
        });
        if (!roaster) {
          return res.status(404).json({ error: 'Roaster not found' });
        }
      }

      const updateData: any = {};
      if (roasterId) updateData.roasterId = roasterId;
      if (url) {
        updateData.url = url;
        updateData.socialNetwork = inferSocialNetwork(url);
      }
      if (postedAt) updateData.postedAt = new Date(postedAt);

      // Update post
      const post = await prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          roaster: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              country: true
            }
          }
        }
      });

      // Create audit log
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'Post',
        entityId: post.id,
        entityName: `${post.roaster.name} - ${post.socialNetwork}`,
        newValues: updateData,
        userId: req.userId,
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      res.json(post);
    } catch (error: any) {
      console.error('Error updating post:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  }
);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post (admin only)
 *     tags: [Posts]
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
 *         description: Post deleted successfully
 */
router.delete('/:id', requireAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: { roaster: true }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await prisma.post.delete({
      where: { id }
    });

    // Create audit log
    await createAuditLog({
      action: 'DELETE',
      entityType: 'Post',
      entityId: id,
      entityName: `${existingPost.roaster.name} - ${existingPost.socialNetwork}`,
      newValues: { deleted: true },
      userId: req.userId,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
