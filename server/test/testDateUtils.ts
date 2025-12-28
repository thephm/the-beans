import { parseFromDate, parseToDate } from '../src/lib/dateUtils';

function assertEqual(label: string, a: number, b: number) {
  if (a !== b) {
    console.error(`${label} expected ${b} but got ${a}`);
    process.exit(1);
  }
}

try {
  const f = parseFromDate('2025-12-27');
  const t = parseToDate('2025-12-27');
  if (!f || !t) throw new Error('Returned undefined');
  assertEqual('from-date-ms', f.getTime(), Date.UTC(2025, 11, 27, 0, 0, 0, 0));
  assertEqual('to-date-ms', t.getTime(), Date.UTC(2025, 11, 27, 23, 59, 59, 999));

  const f2 = parseFromDate('2025-12-27T05:30:00Z');
  const t2 = parseToDate('2025-12-27T05:30:00Z');
  if (!f2 || !t2) throw new Error('Returned undefined for iso');
  assertEqual('from-iso-ms', f2.getTime(), new Date('2025-12-27T05:30:00Z').getTime());
  assertEqual('to-iso-ms', t2.getTime(), new Date('2025-12-27T05:30:00Z').getTime());

  console.log('testDateUtils: OK');
  process.exit(0);
} catch (err) {
  console.error('testDateUtils: FAILED', err);
  process.exit(2);
}
