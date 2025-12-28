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
  // Group by day or hour, and for page_view, group by eventData->>'path'
  const { Prisma } = require('@prisma/client');
  const where: any[] = [];
  if (eventType) {
    where.push(Prisma.sql`"eventType" = ${eventType}`);
  }
  if (from) {
    where.push(Prisma.sql`timestamp >= ${from}`);
  }
  if (to) {
    where.push(Prisma.sql`timestamp <= ${to}`);
  }
  // If specific page(s) were requested, add them to the WHERE clause
  // so the DB performs the filtering server-side instead of relying
  // on client-side filtering.
  if (page) {
    let pages = Array.isArray(page) ? page : [page];
    pages = pages.map(p => String(p));
    if (pages.length === 1) {
      where.push(Prisma.sql`("eventData"->>'path') = ${pages[0]}`);
    } else if (pages.length > 1) {
      const orClauses = pages.map(p => Prisma.sql`("eventData"->>'path') = ${p}`);
      where.push(Prisma.sql`(${Prisma.join(orClauses, Prisma.sql` OR `)})`);
    }
  }
  const whereSQL = where.length > 0 ? Prisma.sql`WHERE ${Prisma.join(where, Prisma.sql` AND `)}` : Prisma.empty;

  let query;
  // If eventType is 'page_view', group by eventData->>'path' as page
  if (eventType === 'page_view') {
    // page filtering already handled above; nothing additional needed here
    if (groupBy === 'hour') {
      query = Prisma.sql`
        SELECT to_char(timestamp, 'YYYY-MM-DD HH24') as period, "eventType" as event_type, "eventData"->>'path' as page, count(*) as count
        FROM "analytics_events"
        ${whereSQL}
        GROUP BY period, "eventType", page
        ORDER BY period DESC, page
      `;
    } else {
      query = Prisma.sql`
        SELECT to_char(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD') as period, "eventType" as event_type, "eventData"->>'path' as page, count(*) as count
        FROM "analytics_events"
        ${whereSQL}
        GROUP BY period, "eventType", page
        ORDER BY period DESC, page
      `;
    }
  } else {
    if (groupBy === 'hour') {
      query = Prisma.sql`
        SELECT to_char(timestamp, 'YYYY-MM-DD HH24') as period, "eventType" as event_type, count(*) as count
        FROM "analytics_events"
        ${whereSQL}
        GROUP BY period, "eventType"
        ORDER BY period DESC
      `;
    } else {
      query = Prisma.sql`
        SELECT to_char(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD') as period, "eventType" as event_type, count(*) as count
        FROM "analytics_events"
        ${whereSQL}
        GROUP BY period, "eventType"
        ORDER BY period DESC
      `;
    }
  }
  try {
    return await prisma.$queryRaw(query);
  } catch (err) {
    console.error('Error in getEventStats:', err);
    throw err;
  }
}
