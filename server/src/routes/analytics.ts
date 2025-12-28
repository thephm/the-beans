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
