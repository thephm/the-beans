import { prisma } from '../lib/prisma';

export async function logEvent({ eventType, eventData, sessionId, userAgent, ipHash }: {
  eventType: string;
  eventData?: any;
  sessionId?: string;
  userAgent?: string;
  ipHash?: string;
}) {
  return prisma.analyticsEvent.create({
    data: {
      eventType,
      eventData,
      sessionId,
      userAgent,
      ipHash,
    },
  });
}

export async function getEventStats({
  eventType,
  from,
  to,
  groupBy = 'day',
  page,
}: {
  eventType?: string;
  from?: Date;
  to?: Date;
  groupBy?: 'day' | 'hour';
  page?: string | string[];
}) {
  // Fallback implementation using Prisma client to fetch matching events
  // and aggregate in JS to avoid fragile raw-SQL interpolation issues.
  const where: any = {};
  if (eventType) where.eventType = eventType;
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = from instanceof Date ? from : new Date(String(from));
    if (to) where.timestamp.lte = to instanceof Date ? to : new Date(String(to));
  }

  let pagesFilter: string[] | undefined;
  if (page) {
    pagesFilter = Array.isArray(page) ? page.map(String) : [String(page)];
  }

  const events = await prisma.analyticsEvent.findMany({
    where,
    select: { eventType: true, eventData: true, timestamp: true },
    orderBy: { timestamp: 'desc' },
  });

  const counts: Record<string, any> = {};

  for (const e of events) {
    if (pagesFilter && pagesFilter.length > 0) {
      const ed: any = e.eventData;
      const path = (ed as any)['path'] || (ed as any)['page'] || null;
      if (!path || !pagesFilter.includes(String(path))) continue;
    }
    const ts = new Date(e.timestamp as any);
    let period: string;
    if (groupBy === 'hour') {
      const yyyy = ts.getUTCFullYear();
      const mm = String(ts.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(ts.getUTCDate()).padStart(2, '0');
      const hh = String(ts.getUTCHours()).padStart(2, '0');
      period = `${yyyy}-${mm}-${dd} ${hh}`;
    } else {
      period = ts.toISOString().slice(0, 10);
    }

    if (eventType === 'page_view') {
        const ed: any = e.eventData;
        const pagePath = (ed as any)['path'] || (ed as any)['page'] || 'unknown';
      const key = `${period}::${String(e.eventType)}::${pagePath}`;
      counts[key] = (counts[key] || 0) + 1;
    } else {
      const key = `${period}::${String(e.eventType)}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  // Convert counts map into array similar to previous raw SQL output
  const results: any[] = [];
  for (const k of Object.keys(counts)) {
    const parts = k.split('::');
    const period = parts[0];
    const evType = parts[1];
    const pageVal = parts[2];
    const row: any = { period, event_type: evType, count: counts[k] };
    if (pageVal !== undefined) row.page = pageVal;
    results.push(row);
  }

  // sort by period desc (string sort works for YYYY-MM-DD and YYYY-MM-DD HH)
  results.sort((a, b) => (a.period < b.period ? 1 : a.period > b.period ? -1 : 0));
  return results;
}
