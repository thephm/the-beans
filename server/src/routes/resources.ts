import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { auditBefore, auditAfter, captureOldValues } from '../middleware/auditMiddleware';
import { isSocialNetworksObject, normalizeSocialNetworks } from '../lib/socialNetworks';
import { generateUniquePersonSlug } from '../lib/slug';

const router = Router();

const requireAdmin = async (req: any, res: Response, next: any) => {
  const user = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { role: true } });
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

const isSafeUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const createPersonSlug = (name: string) => generateUniquePersonSlug(prisma, name);

const publicResource = (resource: any) => {
  const { notes, ...safeResource } = resource;
  if (safeResource.people) {
    safeResource.people = safeResource.people.map((entry: any) => ({
      ...entry,
      person: entry.person ? (({ notes, ...person }: any) => person)(entry.person) : entry.person
    }));
  }
  if (safeResource.observations) {
    safeResource.observations = safeResource.observations.map(({ notes, ...observation }: any) => observation);
  }
  if (safeResource.roasters) {
    safeResource.roasters = safeResource.roasters.map(({ notes, ...relationship }: any) => relationship);
  }
  return safeResource;
};

const resourceInclude = {
  publisherRoaster: { select: { id: true, name: true, slug: true, city: true, state: true, country: true } },
  people: { include: { person: true } },
  observations: { orderBy: { observedAt: 'desc' as const } },
  roasters: {
    include: {
      roaster: {
        select: { id: true, name: true, slug: true, city: true, state: true, country: true, images: true, description: true, rating: true, reviewCount: true, verified: true }
      }
    }
  }
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const includeArchived = req.query.includeArchived === 'true';
    const where = {
      state: includeArchived ? { not: 'inactive' } : { notIn: ['inactive', 'archived'] },
      ...(search ? { OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { resourceType: { contains: search, mode: 'insensitive' as const } },
        { platform: { contains: search, mode: 'insensitive' as const } }
      ] } : {})
    };
    const resources = await prisma.resource.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, slug: true, url: true, description: true, resourceType: true,
        platform: true, state: true, city: true, province: true, country: true,
        publisherRoaster: { select: { id: true, name: true, slug: true, city: true, state: true, country: true } },
        _count: { select: { roasters: true, people: true } }
      }
    });
    res.json({ resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const includeArchived = req.query.includeArchived === 'true';
    const resources = await prisma.resource.findMany({
      where: {
        state: includeArchived ? { not: 'inactive' } : { notIn: ['inactive', 'archived'] },
        ...(search ? { OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { notes: { contains: search, mode: 'insensitive' as const } },
          { publisherRoaster: { is: { name: { contains: search, mode: 'insensitive' as const } } } },
          { roasters: { some: { roaster: { name: { contains: search, mode: 'insensitive' as const } } } } },
          { people: { some: { person: { name: { contains: search, mode: 'insensitive' as const } } } } },
        ] } : {}),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, slug: true, url: true, description: true, notes: true,
        resourceType: true, platform: true, state: true,
        publisherRoaster: { select: { id: true, name: true, slug: true, city: true, state: true, country: true } },
      },
    });
    res.json({ resources });
  } catch (error) {
    console.error('Error fetching admin resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const resource = await prisma.resource.findUnique({ where: { id: req.params.id }, include: resourceInclude });
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    res.json(resource);
  } catch (error) {
    console.error('Error fetching admin resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/people', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const people = await prisma.person.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      } : undefined,
      orderBy: { name: 'asc' },
      take: 20,
    });
    res.json({ people });
  } catch (error) {
    console.error('Error searching resource people:', error);
    res.status(500).json({ error: 'Could not search people' });
  }
});

router.get('/people/:personId', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const person = await prisma.person.findUnique({
      where: { id: req.params.personId },
      include: {
        resources: {
          include: { resource: { select: { id: true, name: true, slug: true } } },
          orderBy: { resource: { name: 'asc' } },
        },
      },
    });
    if (!person) return res.status(404).json({ error: 'Person not found' });
    res.json({ person });
  } catch (error) {
    console.error('Error fetching resource person:', error);
    res.status(500).json({ error: 'Could not fetch person' });
  }
});

