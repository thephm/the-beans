import { Router } from 'express';
import { param } from 'express-validator';
import { prisma } from '../lib/prisma';

const router = Router();
// Use shared Prisma client

// Debug endpoint to help troubleshoot authentication issues
router.get('/auth/validate/:roasterId?', async (req: any, res: any) => {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer
    },
    environment: process.env.NODE_ENV,
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
  };

  try {
    // Check if token is provided
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.json({
        ...debugInfo,
        status: 'error',
        error: 'No token provided',
        authHeader: req.headers.authorization
      });
    }

    debugInfo.tokenLength = token.length;
    debugInfo.tokenPrefix = token.substring(0, 10) + '...';

    // Try to verify token
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
      debugInfo.tokenValid = true;
      debugInfo.userId = decoded.userId;
    } catch (jwtError: any) {
      debugInfo.tokenValid = false;
      debugInfo.jwtError = jwtError.message;
      return res.json({
        ...debugInfo,
        status: 'error',
        error: 'Invalid token'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      debugInfo.userExists = false;
      return res.json({
        ...debugInfo,
        status: 'error',
        error: 'User not found'
      });
    }

    debugInfo.userExists = true;
    debugInfo.userRole = user.role;
    debugInfo.userEmail = user.email;

    // If roaster ID provided, check permissions
    if (req.params.roasterId) {
      const roaster = await prisma.roaster.findUnique({
        where: { id: req.params.roasterId },
        select: { id: true, name: true, email: true, ownerId: true }
      });

      if (!roaster) {
        debugInfo.roasterExists = false;
        return res.json({
          ...debugInfo,
          status: 'error',
          error: 'Roaster not found'
        });
      }

      debugInfo.roasterExists = true;
      debugInfo.roasterName = roaster.name;
      debugInfo.isAdmin = user.role === 'admin';
      debugInfo.isOwner = roaster.ownerId === user.id;
      debugInfo.canEdit = user.role === 'admin' || roaster.ownerId === user.id;

      // Check if user email matches roaster email (legacy permission)
      if (roaster.email && user.email) {
        debugInfo.emailMatch = roaster.email === user.email;
        debugInfo.canEdit = debugInfo.canEdit || debugInfo.emailMatch;
      }
    }

    return res.json({
      ...debugInfo,
      status: 'success',
      message: 'Authentication valid'
    });

  } catch (error: any) {
    return res.json({
      ...debugInfo,
      status: 'error',
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;