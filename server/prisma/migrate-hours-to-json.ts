import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migrate-hours-to-json...');

  // Fetch all roasters and filter in JS to avoid TypeScript Prisma JSON filter typing issues
  const roasters = await prisma.roaster.findMany({
    select: { id: true, hours: true }
  });

  let converted = 0;
  for (const r of roasters) {
    const h = r.hours as any;
    if (typeof h === 'string') {
      try {
        const parsed = JSON.parse(h);
        await prisma.roaster.update({
          where: { id: r.id },
          data: { hours: parsed }
        });
        converted++;
        console.log(`Converted roaster ${r.id}`);
      } catch (err) {
        console.warn(`Skipping roaster ${r.id}: failed to parse hours string`, err);
      }
    }
  }

  console.log(`Done. Converted ${converted} roaster(s).`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