router.patch('/people/:personId', requireAuth, requireAdmin, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail(),
  body('title').optional({ nullable: true }).isString(),
  body('city').optional({ nullable: true }).isString(),
  body('country').optional({ nullable: true }).isString(),
  body('mobile').optional({ nullable: true }).isString(),
  body('websiteUrl').optional({ nullable: true, checkFalsy: true }).isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('linkedinUrl').optional({ nullable: true, checkFalsy: true }).isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('instagramUrl').optional({ nullable: true, checkFalsy: true }).isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('bio').optional({ nullable: true }).isString(),
  body('notes').optional({ nullable: true }).isString(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const person = await prisma.person.update({
      where: { id: req.params.personId },
      data: {
        name: req.body.name,
        email: req.body.email ?? null,
        title: req.body.title ?? null,
        ...(req.body.city !== undefined && { city: req.body.city || null }),
        ...(req.body.country !== undefined && { country: req.body.country || null }),
        mobile: req.body.mobile ?? null,
        websiteUrl: req.body.websiteUrl ?? null,
        linkedinUrl: req.body.linkedinUrl ?? null,
        instagramUrl: req.body.instagramUrl ?? null,
        bio: req.body.bio ?? null,
        notes: req.body.notes === undefined ? undefined : req.body.notes || null,
      },
      include: {
        resources: {
          include: { resource: { select: { id: true, name: true, slug: true } } },
          orderBy: { resource: { name: 'asc' } },
        },
      },
    });
    res.json({ person });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Person not found' });
    console.error('Error updating resource person:', error);
    res.status(400).json({ error: 'Could not update person' });
  }
});

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const resource = await prisma.resource.findUnique({ where: { slug: req.params.slug }, include: resourceInclude });
    if (!resource || resource.state === 'inactive') return res.status(404).json({ error: 'Resource not found' });
    res.json(publicResource(resource));
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, requireAdmin, auditBefore('resource', 'CREATE'), [
  body('name').trim().notEmpty(),
  body('slug').trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  body('url').isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('resourceType').trim().notEmpty(),
  body('state').optional().isIn(['active', 'archived', 'inactive', 'closed', 'unknown']),
  body('socialNetworks').optional({ nullable: true }).custom((value) => {
    if (!isSocialNetworksObject(value)) throw new Error('socialNetworks must be an object');
    return true;
  }).withMessage('socialNetworks must be an object mapping network->url'),
], auditAfter(), async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  if (!isSafeUrl(req.body.url)) return res.status(400).json({ error: 'URL must use HTTP or HTTPS' });
  try {
    const data = { ...req.body };
    if ('socialNetworks' in data) data.socialNetworks = normalizeSocialNetworks(data.socialNetworks);
    const resource = await prisma.resource.create({ data });
    res.locals.auditEntity = resource;
    res.status(201).json(publicResource(resource));
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'A resource with that slug already exists' });
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', requireAuth, requireAdmin, auditBefore('resource', 'UPDATE'), captureOldValues(prisma.resource), auditAfter(), async (req: Request, res: Response) => {
  const { url } = req.body;
  if (url && !isSafeUrl(url)) return res.status(400).json({ error: 'URL must use HTTP or HTTPS' });
  if ('socialNetworks' in req.body && req.body.socialNetworks !== null && !isSocialNetworksObject(req.body.socialNetworks)) {
    return res.status(400).json({ error: 'socialNetworks must be an object mapping network->url' });
  }
  try {
    const data = { ...req.body };
    if ('socialNetworks' in data) data.socialNetworks = normalizeSocialNetworks(data.socialNetworks);
    const resource = await prisma.resource.update({ where: { id: req.params.id }, data });
    res.locals.auditEntity = resource;
    res.json(publicResource(resource));
  } catch (error) {
    res.status(404).json({ error: 'Resource not found' });
  }
});

router.delete('/:id/permanent', requireAuth, requireAdmin, auditBefore('resource', 'DELETE'), captureOldValues(prisma.resource), auditAfter(), async (req: Request, res: Response) => {
  try {
    res.locals.auditEntity = req.auditData?.oldValues;
    await prisma.resource.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'Resource not found' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, auditBefore('resource', 'DELETE'), captureOldValues(prisma.resource), auditAfter(), async (req: Request, res: Response) => {
  try {
    const resource = await prisma.resource.update({ where: { id: req.params.id }, data: { state: 'archived' } });
    res.locals.auditEntity = resource;
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'Resource not found' });
  }
});

