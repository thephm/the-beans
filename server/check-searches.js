const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSearches() {
  try {
    const searches = await prisma.search.findMany({
      orderBy: { count: 'desc' }
    });
    console.log('Popular searches in database:');
    console.log(JSON.stringify(searches, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSearches();