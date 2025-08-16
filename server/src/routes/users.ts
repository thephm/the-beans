import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// In-memory settings storage (in production, this would be a database)
const userSettings: { [userId: string]: any } = {};

// Required auth middleware (same as in roasters.ts)
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user settings
router.get('/settings', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    
    // Check if user has saved settings
    let settings = userSettings[userId];
    
    // If no saved settings, return defaults
    if (!settings) {
      settings = {
        notifications: {
          newRoasters: true,
          promotions: true,
          recommendations: false
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
          }
        }
      };
    }
    
    console.log(`Returning settings for user ${userId}:`, settings);
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user language preference
router.put('/language', [
  body('language').isLength({ min: 2, max: 5 }).withMessage('Language code must be 2-5 characters'),
], requireAuth, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
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
router.put('/settings', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const settings = req.body;
    
    console.log(`User ${userId} updating settings:`, settings);
    
    // Save settings to in-memory storage
    userSettings[userId] = settings;
    
    console.log(`Settings saved for user ${userId}. Current storage:`, userSettings);
    
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

// Placeholder routes - these would be implemented similar to roasters.ts
router.get('/', async (req: any, res: any) => {
  res.json({ message: 'Users endpoint - coming soon!' });
});

export default router;
// force restart
