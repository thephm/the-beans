import { prisma } from '../src/lib/prisma';
import { parseDateOnlyStart, parseDateOnlyEnd } from '../src/lib/dateUtils';

async function run() {
  try {
    const dateStr = process.argv[2] || '2025-12-28';
    const start = parseDateOnlyStart(dateStr);
    const end = parseDateOnlyEnd(dateStr);

    const rangeCount = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const raw = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM audit_logs WHERE "createdAt"::date = to_date(${dateStr}, 'YYYY-MM-DD')`;
    const dateCount = Array.isArray(raw) && raw[0] && (raw[0] as any).cnt ? parseInt((raw[0] as any).cnt, 10) : 0;

    console.log('Date:', dateStr);
    console.log('Range count (parsed start/end):', rangeCount);
    console.log('Date-only count (DB ::date):', dateCount);

    if (rangeCount === dateCount) {
      console.log('OK: parsed range matches DB date count');
      process.exit(0);
    } else {
      console.error('Mismatch: parsed range does NOT match DB date count');
      process.exit(2);
    }
  } catch (err) {
    console.error('Error running test:', err);
    process.exit(3);
  } finally {
    await prisma.$disconnect();
  }
}

run();
