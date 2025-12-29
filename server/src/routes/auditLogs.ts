import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { parseDateOnlyStart, parseDateOnlyEnd } from '../lib/dateUtils';

const router = Router();
// Use shared Prisma client

// Required auth middleware
const requireAuth = async (req: any, res: any, next: any) => {
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

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin only middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     summary: Get audit logs (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE]
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 */
router.get('/audit-logs', 
  requireAuth,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE']).withMessage('Invalid action'),
    query('entityType').optional().isString().withMessage('Entity type must be a string'),
    query('userId').optional().isString().withMessage('User ID must be a string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date')
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build filter conditions
      const where: any = {};

      if (req.query.action) {
        where.action = req.query.action;
      }

      if (req.query.entityType) {
        where.entityType = req.query.entityType;
      }

      if (req.query.userId) {
        where.userId = req.query.userId;
      }

      if (req.query.startDate || req.query.endDate) {
        where.createdAt = {};
        if (req.query.startDate) {
          where.createdAt.gte = parseDateOnlyStart(req.query.startDate);
        }
        if (req.query.endDate) {
          where.createdAt.lte = parseDateOnlyEnd(req.query.endDate);
        }
      }

      // Get audit logs with user information
      const [auditLogs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: [
            { createdAt: 'desc' },
            { id: 'desc' }
          ],
          skip,
          take: limit
        }),
        prisma.auditLog.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      // Set cache-control headers to prevent browser caching
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });

      // Ensure createdAt is always an ISO string for frontend compatibility
      res.json({
        auditLogs: auditLogs.map(log => ({
          ...log,
          createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

/**
 * @swagger
 * /api/admin/audit-logs/stats:
 *   get:
 *     summary: Get audit log statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit log statistics
 */
router.get('/audit-logs/stats',
  requireAuth,
  requireAdmin,
  async (req: any, res: any) => {
    try {
      // Get statistics for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalLogs,
        recentLogs,
        actionStats,
        entityTypeStats,
        topUsers
      ] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.count({
          where: {
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: { action: true },
          where: {
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        prisma.auditLog.groupBy({
          by: ['entityType'],
          _count: { entityType: true },
          where: {
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          _count: { userId: true },
          where: {
            createdAt: { gte: thirtyDaysAgo }
          },
          orderBy: {
            _count: { userId: 'desc' }
          },
          take: 5
        })
      ]);

      // Get user details for top users (filter out null userIds)
      const topUserIds = topUsers.map(u => u.userId).filter((id): id is string => id !== null);
      const userDetails = await prisma.user.findMany({
        where: { id: { in: topUserIds } },
        select: {
          id: true,
          username: true,
          email: true
        }
      });

      const topUsersWithDetails = topUsers
        .filter(stat => stat.userId !== null)
        .map(stat => {
          const user = userDetails.find(u => u.id === stat.userId);
          return {
            user,
            count: stat._count.userId
          };
        });

      res.json({
        totalLogs,
        recentLogs,
        actionStats: actionStats.map(stat => ({
          action: stat.action,
          count: stat._count.action
        })),
        entityTypeStats: entityTypeStats.map(stat => ({
          entityType: stat.entityType,
          count: stat._count.entityType
        })),
        topUsers: topUsersWithDetails
      });
    } catch (error) {
      console.error('Error fetching audit log stats:', error);
      res.status(500).json({ error: 'Failed to fetch audit log statistics' });
    }
  }
);

/**
 * @swagger
 * /api/admin/audit-logs/{id}:
 *   get:
 *     summary: Get a specific audit log entry (Admin only)
 *     tags: [Admin]
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
 *         description: Audit log entry retrieved successfully
 *       404:
 *         description: Audit log entry not found
 */
router.get('/audit-logs/:id',
  requireAuth,
  requireAdmin,
  async (req: any, res: any) => {
    try {
      const auditLog = await prisma.auditLog.findUnique({
        where: { id: req.params.id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      if (!auditLog) {
        return res.status(404).json({ error: 'Audit log entry not found' });
      }

      res.json(auditLog);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      res.status(500).json({ error: 'Failed to fetch audit log' });
    }
  }
);

export default router;