import { Router, Request, Response } from 'express';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: { role?: string; [key: string]: any };
    }
  }
}
import { getEventStats } from '../lib/analyticsService';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// Admin analytics stats endpoint
router.get('/stats', requireAuth, async (req: Request, res: Response) => {

  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const { eventType, from, to, groupBy, page } = req.query;
    // Validate and normalize optional `page` query (string or array) to avoid injection and ensure sensible values.
    let normalizedPages: string[] | undefined;
    if (page) {
      const pages = Array.isArray(page) ? page.map(String) : [String(page)];
      normalizedPages = [];
      const pageRegex = /^\/[A-Za-z0-9\-\/_?=&.%]*$/;
      for (let p of pages) {
        try { p = decodeURIComponent(p); } catch (e) { /* ignore */ }
        p = p.trim();
        if (!p.startsWith('/')) p = '/' + p;
        if (p.length > 200 || !pageRegex.test(p)) {
          return res.status(400).json({ error: 'Invalid page parameter' });
        }
        normalizedPages.push(p);
      }
    }
    // Validate `from` and `to` date query parameters to avoid creating
    // invalid Date objects which can cause server-side query failures.
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    if (from) {
      fromDate = new Date(String(from));
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({ error: 'Invalid from date' });
      }
    }
    if (to) {
      toDate = new Date(String(to));
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid to date' });
      }
    }

    const stats = await getEventStats({
      eventType: eventType as string,
      from: fromDate,
      to: toDate,
      groupBy: (groupBy as 'day' | 'hour') || 'day',
      page: normalizedPages as any,
    });
    // Return stats directly; global `bigintSerializer` middleware will
    // convert any BigInt values to safe JSON types.
    res.json(stats);
  } catch (err) {
    console.error('Error fetching analytics stats:', err);
    res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
});

export default router;
