import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to check if user can edit a roaster
 * Allows access if user is:
 * 1. System admin
 * 2. Owner of the roaster
 */
export const canEditRoaster = async (req: any, res: any, next: any) => {
  try {
    const { id: roasterId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Admin can edit any roaster
    if (user.role === 'admin') {
      req.userRole = 'admin';
      return next();
    }

    // Check if user owns the roaster
    const roaster = await prisma.roaster.findUnique({
      where: { id: roasterId },
      select: { ownerId: true }
    });

    if (!roaster) {
      return res.status(404).json({ error: 'Roaster not found' });
    }

    if (roaster.ownerId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own roasters' });
    }

    req.userRole = 'owner';
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user can view roaster management features
 * More permissive than canEditRoaster - allows viewing for owners and admins
 */
export const canViewRoasterManagement = async (req: any, res: any, next: any) => {
  try {
    const { id: roasterId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Admin can view any roaster management
    if (user.role === 'admin') {
      req.userRole = 'admin';
      return next();
    }

    // Check if user owns the roaster
    const roaster = await prisma.roaster.findUnique({
      where: { id: roasterId },
      select: { ownerId: true }
    });

    if (!roaster) {
      return res.status(404).json({ error: 'Roaster not found' });
    }

    if (roaster.ownerId !== userId) {
      return res.status(403).json({ error: 'You can only manage your own roasters' });
    }

    req.userRole = 'owner';
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};