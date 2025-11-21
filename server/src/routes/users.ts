
import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { auditBefore, auditAfter, captureOldValues, storeEntityForAudit } from '../middleware/auditMiddleware';
import { createAuditLog } from '../lib/auditService';

const router = Router();

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

    // Capture old values for audit
    const oldUser = await prisma.user.findUnique({ where: { id: userId } });
    req.auditData.oldValues = oldUser;

    // Extract language from request body
    const { language } = req.body;
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
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
