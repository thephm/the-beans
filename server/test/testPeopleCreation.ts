import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { AddressInfo } from 'node:net';
import express from 'express';
import { prisma } from '../src/lib/prisma';
import * as auth from '../src/middleware/requireAuth';
import * as audit from '../src/lib/auditService';

async function run() {
  let userRole = 'admin';
  let canManageRoaster = true;
  let failResourceCreate = false;
  let failRoasterCreate = false;
  let roasterWrites = 0;
  let resourceWrites = 0;
  let primaryResets = 0;
  let auditCount = 0;
  let lastResourceData: Record<string, unknown> = {};
  const originals = {
    transaction: prisma.$transaction,
    user: { findUnique: prisma.user.findUnique },
    roaster: { findUnique: prisma.roaster.findUnique },
    resource: { findUnique: prisma.resource.findUnique },
    roasterPerson: {
      findFirst: prisma.roasterPerson.findFirst,
      create: prisma.roasterPerson.create,
      updateMany: prisma.roasterPerson.updateMany,
    },
    person: { findUnique: prisma.person.findUnique, create: prisma.person.create },
    resourcePerson: { updateMany: prisma.resourcePerson.updateMany },
  };
  mock.method(auth, 'requireAuth', (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'user-test', email: 'user@example.test', role: userRole, username: 'user-test' };
    next();
  });
  mock.method(audit, 'createAuditLog', async () => { auditCount++; });
  Object.assign(prisma.user, { findUnique: mock.fn(async () => ({ id: 'user-test', role: userRole })) });
  Object.assign(prisma.roaster, {
    findUnique: mock.fn(async ({ where }: { where: { id: string } }) => where.id === 'missing' ? null : { id: where.id }),
  });
  Object.assign(prisma.resource, {
    findUnique: mock.fn(async ({ where }: { where: { id: string } }) => where.id === 'missing' ? null : { id: where.id }),
  });
  Object.assign(prisma.roasterPerson, {
    findFirst: mock.fn(async () => canManageRoaster ? { roles: ['owner'] } : null),
    updateMany: mock.fn(async () => { primaryResets++; return { count: 1 }; }),
    create: mock.fn(async ({ data }: { data: { roles: string[] } }) => {
      if (failRoasterCreate) throw Object.assign(new Error('Duplicate roaster contact'), { code: 'P2002' });
      roasterWrites++;
      return { ...data, id: 'roaster-person-test', user: null };
    }),
  });
  Object.assign(prisma.resourcePerson, {
    updateMany: mock.fn(async () => { primaryResets++; return { count: 1 }; }),
  });
  Object.assign(prisma.person, {
    findUnique: mock.fn(async () => null),
    create: mock.fn(async ({ data }: { data: Record<string, unknown> }) => {
      if (failResourceCreate) throw new Error('Resource write failed');
      resourceWrites++;
      lastResourceData = data;
      return { ...data, id: 'resource-person-test' };
    }),
  });
  Object.assign(prisma, {
    $transaction: mock.fn(async (callback: (transaction: typeof prisma) => Promise<unknown>) => {
      const before = { roasterWrites, resourceWrites, primaryResets };
      try {
        return await callback(prisma);
      } catch (error) {
        ({ roasterWrites, resourceWrites, primaryResets } = before);
        throw error;
      }
    }),
  });

  const { default: peopleRouter } = await import('../src/routes/people');
  const app = express();
  app.use(express.json());
  app.use('/api/people', peopleRouter);
  const server = app.listen(0, '127.0.0.1');

  try {
    if (!server.listening) await new Promise<void>((resolve) => server.once('listening', resolve));
    const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/people`;
    const create = async (payload: object) => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: ' Ada ', lastName: 'Lovelace', email: '', ...payload }),
      });
      return { status: response.status, data: await response.json() };
    };
    const roasterOnly = await create({ roasterId: 'roaster-test', roles: ['Owner', ' owner ', 'OWNER'], isPrimary: true });
    assert.equal(roasterOnly.status, 201, JSON.stringify(roasterOnly.data));
    assert.equal(roasterOnly.data.person.firstName, 'Ada');
    assert.equal(roasterOnly.data.person.email, null);
    assert.equal(roasterOnly.data.person.permissions.canEditRoaster, true);
    assert.deepEqual(roasterOnly.data.person.roles, ['owner']);
    assert.equal(roasterOnly.data.resourcePerson, undefined);
    assert.equal(roasterWrites, 1);
    assert.equal(resourceWrites, 0);

    const resourceOnly = await create({
      resourceId: 'resource-test', resourceRoles: ['Author', 'creator', ' author '],
      websiteUrl: 'https://example.test', resourceIsPrimary: true,
    });
    assert.equal(resourceOnly.status, 201, JSON.stringify(resourceOnly.data));
    assert.equal(resourceOnly.data.person.name, 'Ada Lovelace');
    assert.equal(resourceOnly.data.resourcePerson.id, 'resource-person-test');
    assert.equal(lastResourceData.websiteUrl, 'https://example.test');
    assert.deepEqual(lastResourceData.resources, {
      create: [
        { resourceId: 'resource-test', role: 'author', isPrimary: true },
        { resourceId: 'resource-test', role: 'creator', isPrimary: true },
      ],
    });
    assert.equal(roasterWrites, 1);
    assert.equal(resourceWrites, 1);

    const both = await create({
      roasterId: 'roaster-test', roles: ['founder'],
      resourceId: 'resource-test', resourceRoles: ['contributor'], isPrimary: true, resourceIsPrimary: false,
    });
    assert.equal(both.status, 201, JSON.stringify(both.data));
    assert.deepEqual(both.data.person.roles, ['founder']);
    assert.deepEqual(lastResourceData.resources, {
      create: [{ resourceId: 'resource-test', role: 'contributor', isPrimary: false }],
    });
    assert.equal(roasterWrites, 2);
    assert.equal(resourceWrites, 2);
    assert.equal(auditCount, 4);
    const beforeInvalid = { roasterWrites, resourceWrites, primaryResets, auditCount };

    for (const payload of [
      {},
      { roasterId: '' },
      { resourceId: 'resource-test', resourceRoles: [] },
      { resourceId: 'resource-test', resourceRoles: ['invalid'] },
      { resourceId: 'resource-test', resourceRoles: 'author' },
      { roasterId: 'roaster-test', roles: ['author'] },
      { resourceId: 'resource-test', firstName: '   ' },
    ]) {
      const rejected = await create(payload);
      assert.equal(rejected.status, 400, JSON.stringify(rejected));
    }
    assert.equal((await create({ resourceId: 'missing' })).status, 404);
    assert.equal((await create({ roasterId: 'missing', resourceId: 'resource-test' })).status, 404);
    userRole = 'user';
    assert.equal((await create({ resourceId: 'resource-test' })).status, 403);
    assert.equal((await create({ roasterId: 'roaster-test', resourceId: 'resource-test' })).status, 403);
    canManageRoaster = false;
    assert.equal((await create({ roasterId: 'roaster-test' })).status, 403);
    assert.deepEqual({ roasterWrites, resourceWrites, primaryResets, auditCount }, beforeInvalid);
    canManageRoaster = true;
    assert.equal((await create({ roasterId: 'roaster-test' })).status, 201);
    userRole = 'admin';

    const beforeFailure = { roasterWrites, resourceWrites, primaryResets, auditCount };
    failResourceCreate = true;
    assert.equal((await create({
      roasterId: 'roaster-test', resourceId: 'resource-test', isPrimary: true,
    })).status, 500);
    assert.deepEqual({ roasterWrites, resourceWrites, primaryResets, auditCount }, beforeFailure);
    failResourceCreate = false;
    failRoasterCreate = true;
    assert.equal((await create({
      roasterId: 'roaster-test', resourceId: 'resource-test', isPrimary: true,
    })).status, 400);
    assert.deepEqual({ roasterWrites, resourceWrites, primaryResets, auditCount }, beforeFailure);
    console.log('testPeopleCreation: OK');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    mock.restoreAll();
    Object.assign(prisma, { $transaction: originals.transaction });
    Object.assign(prisma.user, originals.user);
    Object.assign(prisma.roaster, originals.roaster);
    Object.assign(prisma.resource, originals.resource);
    Object.assign(prisma.roasterPerson, originals.roasterPerson);
    Object.assign(prisma.person, originals.person);
    Object.assign(prisma.resourcePerson, originals.resourcePerson);
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
