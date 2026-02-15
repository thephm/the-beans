import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    req.userId = decoded.userId;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const extractInstagramHandle = (url: string): string | null => {
  if (!url) return null;
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  try {
    const parsed = new URL(normalized);
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) return null;
    return pathSegments[0];
  } catch {
    return null;
  }
};

const normalizeInstagramHandle = (handle: string | null): string | null => {
  if (!handle) return null;
  const normalized = handle.trim();
  if (!normalized) return null;
  return normalized.toLowerCase();
};

const normalizeInstagramUrl = (url: string): string | null => {
  const handle = normalizeInstagramHandle(extractInstagramHandle(url));
  if (!handle) return null;
  return `https://www.instagram.com/${handle}`;
};

router.post(
  '/instagram-import/scan',
  [
    body('accounts').isArray({ min: 1 }).withMessage('accounts must be a non-empty array'),
    body('accounts.*.href').isString().withMessage('Each account must include an href string'),
    body('accounts.*.title').optional().isString(),
  ],
  requireAdmin,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const accounts = req.body.accounts as Array<{ title?: string; href: string; value?: string }>;

    const normalizedAccounts = accounts
      .map((account) => {
        const instagramUrl = normalizeInstagramUrl(account.href);
        const handle = normalizeInstagramHandle(extractInstagramHandle(account.href));
        if (!instagramUrl || !handle) return null;
        return {
          title: account.title ?? '',
          instagramUrl,
          handle,
          originalHref: account.href,
          value: account.value ?? ''
        };
      })
      .filter(Boolean) as Array<{ title: string; instagramUrl: string; handle: string; originalHref: string; value: string }>;

    if (normalizedAccounts.length === 0) {
      return res.json({
        candidates: [],
        total: 0,
        skipped: accounts.length,
        existing: 0,
        ignored: 0,
        unverified: 0
      });
    }

    const instagramUrls = Array.from(new Set(normalizedAccounts.map((account) => account.instagramUrl)));
    const handles = Array.from(new Set(normalizedAccounts.map((account) => account.handle)));

    const ignored = await prisma.roasterIgnore.findMany({
      where: {
        OR: [
          { instagramUrl: { in: instagramUrls } },
          { handle: { in: handles } }
        ]
      },
      select: { instagramUrl: true, handle: true }
    });

    const ignoreUrlSet = new Set(ignored.map((item) => normalizeInstagramUrl(item.instagramUrl) || item.instagramUrl));
    const ignoreHandleSet = new Set(
      ignored
        .map((item) => normalizeInstagramHandle(item.handle || ''))
        .filter(Boolean) as string[]
    );

    const existingRoasters = await prisma.roaster.findMany({
      where: {
        socialNetworks: {
          not: Prisma.DbNull
        }
      },
      select: { socialNetworks: true }
    });

    const existingHandleSet = new Set<string>();
    const existingUrlSet = new Set<string>();

    existingRoasters.forEach((roaster) => {
      const instagramValue = (roaster.socialNetworks as any)?.instagram as string | undefined;
      if (instagramValue) {
        const normalizedUrl = normalizeInstagramUrl(instagramValue);
        const handle = normalizeInstagramHandle(extractInstagramHandle(instagramValue));
        if (normalizedUrl) existingUrlSet.add(normalizedUrl);
        if (handle) existingHandleSet.add(handle);
      }
    });

    let ignoredCount = 0;
    let existingCount = 0;
    const candidates = normalizedAccounts.filter((account) => {
      if (ignoreUrlSet.has(account.instagramUrl) || ignoreHandleSet.has(account.handle)) {
        ignoredCount += 1;
        return false;
      }
      if (existingUrlSet.has(account.instagramUrl) || existingHandleSet.has(account.handle)) {
        existingCount += 1;
        return false;
      }
      return true;
    });

    return res.json({
      candidates,
      total: normalizedAccounts.length,
      skipped: normalizedAccounts.length - candidates.length,
      existing: existingCount,
      ignored: ignoredCount,
      unverified: candidates.length
    });
  }
);

router.post(
  '/instagram-import/ignore',
  [
    body('instagramUrl').isString().withMessage('instagramUrl is required'),
    body('title').optional().isString(),
    body('handle').optional().isString()
  ],
  requireAdmin,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const instagramUrl = normalizeInstagramUrl(req.body.instagramUrl);
    if (!instagramUrl) {
      return res.status(400).json({ error: 'Invalid instagramUrl' });
    }

    const handle =
      normalizeInstagramHandle(req.body.handle) ||
      normalizeInstagramHandle(extractInstagramHandle(instagramUrl)) ||
      undefined;

    const ignore = await prisma.roasterIgnore.upsert({
      where: { instagramUrl },
      update: {
        title: req.body.title ?? undefined,
        handle
      },
      create: {
        instagramUrl,
        title: req.body.title ?? null,
        handle: handle ?? null,
        createdById: req.userId
      }
    });

    return res.json({ ignore });
  }
);

export default router;
