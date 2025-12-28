import { Request, Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

// Hash IP for privacy
function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export async function captureAnalyticsEvent(req: Request, res: Response) {
  try {
    const { eventType, eventData, sessionId } = req.body;
    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ipHash = ip ? hashIp(Array.isArray(ip) ? ip[0] : ip) : undefined;
    const userAgent = req.headers['user-agent'] || '';
    // If an Authorization token is present, try to determine the user's role.
    // We will avoid recording page_view events for admin users when they view non-admin pages
    // to prevent skewing viewer statistics.
    let isAdminUser = false;
    try {
      const token = (req.headers.authorization as string)?.replace('Bearer ', '') || '';
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        const userId = decoded?.userId;
        if (userId) {
          const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
          if (user && user.role === 'admin') {
            isAdminUser = true;
          }
        }
      }
    } catch (err) {
      // If anything goes wrong while decoding/looking up the user, continue and record event as usual.
    }

    // Skip recording admin page views of non-admin pages to avoid skewing.
    if (eventType === 'page_view' && isAdminUser) {
      const path = eventData?.path || '';
      const isAdminPath = String(path).startsWith('/admin');
      if (!isAdminPath) {
        return res.status(201).json({ success: true, skipped: true });
      }
    }

    await prisma.analyticsEvent.create({
      data: {
        eventType,
        eventData,
        sessionId,
        userAgent,
        ipHash,
      },
    });
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to capture event' });
  }
}

const router = Router();
router.post('/', captureAnalyticsEvent);
export default router;
