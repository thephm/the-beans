import assert from 'node:assert/strict';
import { normalizePersonRole, normalizePersonRoles } from '../src/lib/personRoles';

const cases: [unknown, unknown][] = [
  ['Owner', 'owner'],
  [' Founder ', 'founder'],
  ['marketing', 'marketing'],
  [null, null],
  [42, 42],
];

for (const [input, expected] of cases) {
  if (normalizePersonRole(input) !== expected) {
    throw new Error(`Expected ${String(input)} to normalize to ${String(expected)}`);
  }
}

const roles = ['Owner', 'founder', 'owner', ' Scout ', 'Founder', 'scout'];
assert.deepEqual(normalizePersonRoles(roles), ['owner', 'founder', 'scout']);
assert.deepEqual(roles, ['Owner', 'founder', 'owner', ' Scout ', 'Founder', 'scout']);
assert.deepEqual(normalizePersonRoles([]), []);

console.log('testPersonRoles: OK');
