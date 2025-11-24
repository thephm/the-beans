
import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { auditBefore, auditAfter, captureOldValues, storeEntityForAudit, auditDelete } from '../middleware/auditMiddleware';
import { createAuditLog } from '../lib/auditService';

const router = Router();

// Admin: Get all users

// Admin: Get all users
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only allow admin users
    const me = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        language: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isDeprecated: true,
        createdById: true,
        updatedById: true,
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }

});

// ...existing code...

// (export moved to end of file)

// ...existing code...


// ...existing code...

// Update user settings
router.put('/settings', requireAuth, auditBefore('user', 'UPDATE'), async (req: any, res: any) => {
  try {
    // Ensure we know who's updating settings
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ...existing code...
    // ...existing code...
    // Admin: Update user by ID
    const settings = req.body;

    // Capture old values for audit
    const oldUser = await prisma.user.findUnique({ where: { id: userId } });
    req.auditData.oldValues = oldUser;
    // Persist settings to database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        settings,
        updatedById: userId // User updated their own settings
      } as any
    });

    // Store entity for audit logging
    res.locals.auditEntity = updatedUser;


    res.json({ 
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Admin: Delete user by ID (with audit logging)
router.delete('/:id', requireAuth, auditDelete('user', prisma.user), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only allow admin users
    const me = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Allow an explicit force delete to remove common dependent records first
    const force = req.query.force === 'true' || req.body?.force === true;
    if (force) {
      // Remove common dependent records that commonly block deletion.
      // This is cautious and only removes favorites, notifications, comments, and reviews.
      await prisma.$transaction([
        prisma.favorite.deleteMany({ where: { userId: req.params.id } }),
        prisma.notification.deleteMany({ where: { userId: req.params.id } }),
        prisma.comment.deleteMany({ where: { userId: req.params.id } }),
        prisma.review.deleteMany({ where: { userId: req.params.id } }),
      ]);
    }

    try {
      await prisma.user.delete({ where: { id: req.params.id } });
      return res.json({ message: 'User deleted successfully' });
    } catch (err) {
      // If we hit a foreign key constraint, return a clearer 409 response
      // with actionable guidance. Prisma throws a PrismaClientKnownRequestError
      // with code 'P2003' for FK violations; include any available meta info.
      const pErr = err as any;
      if (pErr?.code === 'P2003') {
        // Attempt to extract constraint/field information from Prisma meta
        const constraint = pErr?.meta?.constraint || pErr?.meta?.field_name || null;
        const detailParts: any = {
          suggestion: 'Retry with ?force=true to remove favorites, notifications, comments and reviews first, or use POST /api/admin/users/:id/cascade-delete as an admin to perform a broader cleanup.',
          affectedConstraint: constraint,
          removedByForce: ['favorites', 'notifications', 'comments', 'reviews'],
          adminEndpoint: '/api/admin/users/:id/cascade-delete'
        };

        return res.status(409).json({
          error: 'Conflict',
          message: 'Unable to delete user because related records exist which prevent deletion.',
          details: detailParts
        });
      }
      throw err; // rethrow for outer catch
    }
  } catch (error) {
    console.error('Error deleting user by ID:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ...existing code...

// Admin: Update user by ID
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only allow admin users
    const me = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const { role, language, username, email, isDeprecated } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role && { role }),
        ...(language && { language }),
        ...(username && { username }),
        ...(email && { email }),
        ...(typeof isDeprecated === 'boolean' ? { isDeprecated } : {}),
        updatedById: req.user?.id,
      },
      select: {
        id: true,
        email: true,
        username: true,
        language: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isDeprecated: true,
        createdById: true,
        updatedById: true,
      }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user by ID:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Admin: Get user by ID
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only allow admin users
    const me = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        username: true,
        language: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isDeprecated: true,
        createdById: true,
        updatedById: true,
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Admin-only: perform a safe cascade cleanup for a user (deletes common
// dependent records and nullifies some creator/updater fields to allow deletion).
// This is intended for admin use when removing a user that has many related
// records. It does NOT attempt to delete everything in the DB that may
// reference the user — extend as needed for your data model.
router.post('/:id/cascade-delete', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only allow admin users
    const me = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    const userId = req.params.id;

    // Run a transaction to remove common dependent records that typically
    // prevent a user from being deleted due to FK constraints.
    await prisma.$transaction([
      prisma.favorite.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.comment.deleteMany({ where: { userId } }),
      prisma.review.deleteMany({ where: { userId } }),
      prisma.roasterImage.deleteMany({ where: { uploadedById: userId } }),
      prisma.roasterPerson.updateMany({ where: { userId }, data: { userId: null } }),
      // Null out createdBy/updatedBy where appropriate so those records remain
      // but no longer reference the deleted user.
      prisma.bean.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.bean.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),
      prisma.roaster.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.roaster.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),
    ]);

    return res.json({ message: 'Cascade cleanup completed for user (partial).' });
  } catch (error) {
    console.error('Error performing cascade cleanup for user:', error);
    return res.status(500).json({ error: 'Failed to perform cascade cleanup' });
  }
});

  export default router;
