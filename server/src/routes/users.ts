

import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { auditBefore, auditAfter, captureOldValues, storeEntityForAudit } from '../middleware/auditMiddleware';
import { createAuditLog } from '../lib/auditService';

const router = Router();
const prisma = new PrismaClient();


// Update user language preference (any authenticated user can update their own language)
router.put('/language', [
  body('language').isLength({ min: 2, max: 5 }).withMessage('Language code must be 2-5 characters'),
], requireAuth, auditBefore('user', 'UPDATE'), async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;
    req.userId = userId; // Set for audit middleware
    const { language } = req.body;

    // Capture old values for audit
    const oldUser = await prisma.user.findUnique({ where: { id: userId } });
    req.auditData.oldValues = oldUser;

    // Update user language in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        language,
        updatedById: userId // User updated their own language preference
      }
    });

    // Store entity for audit logging
    res.locals.auditEntity = updatedUser;

    res.json({ 
      message: 'Language preference updated successfully',
      language 
    });
  } catch (error) {
    console.error('Error updating language preference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}, auditAfter());

// Update user settings
router.put('/settings', requireAuth, auditBefore('user', 'UPDATE'), async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    req.userId = userId; // Set for audit middleware
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
      success: true, 
      message: 'Settings updated successfully',
      settings 
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}, auditAfter());

// Admin: Update a user (role, language, etc.)
router.put('/:id', requireAuth, auditBefore('user', 'UPDATE'), async (req: any, res: any) => {
  try {
    req.userId = req.user?.id; // Set for audit middleware
    const me = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const { id } = req.params;
    
    // Capture old values for audit
    const oldUser = await prisma.user.findUnique({ where: { id } });
    req.auditData.oldValues = oldUser;
    
    const { role, language, isDeprecated } = req.body;
    const updateData: any = {
      updatedById: req.userId
    };
    if (typeof role !== 'undefined') updateData.role = role;
    if (typeof language !== 'undefined') updateData.language = language;
    if (typeof isDeprecated !== 'undefined') updateData.isDeprecated = isDeprecated;
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Store entity for audit logging
    res.locals.auditEntity = updated;

    // Call audit logging directly since middleware doesn't run after response
    const auditMiddleware = auditAfter();
    await auditMiddleware(req, res, () => {});

    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}, auditAfter());

// Admin: Delete a user
router.delete('/:id', requireAuth, auditBefore('user', 'DELETE'), captureOldValues(prisma.user), async (req: any, res: any) => {
  try {
    req.userId = req.user?.id; // Set for audit middleware
    
    const me = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const { id } = req.params;
    
    // Store the user being deleted for audit
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (userToDelete) {
      res.locals.auditEntity = {
        entityName: 'user',
        entityId: userToDelete.id,
        entityData: userToDelete
      };
    }
    
    // Check for related records before deleting
    const related = await Promise.all([
      prisma.review.findFirst({ where: { userId: id } }),
      prisma.favorite.findFirst({ where: { userId: id } }),
      prisma.roaster.findFirst({ where: { ownerId: id } }),
      prisma.roaster.findFirst({ where: { createdById: id } }),
      prisma.roaster.findFirst({ where: { updatedById: id } }),
      prisma.roasterPerson.findFirst({ where: { userId: id } }),
      prisma.bean.findFirst({ where: { createdById: id } }),
      prisma.bean.findFirst({ where: { updatedById: id } }),
      prisma.comment.findFirst({ where: { userId: id } }),
      prisma.notification.findFirst({ where: { userId: id } }),
      prisma.auditLog.findFirst({ where: { userId: id } })
    ]);
    if (related.some(r => r)) {
      // Soft deprecate user if related records exist
      await prisma.user.update({ where: { id }, data: { isDeprecated: true } });
      return res.json({ success: true, deprecated: true });
    }
    await prisma.user.delete({ where: { id } });
    
    // Create audit log manually (same pattern as roasters)
    if (req.auditData && req.userId) {
      await createAuditLog({
        action: 'DELETE',
        entityType: 'user',
        entityId: id,
        userId: req.userId,
        oldValues: res.locals.oldValues || userToDelete,
        newValues: undefined, // DELETE operations have no new values
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user settings
router.get('/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    // Fetch settings from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true }
    }) as { settings?: any };
    let settings = user?.settings;
    // If no saved settings, return defaults
    if (!settings) {
      settings = {
        notifications: {
        },
        privacy: {
          showProfile: true,
          allowLocationTracking: false
        },
        preferences: {
          roastLevel: 'no-preference',
          brewingMethods: {
            espresso: false,
            pourOver: false,
            frenchPress: false,
            coldBrew: false
          },
          distanceUnit: 'km'
        }
      };
    }
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Placeholder routes - these would be implemented similar to roasters.ts

// Admin: Get all users (basic info)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Fetch requesting user's role
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
        createdBy: {
          select: {
            id: true,
            username: true,
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
          }
        },
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Get a specific user by ID
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Fetch requesting user's role
    const me = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
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
        createdBy: {
          select: {
            id: true,
            username: true,
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
          }
        },
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
// force restart
