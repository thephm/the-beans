import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { AddressInfo } from 'node:net';
import express from 'express';
import { prisma } from '../src/lib/prisma';

interface PostedRoaster {
  roasterId: string;
  roaster: { city: string; country: string };
}

interface Candidate {
  id: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  createdAt: Date;
}

async function run() {
  let existingPosts: PostedRoaster[] = [];
  let candidates: Candidate[] = [];
  const originals = {
    userFind: prisma.user.findUnique,
    postFind: prisma.post.findMany,
    roasterFind: prisma.roaster.findMany,
  };
  const jwt = require('jsonwebtoken');

  Object.assign(prisma.user, { findUnique: mock.fn(async () => ({ id: 'admin-test', role: 'admin' })) });
  Object.assign(prisma.post, { findMany: mock.fn(async () => existingPosts) });
  Object.assign(prisma.roaster, { findMany: mock.fn(async () => candidates) });

  const { default: postsRouter } = await import('../src/routes/posts');
  const app = express();
  app.use('/api/posts', postsRouter);
  const server = app.listen(0, '127.0.0.1');

  const roaster = (id: string, city: string, country: string, createdAt = 0): Candidate => ({
    id, name: id, city, state: null, country, createdAt: new Date(createdAt),
  });
  const post = (roasterId: string, city: string, country: string): PostedRoaster => ({
    roasterId, roaster: { city, country },
  });

  try {
    if (!server.listening) await new Promise<void>(resolve => server.once('listening', resolve));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/posts/suggestion`;
    const token = jwt.sign({ userId: 'admin-test' }, process.env.JWT_SECRET || 'fallback-secret');
    const suggest = async (posts: PostedRoaster[], roasters: Candidate[]) => {
      existingPosts = posts;
      candidates = roasters;
      const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      assert.equal(response.status, 200);
      return (await response.json()).suggestion?.id || null;
    };

    assert.equal(await suggest([], [
      roaster('us', 'New York', 'United States of America', -1),
      roaster('unposted', 'Lisbon', 'Portugal'),
    ]), 'unposted', 'US roasters must be excluded');

    assert.equal(await suggest([
      post('canada-toronto', 'Toronto', 'Canada'),
      post('canada-vancouver', 'Vancouver', 'Canada'),
      post('france-lyon', 'Lyon', 'France'),
    ], [
      roaster('canada-ottawa', 'Ottawa', 'Canada'),
      roaster('france-marseille', 'Marseille', 'France'),
    ]), 'france-marseille', 'A country with one posted roaster precedes an unseen Canadian city');

    assert.equal(await suggest([
      post('canada-toronto', 'Toronto', 'Canada'),
      post('canada-vancouver', 'Vancouver', 'Canada'),
      post('france-paris', 'Paris', 'France'),
      post('france-lyon', 'Lyon', 'France'),
    ], [
      roaster('france-nice', 'Nice', 'France'),
      roaster('canada-montreal', 'Montreal', 'Canada'),
    ]), 'canada-montreal', 'An unseen Canadian city precedes another non-US city');

    assert.equal(await suggest([
      post('canada-toronto', 'Toronto', 'Canada'),
      post('canada-vancouver', 'Vancouver', 'Canada'),
      post('canada-calgary', 'Calgary', 'Canada'),
      post('france-paris', 'Paris', 'France'),
      post('france-lyon', 'Lyon', 'France'),
    ], [
      roaster('canada-toronto-new', 'Toronto', 'Canada'),
      roaster('france-nice', 'Nice', 'France'),
    ]), 'canada-toronto-new', 'A Canadian city with one posted roaster precedes an unseen non-US city');

    assert.equal(await suggest([
      post('brazil-rio', 'Rio', 'Brazil'),
      post('brazil-curitiba-posted', 'Curitiba', 'Brazil'),
      post('france-paris', 'Paris', 'France'),
      post('france-lyon', 'Lyon', 'France'),
    ], [
      roaster('brazil-curitiba', 'Curitiba', 'Brazil'),
      roaster('france-nice', 'Nice', 'France'),
    ]), 'france-nice', 'An unseen non-US city precedes countries with two posted roasters');

    assert.equal(await suggest([
      post('canada-paris', 'Paris', 'Canada'),
      post('france-lyon', 'Lyon', 'France'),
      post('france-marseille', 'Marseille', 'France'),
      post('france-nice', 'Nice', 'France'),
    ], [
      roaster('france-paris', 'Paris', 'France'),
    ]), 'france-paris', 'Cities with the same name in different countries are counted separately');

    assert.equal(await suggest([
      post('brazil-rio', 'Rio', 'Brazil'),
      post('brazil-curitiba-posted', 'Curitiba', 'Brazil'),
      post('canada-toronto-1', 'Toronto', 'Canada'),
      post('canada-toronto-2', 'Toronto', 'Canada'),
      post('canada-vancouver-1', 'Vancouver', 'Canada'),
      post('canada-vancouver-2', 'Vancouver', 'Canada'),
      post('france-paris', 'Paris', 'France'),
      post('france-paris-2', 'Paris', 'France'),
      post('france-paris-3', 'Paris', 'France'),
    ], [
      roaster('brazil-curitiba', 'Curitiba', 'Brazil'),
      roaster('canada-toronto-new', 'Toronto', 'Canada'),
      roaster('france-paris-new', 'Paris', 'France'),
    ]), 'brazil-curitiba', 'A country with two posted roasters is eligible before the next city tiers');

    assert.equal(await suggest([
      post('canada-toronto-1', 'Toronto', 'Canada'),
      post('canada-toronto-2', 'Toronto', 'Canada'),
      post('canada-vancouver-1', 'Vancouver', 'Canada'),
      post('canada-vancouver-2', 'Vancouver', 'Canada'),
      post('canada-calgary-1', 'Calgary', 'Canada'),
      post('canada-calgary-2', 'Calgary', 'Canada'),
      post('canada-montreal-1', 'Montreal', 'Canada'),
      post('canada-montreal-2', 'Montreal', 'Canada'),
      post('france-paris', 'Paris', 'France'),
      post('france-paris-2', 'Paris', 'France'),
      post('france-paris-3', 'Paris', 'France'),
    ], [
      roaster('canada-toronto-new', 'Toronto', 'Canada'),
      roaster('france-paris-new', 'Paris', 'France'),
    ]), 'canada-toronto-new', 'A Canadian city with two posted roasters is eligible before the final city tier');

    assert.equal(await suggest([
      post('canada-toronto-1', 'Toronto', 'Canada'),
      post('canada-toronto-2', 'Toronto', 'Canada'),
      post('canada-vancouver-1', 'Vancouver', 'Canada'),
      post('canada-vancouver-2', 'Vancouver', 'Canada'),
      post('canada-calgary-1', 'Calgary', 'Canada'),
      post('canada-calgary-2', 'Calgary', 'Canada'),
      post('canada-montreal-1', 'Montreal', 'Canada'),
      post('canada-montreal-2', 'Montreal', 'Canada'),
      post('france-paris', 'Paris', 'France'),
      post('france-lyon', 'Lyon', 'France'),
      post('france-nice', 'Nice', 'France'),
      post('france-bordeaux', 'Bordeaux', 'France'),
    ], [
      roaster('france-paris-new', 'Paris', 'France'),
    ]), 'france-paris-new', 'A non-US city with one posted roaster is eligible as the final tier');

    assert.equal(await suggest([
      post('portugal-lisbon', 'Lisbon', 'Portugal'),
      post('portugal-lisbon', 'Lisbon', 'Portugal'),
      post('portugal-porto', 'Porto', 'Portugal'),
      post('portugal-faro', 'Faro', 'Portugal'),
    ], [
      roaster('portugal-lisbon-new', 'Lisbon', 'Portugal'),
    ]), 'portugal-lisbon-new', 'Multiple posts for one roaster count as a single city roaster');

    console.log('testPostSuggestion: OK');
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    mock.restoreAll();
    Object.assign(prisma.user, { findUnique: originals.userFind });
    Object.assign(prisma.post, { findMany: originals.postFind });
    Object.assign(prisma.roaster, { findMany: originals.roasterFind });
    await prisma.$disconnect();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
