import { Router, Request, Response } from 'express';
import { isIP } from 'node:net';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { normalizeSocialNetworks } from '../lib/socialNetworks';
import { isBrokenHttpStatus } from '../lib/linkChecker';

const router = Router();
const linkCheckRateLimit = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
const categories = ['people', 'roasters', 'resources'] as const;
const services = ['web', 'socials'] as const;
type Category = typeof categories[number];
type Service = typeof services[number];

const isPublicUrl = (url: URL) => {
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) return false;
  if (isIP(hostname) === 4) {
    const [first, second] = hostname.split('.').map(Number);
    if (first === 10 || first === 127 || (first === 169 && second === 254) || (first === 192 && second === 168) || (first === 172 && second >= 16 && second <= 31)) return false;
  }
  if (isIP(hostname) === 6 && (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80:'))) return false;
  return true;
};

const requireAdmin = (req: any, res: Response, next: any) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

type LinkItem = {
  url: string;
  category: Category;
  service: Service;
  entityId: string;
  entityName: string;
  editPath: string;
};

const add = (items: LinkItem[], url: unknown, category: Category, service: Service, entityId: string, entityName: string, editPath: string) => {
  if (typeof url !== 'string' || !/^https?:\/\/\S+$/i.test(url.trim())) return;
  items.push({ url: url.trim(), category, service, entityId, entityName, editPath });
};

const addSocials = (items: LinkItem[], socials: unknown, category: Category, entityId: string, entityName: string, editPath: string) => {
  Object.entries(normalizeSocialNetworks(socials)).forEach(([, url]) => add(items, url, category, 'socials', entityId, entityName, editPath));
};

type UrlCheckResult = { statusCode: number; isBroken: boolean; error: string | null };

const checkUrl = async (url: string): Promise<UrlCheckResult> => {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only HTTP and HTTPS links can be checked');
  if (!isPublicUrl(parsed)) throw new Error('Private network links cannot be checked');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response: globalThis.Response;
  try {
    response = await fetch(parsed, { method: 'HEAD', redirect: 'manual', signal: controller.signal, headers: { 'User-Agent': 'The Beans link checker' } });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(parsed, { method: 'GET', redirect: 'manual', signal: controller.signal, headers: { 'User-Agent': 'The Beans link checker' } });
    }
  } finally {
    clearTimeout(timeout);
  }
  return { statusCode: response.status, isBroken: isBrokenHttpStatus(response.status), error: response.status >= 400 ? `HTTP ${response.status}` : null };
};

async function collectLinks(): Promise<LinkItem[]> {
  const items: LinkItem[] = [];
  const [roasters, roasterPeople, people, resources] = await Promise.all([
    prisma.roaster.findMany({ select: { id: true, name: true, slug: true, website: true, socialNetworks: true } }),
    prisma.roasterPerson.findMany({ select: { id: true, firstName: true, lastName: true, linkedinUrl: true, instagramUrl: true, roasterId: true } }),
    prisma.person.findMany({ select: { id: true, name: true, websiteUrl: true, linkedinUrl: true, instagramUrl: true } }),
    prisma.resource.findMany({ select: { id: true, name: true, slug: true, url: true, socialNetworks: true } }),
  ]);

  roasters.forEach((roaster) => {
    const path = `/admin/roasters/edit/${roaster.id}`;
    add(items, roaster.website, 'roasters', 'web', roaster.id, roaster.name, path);
    addSocials(items, roaster.socialNetworks, 'roasters', roaster.id, roaster.name, path);
  });
  roasterPeople.forEach((person) => {
    const name = [person.firstName, person.lastName].filter(Boolean).join(' ');
    const path = `/admin/people/edit/${person.id}`;
    add(items, person.linkedinUrl, 'people', 'socials', person.id, name, path);
    add(items, person.instagramUrl, 'people', 'socials', person.id, name, path);
  });
  people.forEach((person) => {
    const path = `/admin/resources/people/${person.id}`;
    add(items, person.websiteUrl, 'people', 'web', person.id, person.name, path);
    add(items, person.linkedinUrl, 'people', 'socials', person.id, person.name, path);
    add(items, person.instagramUrl, 'people', 'socials', person.id, person.name, path);
  });
  resources.forEach((resource) => {
    const path = `/admin/resources/${resource.id}`;
    add(items, resource.url, 'resources', 'web', resource.id, resource.name, path);
    addSocials(items, resource.socialNetworks, 'resources', resource.id, resource.name, path);
  });
  return items;
}

router.use(linkCheckRateLimit, requireAuth, requireAdmin);

