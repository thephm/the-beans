import { normalizePersonRole } from '../src/lib/personRoles';

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

console.log('testPersonRoles: OK');
