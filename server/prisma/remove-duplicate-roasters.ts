import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDuplicateRoasters() {
  const allRoasters = await prisma.roaster.findMany({});
  const seen = new Map<string, string>(); // name -> id to keep
  const toDelete: string[] = [];

  for (const roaster of allRoasters) {
    if (seen.has(roaster.name)) {
      toDelete.push(roaster.id);
    } else {
      seen.set(roaster.name, roaster.id);
    }
  }

  if (toDelete.length > 0) {
    // Delete related beans, reviews, favourites for each duplicate roaster
    for (const roasterId of toDelete) {
      await prisma.bean.deleteMany({ where: { roasterId } });
      await prisma.review.deleteMany({ where: { roasterId } });
      await prisma.favourite.deleteMany({ where: { roasterId } });
      // Add more related deletes if needed
    }
    await prisma.roaster.deleteMany({
      where: { id: { in: toDelete } },
    });
    console.log(`Deleted ${toDelete.length} duplicate roasters and their related records.`);
  } else {
    console.log('No duplicate roasters found.');
  }
}

removeDuplicateRoasters()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