router.post('/:id/people', requireAuth, requireAdmin, [body('personId').optional().trim().notEmpty(), body('role').trim().notEmpty()], async (req: Request, res: Response) => {
  const { personId, role, isPrimary, person } = req.body;
  try {
    const resolvedPersonId = personId || (person ? (await prisma.person.create({
      data: { ...person, slug: await createPersonSlug(person.name || '') },
    })).id : null);
    if (!resolvedPersonId) return res.status(400).json({ error: 'personId or person is required' });
    const relationship = await prisma.resourcePerson.create({ data: { resourceId: req.params.id, personId: resolvedPersonId, role, isPrimary: Boolean(isPrimary) }, include: { person: true } });
    res.status(201).json(relationship);
  } catch (error) {
    res.status(400).json({ error: 'Could not link person to resource' });
  }
});

router.patch('/:id/people/:personId', requireAuth, requireAdmin, [body('role').trim().notEmpty()], async (req: Request, res: Response) => {
  const { role, roles, isPrimary, person } = req.body;
  try {
    const requestedRoles = Array.isArray(roles)
      ? roles.filter((value: unknown): value is string => typeof value === 'string').map((value: string) => value.trim()).filter(Boolean)
      : [];
    const selectedRoles = [...new Set(requestedRoles.length > 0 ? requestedRoles : [String(role).trim()])];
    const relationship = await prisma.resourcePerson.findFirst({
      where: { resourceId: req.params.id, personId: req.params.personId }
    });
    if (!relationship) return res.status(404).json({ error: 'Resource person not found' });

    if (person) {
      await prisma.person.update({
        where: { id: req.params.personId },
        data: {
          name: person.name,
          email: person.email,
          title: person.title,
          mobile: person.mobile,
          websiteUrl: person.websiteUrl,
          linkedinUrl: person.linkedinUrl,
          instagramUrl: person.instagramUrl,
          bio: person.bio,
          notes: person.notes,
        }
      });
    }
    const updated = await prisma.$transaction(async (transaction) => {
      await transaction.resourcePerson.deleteMany({
        where: {
          resourceId: req.params.id,
          personId: req.params.personId,
          role: { notIn: selectedRoles },
        },
      });
      const updatedAssociations = await Promise.all(selectedRoles.map((selectedRole) => transaction.resourcePerson.upsert({
        where: {
          resourceId_personId_role: {
            resourceId: req.params.id,
            personId: req.params.personId,
            role: selectedRole,
          }
        },
        update: { isPrimary: Boolean(isPrimary) },
        create: {
          resourceId: req.params.id,
          personId: req.params.personId,
          role: selectedRole,
          isPrimary: Boolean(isPrimary),
        },
        include: { person: true },
      })));
      return updatedAssociations[0];
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Could not update resource person' });
  }
});

router.delete('/:id/people/:personId', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.resourcePerson.deleteMany({ where: { resourceId: req.params.id, personId: req.params.personId } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'Resource person not found' });
  }
});

router.post('/:id/roasters', requireAuth, requireAdmin, [body('roasterId').trim().notEmpty()], async (req: Request, res: Response) => {
  const { roasterId, sourceUrl, sourceTitle, discoveredAt, notes } = req.body;
  if (sourceUrl && !isSafeUrl(sourceUrl)) return res.status(400).json({ error: 'Source URL must use HTTP or HTTPS' });
  try {
    const relationship = await prisma.resourceRoaster.create({
      data: { resourceId: req.params.id, roasterId, sourceUrl, sourceTitle, notes, discoveredAt: discoveredAt ? new Date(discoveredAt) : undefined }
    });
    res.status(201).json(relationship);
  } catch (error) {
    res.status(400).json({ error: 'Could not link roaster to resource' });
  }
});

router.post('/:id/observations', requireAuth, requireAdmin, [
  body('observationType').trim().notEmpty(),
  body('value').isInt({ min: 0 }),
  body('observedAt').optional({ nullable: true }).isISO8601(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const observation = await prisma.resourceObservation.create({
      data: { ...req.body, resourceId: req.params.id, observedAt: req.body.observedAt ? new Date(req.body.observedAt) : null }
    });
    res.status(201).json(observation);
  } catch (error) {
    res.status(400).json({ error: 'Could not create observation' });
  }
});

router.delete('/:id/roasters/:roasterId', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.resourceRoaster.deleteMany({ where: { resourceId: req.params.id, roasterId: req.params.roasterId } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'Resource roaster relationship not found' });
  }
});

router.delete('/:id/observations/:observationId', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.resourceObservation.delete({ where: { id: req.params.observationId } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'Observation not found' });
  }
});

export default router;
