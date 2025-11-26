import { PrismaClient } from '@prisma/client';

async function verify() {
  const prisma = new PrismaClient();
  try {
    console.log('Verifying socialNetworks migration...');
    // Use raw SQL to avoid Prisma JSON filter typing issues
    const countResult = await prisma.$queryRawUnsafe<[{ count: string }]>(
      `SELECT COUNT(*)::text as count FROM roasters WHERE "socialNetworks" IS NULL AND (
         instagram IS NOT NULL OR tiktok IS NOT NULL OR facebook IS NOT NULL OR linkedin IS NOT NULL OR
         youtube IS NOT NULL OR threads IS NOT NULL OR pinterest IS NOT NULL OR bluesky IS NOT NULL OR
         x IS NOT NULL OR reddit IS NOT NULL
       )`
    )

    const count = Number(countResult[0]?.count || 0)

    if (count === 0) {
      console.log('Verification passed — no legacy social fields remain without socialNetworks.')
      await prisma.$disconnect()
      process.exit(0)
    }

    console.error(`Verification failed — ${count} roaster(s) still have legacy social fields but no socialNetworks.`)

    // List some offending roasters (up to 20) to help debugging
    const offenders = await prisma.$queryRawUnsafe(
      `SELECT id, name, instagram, tiktok, facebook, linkedin, youtube, threads, pinterest, bluesky, x, reddit
       FROM roasters
       WHERE "socialNetworks" IS NULL AND (
         instagram IS NOT NULL OR tiktok IS NOT NULL OR facebook IS NOT NULL OR linkedin IS NOT NULL OR
         youtube IS NOT NULL OR threads IS NOT NULL OR pinterest IS NOT NULL OR bluesky IS NOT NULL OR
         x IS NOT NULL OR reddit IS NOT NULL
       )
       LIMIT 20`
    )

    console.error('Sample offending roasters:', offenders)
    await prisma.$disconnect()
    process.exit(2)
  } catch (err) {
    console.error('Verification script failed:', err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

verify();
