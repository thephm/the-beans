

import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';

const router = Router();
const prisma = new PrismaClient();


// Update user language preference (any authenticated user can update their own language)
router.put('/language', [
  body('language').isLength({ min: 2, max: 5 }).withMessage('Language code must be 2-5 characters'),
], requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;
    const { language } = req.body;

    // Update user language in database
    await prisma.user.update({
      where: { id: userId },
      data: { language }
    });

    res.json({ 
      message: 'Language preference updated successfully',
      language 
    });
  } catch (error) {
    console.error('Error updating language preference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings
router.put('/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const settings = req.body;
    // Persist settings to database
    await prisma.user.update({
      where: { id: userId },
      data: { settings } as any
    });
    res.json({ 
      success: true, 
      message: 'Settings updated successfully',
      settings 
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Admin: Update a user (role, language, etc.)
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const me = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const { id } = req.params;
    const { role, language, firstName, lastName } = req.body;
    const updated = await prisma.user.update({
      where: { id },
      data: { role, language, firstName, lastName },
    });
    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Admin: Delete a user
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const me = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
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
        firstName: true,
        lastName: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        role: true,
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
// force restart
