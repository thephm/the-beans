import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { AddressInfo } from 'node:net';
import express from 'express';
import { prisma } from '../src/lib/prisma';
import * as auth from '../src/middleware/requireAuth';

async function run() {
  const person = {
    id: 'person-test', roasterId: 'roaster-test', firstName: 'Aaron', lastName: 'Test',
    email: null, mobile: null, title: null, roles: ['owner', 'Founder', 'Owner', ' Scout '],
    roaster: { id: 'roaster-test', name: 'Test Roaster' },
  };
  const originals = {
    userFind: prisma.user.findUnique,
    peopleFind: prisma.roasterPerson.findMany,
    personFind: prisma.roasterPerson.findUnique,
    resourcePeopleFind: prisma.resourcePerson.findMany,
    unassociatedFind: prisma.person.findMany,
  };
  mock.method(auth, 'requireAuth', (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'admin-test', email: 'admin@example.test', role: 'admin', username: 'admin-test' };
    next();
  });
  Object.assign(prisma.user, { findUnique: mock.fn(async () => ({ id: 'admin-test', role: 'admin' })) });
  Object.assign(prisma.roasterPerson, {
    findUnique: mock.fn(async () => person),
    findMany: mock.fn(async () => [
      person,
      { ...person, id: 'duplicate-test', roles: ['scout', 'founder', 'owner'] },
      { ...person, id: 'other-roaster-test', roasterId: 'other-roaster' },
    ]),
  });
  Object.assign(prisma.resourcePerson, {
    findMany: mock.fn(async () => ['Author', 'author', ' Creator '].map(role => ({
      person: { id: 'resource-person-test', name: 'Resource Person' },
      resource: { id: 'resource-test', name: 'Test Resource', slug: 'test-resource' },
      role, isPrimary: false,
    }))),
  });
  Object.assign(prisma.person, { findMany: mock.fn(async () => []) });
  const { default: peopleRouter } = await import('../src/routes/people');
  const app = express();
  app.use('/api/people', peopleRouter);
  const server = app.listen(0, '127.0.0.1');
  try {
    if (!server.listening) await new Promise<void>(resolve => server.once('listening', resolve));
    const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/people`;
    for (const includeResources of [false, true]) {
      const response = await fetch(`${baseUrl}?includeResources=${includeResources}`);
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.pagination.total, includeResources ? 3 : 2);
      const roasterRows = result.data.filter((row: { roasterId?: string }) => row.roasterId);
      assert.equal(roasterRows.length, 2, 'Separate roaster associations must be retained');
      for (const row of roasterRows) {
        assert.equal(row.roles.length, 3);
        assert.deepEqual([...row.roles].sort(), ['founder', 'owner', 'scout']);
      }
      if (includeResources) {
        assert.deepEqual(result.data.find((row: { source?: string }) => row.source === 'resource').roles, ['author', 'creator']);
      }
    }
    const detail = await fetch(`${baseUrl}/person-test`);
    assert.equal(detail.status, 200);
    assert.deepEqual((await detail.json()).person.roles, ['owner', 'founder', 'scout']);
    assert.deepEqual(person.roles, ['owner', 'Founder', 'Owner', ' Scout '], 'Listing must not mutate stored roles');
    console.log('testPeopleListing: OK');
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    mock.restoreAll();
    Object.assign(prisma.user, { findUnique: originals.userFind });
    Object.assign(prisma.roasterPerson, { findMany: originals.peopleFind, findUnique: originals.personFind });
    Object.assign(prisma.resourcePerson, { findMany: originals.resourcePeopleFind });
    Object.assign(prisma.person, { findMany: originals.unassociatedFind });
    await prisma.$disconnect();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
