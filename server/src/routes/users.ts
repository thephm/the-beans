
import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

import { auditBefore, auditAfter, captureOldValues, storeEntityForAudit, auditDelete } from '../middleware/auditMiddleware';
import { createAuditLog } from '../lib/auditService';

const router = Router();

// Admin: Get all users

// Admin: Get all users
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as import('../types').AuthenticatedRequest;

  try {
    // Only allow admin users
    const me = await prisma.user.findUnique({ where: { id: authReq.user?.id }, select: { role: true } });
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
router.put('/settings', requireAuth, auditBefore('user', 'UPDATE'), async (req: Request, res: Response) => {
  const authReq = req as import('../types').AuthenticatedRequest;

  try {
    // Ensure we know who's updating settings
    const userId = authReq.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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
router.delete('/:id', requireAuth, auditDelete('user', prisma.user), async (req: Request, res: Response) => {
  const authReq = req as import('../types').AuthenticatedRequest;

  try {
    // Only allow admin users
    const me = await prisma.user.findUnique({ where: { id: authReq.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    const userId = req.params.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Perform a comprehensive cleanup similar to the previous admin cascade endpoint,
    // then delete the user. We keep roaster rows but nullify owner/createdBy/updatedBy references.
    await prisma.$transaction([
      // Remove direct user-owned relations
      prisma.favorite.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),

      // Comments: remove comments created by the user, and comments on reviews
      // written by the user (other users' comments on these reviews).
      prisma.comment.deleteMany({ where: { OR: [{ userId }, { review: { userId } }] } }),

      // Delete reviews authored by the user (after comments removed)
      prisma.review.deleteMany({ where: { userId } }),

      // Remove images uploaded by the user
      prisma.roasterImage.deleteMany({ where: { uploadedById: userId } }),

      // Nullify user references on RoasterPerson entries
      prisma.roasterPerson.updateMany({ where: { userId }, data: { userId: null } }),
      prisma.roasterPerson.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.roasterPerson.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),

      // Null out createdBy/updatedBy on beans and roasters (do not delete roasters)
      prisma.bean.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.bean.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),
      prisma.roaster.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.roaster.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),

      // Nullify owner relationship on roasters the user owned
      prisma.roaster.updateMany({ where: { ownerId: userId }, data: { ownerId: null } }),

      // Nullify createdBy/updatedBy on reviews (if any remain)
      prisma.review.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.review.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),

      // Nullify audit logs referencing this user (keep logs, but detach user)
      prisma.auditLog.updateMany({ where: { userId }, data: { userId: null } }),

      // Nullify createdBy/updatedBy on other users referencing this user
      prisma.user.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.user.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),

      // Finally remove the user record itself
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return res.json({ message: 'User deleted successfully (cascade cleanup applied).' });
  } catch (error) {
    console.error('Error deleting user by ID:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ...existing code...

// Update current user's language preference
router.put('/language', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as import('../types').AuthenticatedRequest;
  try {
    const userId = authReq.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { language } = req.body;
    if (!language || typeof language !== 'string') {
      return res.status(400).json({ error: 'Invalid language value' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { language, updatedById: userId },
      select: { id: true, email: true, username: true, language: true }
    });

    res.json({ message: 'Language updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user language:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Admin: Update user by ID
router.put('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as import('../types').AuthenticatedRequest;
  // If a literal path segment like 'language' is passed, skip this dynamic handler
  // so a more specific route (e.g. /language) can handle it.
  if (req.params.id === 'language') return next();

  try {
    // Only allow admin users
    const me = await prisma.user.findUnique({ where: { id: authReq.user?.id }, select: { role: true } });
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
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as import('../types').AuthenticatedRequest;

  try {
    // Only allow admin users
    const me = await prisma.user.findUnique({ where: { id: authReq.user?.id }, select: { role: true } });
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
router.post('/:id/cascade-delete', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as import('../types').AuthenticatedRequest;

  try {
    // Only allow admin users
    const me = await prisma.user.findUnique({ where: { id: authReq.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    const userId = req.params.id;

    await prisma.$transaction([
      // Remove direct user-owned relations
      prisma.favorite.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),

      // Comments: remove comments created by the user, and comments on reviews
      // written by the user (other users' comments on these reviews).
      prisma.comment.deleteMany({ where: { OR: [{ userId }, { review: { userId } }] } }),

      // Delete reviews authored by the user (after comments removed)
      prisma.review.deleteMany({ where: { userId } }),

      // Remove images uploaded by the user
      prisma.roasterImage.deleteMany({ where: { uploadedById: userId } }),

      // Nullify user references on RoasterPerson entries
      prisma.roasterPerson.updateMany({ where: { userId }, data: { userId: null } }),
      prisma.roasterPerson.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.roasterPerson.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),

      // Null out createdBy/updatedBy on beans and roasters
      prisma.bean.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.bean.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),
      prisma.roaster.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.roaster.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),

      // Nullify owner relationship on roasters the user owned
      prisma.roaster.updateMany({ where: { ownerId: userId }, data: { ownerId: null } }),

      // Nullify createdBy/updatedBy on reviews (if any remain)
      prisma.review.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.review.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),

      // Nullify audit logs referencing this user (keep logs, but detach user)
      prisma.auditLog.updateMany({ where: { userId }, data: { userId: null } }),

      // Nullify createdBy/updatedBy on other users referencing this user
      prisma.user.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.user.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),
    ]);

    return res.json({ message: 'Cascade cleanup completed for user (partial).' });
  } catch (error) {
    console.error('Error performing cascade cleanup for user:', error);
    return res.status(500).json({ error: 'Failed to perform cascade cleanup' });
  }
});

// Update current user's language preference
router.put('/language', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as import('../types').AuthenticatedRequest;
  try {
    const userId = authReq.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { language } = req.body;
    if (!language || typeof language !== 'string') {
      return res.status(400).json({ error: 'Invalid language value' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { language, updatedById: userId },
      select: { id: true, email: true, username: true, language: true }
    });

    res.json({ message: 'Language updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user language:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
