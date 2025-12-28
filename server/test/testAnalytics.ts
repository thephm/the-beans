import { getEventStats } from '../src/lib/analyticsService';

async function run() {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const stats = await getEventStats({ eventType: 'page_view', from: weekAgo, to: now, groupBy: 'day' });
    if (!Array.isArray(stats)) {
      console.error('getEventStats did not return an array');
      process.exit(2);
    }
    console.log('getEventStats returned', stats.length, 'rows');
    // Print first few rows for inspection
    console.dir(stats.slice(0, 5), { depth: null });
    process.exit(0);
  } catch (err) {
    console.error('Error running analytics test:', err);
    process.exit(3);
  }
}

run();