router.get('/links', async (req: Request, res: Response) => {
  try {
    const category = categories.includes(req.query.category as Category) ? req.query.category as Category : undefined;
    const service = services.includes(req.query.service as Service) ? req.query.service as Service : undefined;
    const skipRecentlyChecked = req.query.skipRecentlyChecked === 'true';
    const links = await collectLinks();
    const checks = await prisma.linkCheck.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(service ? { service } : {}),
      },
      select: { id: true, url: true, category: true, service: true, entityId: true, entityName: true, checkedAt: true, isBroken: true, statusCode: true, error: true, disposition: true },
    });
    const checked = new Map(checks.map((check) => [`${check.url}|${check.category}|${check.service}|${check.entityId}`, check]));
    const matching = links.map((link, linkIndex) => ({ ...link, linkIndex })).filter((link) => {
      if (category && link.category !== category) return false;
      if (service && link.service !== service) return false;
      return true;
    }).map((link) => ({ ...link, lastCheck: checked.get(`${link.url}|${link.category}|${link.service}|${link.entityId}`) || null }));
    const recentCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const filtered = matching.filter((link) => !(skipRecentlyChecked && link.lastCheck && link.lastCheck.checkedAt > recentCutoff));
    const currentByIdentity = new Map(links.map((link) => [`${link.category}|${link.service}|${link.entityId}`, link]));
    const brokenLinks = checks.filter((check) => check.isBroken || check.disposition).flatMap((check) => {
      const current = currentByIdentity.get(`${check.category}|${check.service}|${check.entityId}`);
      return [{
        ...check,
        ...(current || {}),
        entityName: current?.entityName || check.entityName,
        currentUrl: current?.url || null,
        editPath: current?.editPath || `/admin/${check.category}/${check.entityId}`,
      }];
    });
    res.json({ links: filtered, brokenLinks });
  } catch (error) {
    console.error('Error collecting links:', error);
    res.status(500).json({ error: 'Could not collect links' });
  }
});

router.post('/recheck', async (req: Request, res: Response) => {
  const { id } = req.body || {};
  if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Invalid link check request' });
  const failed = await prisma.linkCheck.findUnique({ where: { id } });
  if (!failed) return res.status(404).json({ error: 'Link check not found' });

  const current = (await collectLinks()).find((link) => link.category === failed.category && link.service === failed.service && link.entityId === failed.entityId);
  if (!current) {
    const check = await prisma.linkCheck.update({ where: { id }, data: { isBroken: false, statusCode: null, error: null, disposition: 'URL removed', checkedAt: new Date() } });
    return res.json(check);
  }

  try {
    const result = await checkUrl(current.url);
    const disposition = result.isBroken ? null : (current.url === failed.url ? 'URL valid' : 'URL updated');
    const check = await prisma.linkCheck.update({ where: { id }, data: { isBroken: result.isBroken, statusCode: result.statusCode, error: result.error, disposition, checkedAt: new Date(), entityName: current.entityName } });
    return res.json({ ...check, currentUrl: current.url, editPath: current.editPath });
  } catch (error: any) {
    const message = error?.name === 'AbortError' ? 'Request timed out' : (error?.message || 'Request failed');
    const check = await prisma.linkCheck.update({ where: { id }, data: { isBroken: true, statusCode: null, error: message, disposition: null, checkedAt: new Date(), entityName: current.entityName } });
    return res.json({ ...check, currentUrl: current.url, editPath: current.editPath });
  }
});

router.post('/check', async (req: Request, res: Response) => {
  const { linkIndex } = req.body || {};
  if (!Number.isInteger(linkIndex) || linkIndex < 0) {
    return res.status(400).json({ error: 'Invalid link check request' });
  }
  let selectedLink: LinkItem | undefined;
  try {
    const links = await collectLinks();
    selectedLink = links[linkIndex];
    if (!selectedLink) return res.status(404).json({ error: 'Link not found' });
    const { url, category, service, entityId, entityName, editPath } = selectedLink;
    const result = await checkUrl(url);
    const check = await prisma.linkCheck.upsert({
      where: { url_category_service_entityId: { url, category, service, entityId } },
      create: { url, category, service, entityId, entityName, statusCode: result.statusCode, isBroken: result.isBroken, error: result.error, disposition: null },
      update: { entityName, statusCode: result.statusCode, isBroken: result.isBroken, error: result.error, disposition: null, checkedAt: new Date() },
    });
    res.json({ ...check, editPath });
  } catch (error: any) {
    if (!selectedLink) return res.status(500).json({ error: 'Could not load link' });
    const { url, category, service, entityId, entityName, editPath } = selectedLink;
    const message = error?.name === 'AbortError' ? 'Request timed out' : (error?.message || 'Request failed');
    const check = await prisma.linkCheck.upsert({
      where: { url_category_service_entityId: { url, category, service, entityId } },
      create: { url, category, service, entityId, entityName, isBroken: true, error: message },
      update: { entityName, isBroken: true, error: message, statusCode: null, checkedAt: new Date() },
    });
    res.json({ ...check, editPath });
  }
});

export default router;
