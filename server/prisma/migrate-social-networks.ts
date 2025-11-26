import { PrismaClient } from '@prisma/client';

async function migrate() {
  const prisma = new PrismaClient();
  try {
    console.log('Starting social networks migration...');

    const roasters = await prisma.roaster.findMany({
      select: {
        id: true,
        instagram: true,
        tiktok: true,
        facebook: true,
        linkedin: true,
        youtube: true,
        threads: true,
        pinterest: true,
        bluesky: true,
        x: true,
        reddit: true,
      }
    });

    let updated = 0;
    for (const r of roasters) {
      const map: Record<string, string> = {};
      if (r.instagram) map['instagram'] = r.instagram;
      if (r.tiktok) map['tiktok'] = r.tiktok;
      if (r.facebook) map['facebook'] = r.facebook;
      if (r.linkedin) map['linkedin'] = r.linkedin;
      if (r.youtube) map['youtube'] = r.youtube;
      if (r.threads) map['threads'] = r.threads;
      if (r.pinterest) map['pinterest'] = r.pinterest;
      if (r.bluesky) map['bluesky'] = r.bluesky;
      if (r.x) map['x'] = r.x;
      if (r.reddit) map['reddit'] = r.reddit;

      if (Object.keys(map).length > 0) {
        await prisma.roaster.update({
          where: { id: r.id },
          data: { socialNetworks: map }
        });
        updated += 1;
      }
    }

    console.log(`Migration complete. Updated ${updated} roaster(s).`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

migrate();
