import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { AddressInfo } from 'node:net';
import express from 'express';
import { prisma } from '../src/lib/prisma';
import * as auth from '../src/middleware/requireAuth';
import * as audit from '../src/lib/auditService';

async function run() {
  const importedBio = ` ${'a'.repeat(1255)} `;
  let person = {
    id: 'person-test',
    roasterId: 'roaster-test',
    firstName: 'Aaron',
    lastName: '',
    email: null,
    bio: importedBio,
    roles: [] as string[],
    userId: null,
    isPrimary: false,
    isActive: true,
  };
  let updateCount = 0;
  let createCount = 0;
  let auditCount = 0;

  const originalUserFind = prisma.user.findUnique;
  const originalPersonMethods = {
    findUnique: prisma.roasterPerson.findUnique,
    update: prisma.roasterPerson.update,
    create: prisma.roasterPerson.create,
  };
  mock.method(auth, 'requireAuth', (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'admin-test', email: 'admin@example.test', role: 'admin', username: 'admin-test' };
    next();
  });
  // Prisma delegates are proxies, so replace methods directly rather than mock.method.
  Object.assign(prisma.user, {
    findUnique: mock.fn(async () => ({ id: 'admin-test', role: 'admin' })),
  });
  Object.assign(prisma.roasterPerson, {
    findUnique: mock.fn(async () => ({ ...person })),
    update: mock.fn(async ({ data }: { data: Partial<typeof person> }) => {
      updateCount++;
      person = { ...person, ...data };
      return { ...person };
    }),
    create: mock.fn(async () => {
      createCount++;
      throw new Error('Invalid create payload reached persistence');
    }),
  });
  mock.method(audit, 'createAuditLog', async () => { auditCount++; });

  const { default: peopleRouter } = await import('../src/routes/people');
  const app = express();
  app.use(express.json());
  app.use('/api/people', peopleRouter);
  const server = app.listen(0, '127.0.0.1');

  try {
    if (!server.listening) await new Promise<void>((resolve) => server.once('listening', resolve));
    const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/people`;
    const update = async (payload: object) => {
      const response = await fetch(`${baseUrl}/person-test`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return { status: response.status, data: await response.json() };
    };
    const payload = {
      firstName: 'Aaron',
      lastName: '',
      title: '',
      city: null,
      country: null,
      email: null,
      mobile: '',
      linkedinUrl: null,
      instagramUrl: null,
      bio: importedBio,
      roasterId: person.roasterId,
      roles: ['other'],
      isPrimary: false,
    };

    const saved = await update(payload);
    assert.equal(saved.status, 200, JSON.stringify(saved.data));
    assert.deepEqual(saved.data.person.roles, ['other']);
    assert.equal(saved.data.person.bio, importedBio);
    assert.deepEqual(person.roles, ['other']);
    assert.equal(person.bio, importedBio);
    assert.equal(updateCount, 1);
    assert.equal(auditCount, 1);

    const omitted = await update({ roles: ['Employee', ' employee ', 'EMPLOYEE'] });
    assert.equal(omitted.status, 200);
    assert.equal(person.bio, importedBio);
    assert.deepEqual(person.roles, ['employee']);

    const writesBeforeRejection = updateCount;
    const changed = await update({ bio: 'b'.repeat(1001), roles: ['owner'] });
    assert.equal(changed.status, 400);
    assert.equal(changed.data.errors[0].path, 'bio');
    assert.match(changed.data.errors[0].msg, /Shorten the biography or leave the existing biography unchanged/);
    assert.equal(updateCount, writesBeforeRejection);
    assert.equal(auditCount, writesBeforeRejection);
    assert.equal(person.bio, importedBio);
    assert.deepEqual(person.roles, ['employee']);

    const invalidType = await update({ bio: 42 });
    assert.equal(invalidType.status, 400);
    assert.equal(invalidType.data.errors[0].msg, 'Bio must be a string');
    assert.equal(updateCount, writesBeforeRejection);

    const boundary = await update({ bio: 'c'.repeat(1000) });
    assert.equal(boundary.status, 200);
    assert.equal(person.bio.length, 1000);
    const cleared = await update({ bio: '' });
    assert.equal(cleared.status, 200);
    assert.equal(person.bio, '');

    const invalidRole = await update({ roles: ['invalid-role'] });
    assert.equal(invalidRole.status, 400);
    assert.equal(invalidRole.data.errors[0].msg, 'Invalid role');

    const create = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, bio: importedBio }),
    });
    assert.equal(create.status, 400);
    assert.equal(createCount, 0);
    const createError = await create.json();
    assert.equal(createError.errors[0].msg, 'Bio must be 1000 characters or less');
    console.log('testPeopleUpdates: OK');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    mock.restoreAll();
    Object.assign(prisma.user, { findUnique: originalUserFind });
    Object.assign(prisma.roasterPerson, originalPersonMethods);
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
