import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

export { AuthenticatedRequest };

const prisma = new PrismaClient();

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    
    // Fetch full user details from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, username: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    authReq.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username
    };
    // Some middleware (audit, logging) expect `req.userId` directly — set it for compatibility
    (authReq as any).userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
