import assert from 'node:assert/strict';
import { hasExistingApplicationData, SeedGuardClient } from '../src/lib/seedGuard';

const modelNames: (keyof SeedGuardClient)[] = [
  'user',
  'roaster',
  'resource',
  'specialty',
  'region',
  'country',
];

function createClient(existingModel?: keyof SeedGuardClient): SeedGuardClient {
  const count = (model: keyof SeedGuardClient) => async () => model === existingModel ? 1 : 0;

  return {
    user: { count: count('user') },
    roaster: { count: count('roaster') },
    resource: { count: count('resource') },
    specialty: { count: count('specialty') },
    region: { count: count('region') },
    country: { count: count('country') },
  };
}

async function run() {
  assert.equal(await hasExistingApplicationData(createClient()), false);

  for (const model of modelNames) {
    assert.equal(await hasExistingApplicationData(createClient(model)), true, `Expected ${model} data to prevent seeding`);
  }

  console.log('testSeedGuard: OK');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
