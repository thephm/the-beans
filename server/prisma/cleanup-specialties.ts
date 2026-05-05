import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Approved specialties list
const approvedSpecialties = [
  'Direct Trade',
  'Fair Trade',
  'Organic',
  'Light Roast',
  'Single Origin',
  'Microlots',
  'Experimental',
  'Espresso',
  'Omni Roast',
  'Awards',
  'Sustainable',
  'Subscription',
  'Wholesale',
  'Carbon Neutral',
  'Decaf',
  'Education'
];

async function cleanupSpecialties() {
  console.log('🧹 Starting specialty cleanup...');
  
  try {
    // Find all specialties with their English translations
    const allSpecialties = await prisma.specialty.findMany({
      include: {
        translations: {
          where: {
            language: 'en'
          }
        },
        roasters: true // Include roaster relations to check usage
      }
    });

    console.log(`📊 Found ${allSpecialties.length} total specialties in database`);

    // Identify specialties to remove
    const specialtiesToRemove = allSpecialties.filter(specialty => {
      const enTranslation = specialty.translations.find(t => t.language === 'en');
      if (!enTranslation) {
        console.log(`⚠️  Specialty ${specialty.id} has no English translation, marking for removal`);
        return true;
      }
      
      const isApproved = approvedSpecialties.includes(enTranslation.name);
      if (!isApproved) {
        console.log(`❌ Found non-approved specialty: "${enTranslation.name}" (ID: ${specialty.id})`);
        console.log(`   Used by ${specialty.roasters.length} roaster(s)`);
      }
      return !isApproved;
    });

    if (specialtiesToRemove.length === 0) {
      console.log('✅ No specialties to remove. Database is clean!');
      return;
    }

    console.log(`\n🗑️  Removing ${specialtiesToRemove.length} non-approved specialties...`);

    // Remove specialties (cascade will handle RoasterSpecialty relations and translations)
    for (const specialty of specialtiesToRemove) {
      const enTranslation = specialty.translations.find(t => t.language === 'en');
      const name = enTranslation?.name || 'Unknown';
      
      await prisma.specialty.delete({
        where: { id: specialty.id }
      });
      
      console.log(`   ✓ Removed: "${name}" (${specialty.roasters.length} roaster links deleted)`);
    }

    console.log('\n✅ Specialty cleanup completed!');
    console.log(`📊 Removed ${specialtiesToRemove.length} specialties`);
    
    // Verify final state
    const remainingSpecialties = await prisma.specialty.findMany({
      include: {
        translations: {
          where: { language: 'en' }
        }
      }
    });
    
    console.log(`\n📋 Remaining specialties (${remainingSpecialties.length}):`);
    remainingSpecialties.forEach(s => {
      const enName = s.translations.find(t => t.language === 'en')?.name || 'Unknown';
      console.log(`   • ${enName}`);
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

cleanupSpecialties()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
