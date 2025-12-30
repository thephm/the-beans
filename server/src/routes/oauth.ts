import express, { Request, Response } from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

// Admin-only helper - checks role after requireAuth
async function requireAdmin(req: any, res: Response, next: any) {
  try {
    await requireAuth(req, res, (() => {}) as any);
    const user = (req as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Generic OAuth exchange endpoint. Currently supports 'reddit'.
router.post('/exchange', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { service, code, redirectUri } = req.body || {};
    if (!code) return res.status(400).json({ error: 'Missing code in request body' });
    if (!service) return res.status(400).json({ error: 'Missing service in request body' });

    if (service === 'reddit') {
      const clientId = process.env.REDDIT_CLIENT_ID;
      const clientSecret = process.env.REDDIT_CLIENT_SECRET;
      if (!clientId || !clientSecret) return res.status(500).json({ error: 'Reddit client credentials not configured on server' });

      const tokenUrl = 'https://www.reddit.com/api/v1/access_token';
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('code', code);
      if (redirectUri) params.append('redirect_uri', redirectUri);

      const response = await axios.post(tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || 'the-beans-app/1.0',
        },
      });

      const data = response.data || {};
      return res.json({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        scope: data.scope,
      });
    }

    return res.status(400).json({ error: `Unsupported service: ${service}` });
  } catch (err: any) {
    console.error('OAuth exchange error:', err?.response?.data || err?.message || err);
    return res.status(502).json({ error: 'Failed to exchange code for tokens', details: err?.response?.data || err?.message || String(err) });
  }
});

export default router;
