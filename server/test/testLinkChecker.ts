import { isBrokenHttpStatus } from '../src/lib/linkChecker';

function assertEqual(label: string, actual: boolean, expected: boolean) {
  if (actual !== expected) {
    console.error(`${label} expected ${expected} but got ${actual}`);
    process.exit(1);
  }
}

try {
  assertEqual('429-status', isBrokenHttpStatus(429), false);
  assertEqual('404-status', isBrokenHttpStatus(404), true);
  assertEqual('500-status', isBrokenHttpStatus(500), true);

  console.log('testLinkChecker: OK');
  process.exit(0);
} catch (error) {
  console.error('testLinkChecker: FAILED', error);
  process.exit(2);
}
