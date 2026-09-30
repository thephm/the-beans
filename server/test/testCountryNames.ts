import { normalizeCountryName } from '../src/lib/countryNames';

const aliases = ['U.S.A.', 'U.S.A', 'USA', 'U.S.', 'U.S', 'United States'];

for (const alias of aliases) {
  if (normalizeCountryName(alias) !== 'United States of America') {
    throw new Error(`Expected ${alias} to normalize to United States of America`);
  }
}

if (normalizeCountryName('  France  ') !== 'France') {
  throw new Error('Expected country names without aliases to be trimmed');
}

console.log('testCountryNames: OK');
