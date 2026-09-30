import { Router, Request, Response } from 'express';
import { isIP } from 'node:net';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { normalizeSocialNetworks } from '../lib/socialNetworks';

const router = Router();
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

async function collectLinks(): Promise<LinkItem[]> {
  const items: LinkItem[] = [];
  const [roasters, roasterPeople, people, resources] = await Promise.all([
    prisma.roaster.findMany({ select: { id: true, name: true, slug: true, website: true, socialNetworks: true } }),
    prisma.roasterPerson.findMany({ select: { id: true, firstName: true, lastName: true, linkedinUrl: true, instagramUrl: true, roasterId: true } }),
    prisma.person.findMany({ select: { id: true, name: true, websiteUrl: true, linkedinUrl: true, instagramUrl: true } }),
    prisma.resource.findMany({ select: { id: true, name: true, slug: true, url: true, socialNetworks: true, links: { select: { id: true, title: true, url: true } } } }),
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
    resource.links.forEach((link) => add(items, link.url, 'resources', 'web', resource.id, `${resource.name}: ${link.title}`, path));
  });
  return items;
}

router.use(requireAuth, requireAdmin);

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
        ...(skipRecentlyChecked ? { checkedAt: { gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } : {}),
      },
      select: { url: true, category: true, service: true, entityId: true, checkedAt: true, isBroken: true, statusCode: true, error: true },
    });
    const checked = new Map(checks.map((check) => [`${check.url}|${check.category}|${check.service}|${check.entityId}`, check]));
    const filtered = links.filter((link) => {
      if (category && link.category !== category) return false;
      if (service && link.service !== service) return false;
      return !(skipRecentlyChecked && checked.has(`${link.url}|${link.category}|${link.service}|${link.entityId}`));
    }).map((link) => ({ ...link, lastCheck: checked.get(`${link.url}|${link.category}|${link.service}|${link.entityId}`) || null }));
    res.json({ links: filtered });
  } catch (error) {
    console.error('Error collecting links:', error);
    res.status(500).json({ error: 'Could not collect links' });
  }
});

router.post('/check', async (req: Request, res: Response) => {
  const { url, category, service, entityId, entityName, editPath } = req.body || {};
  if (typeof url !== 'string' || !categories.includes(category) || !services.includes(service) || typeof entityId !== 'string' || typeof entityName !== 'string' || typeof editPath !== 'string') {
    return res.status(400).json({ error: 'Invalid link check request' });
  }
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return res.status(400).json({ error: 'Only HTTP and HTTPS links can be checked' });
    if (!isPublicUrl(parsed)) return res.status(400).json({ error: 'Private network links cannot be checked' });
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
    const result = { statusCode: response.status, isBroken: response.status >= 400, error: response.status >= 400 ? `HTTP ${response.status}` : null };
    const check = await prisma.linkCheck.upsert({
      where: { url_category_service_entityId: { url, category, service, entityId } },
      create: { url, category, service, entityId, entityName, statusCode: result.statusCode, isBroken: result.isBroken, error: result.error },
      update: { entityName, statusCode: result.statusCode, isBroken: result.isBroken, error: result.error, checkedAt: new Date() },
    });
    res.json({ ...check, editPath });
  } catch (error: any) {
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
