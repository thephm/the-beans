import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateSpecialties() {
  console.log('Starting specialty migration...');

  try {
    // Get all roasters with specialties
    const roasters = await prisma.$queryRaw<any[]>`
      SELECT id, specialties FROM roasters WHERE array_length(specialties, 1) > 0
    `;

    console.log(`Found ${roasters.length} roasters with specialties`);

    for (const roaster of roasters) {
      const specialtyNames = roaster.specialties as string[];
      console.log(`\nMigrating roaster ${roaster.id} with specialties:`, specialtyNames);

      for (const specialtyName of specialtyNames) {
        const trimmedName = specialtyName.trim();
        if (!trimmedName) continue;

        // Find or create the specialty
        // First, try to find by exact name match in English
        let specialty = await prisma.specialty.findFirst({
          where: {
            translations: {
              some: {
                language: 'en',
                name: {
                  equals: trimmedName,
                  mode: 'insensitive',
                },
              },
            },
          },
        });

        // If not found, create a new specialty
        if (!specialty) {
          console.log(`  Creating new specialty: "${trimmedName}"`);
          specialty = await prisma.specialty.create({
            data: {
              deprecated: false,
              translations: {
                create: [
                  {
                    language: 'en',
                    name: trimmedName,
                    description: `Specialty: ${trimmedName}`,
                  },
                  {
                    language: 'fr',
                    name: trimmedName, // Use English name as fallback
                    description: `Spécialité : ${trimmedName}`,
                  },
                ],
              },
            },
          });
        } else {
          console.log(`  Found existing specialty: "${trimmedName}" (${specialty.id})`);
        }

        // Create the roaster-specialty relationship if it doesn't exist
        const existingRelation = await prisma.roasterSpecialty.findUnique({
          where: {
            roasterId_specialtyId: {
              roasterId: roaster.id,
              specialtyId: specialty.id,
            },
          },
        });

        if (!existingRelation) {
          await prisma.roasterSpecialty.create({
            data: {
              roasterId: roaster.id,
              specialtyId: specialty.id,
            },
          });
          console.log(`  ✓ Linked roaster to specialty`);
        } else {
          console.log(`  ⚠ Relationship already exists`);
        }
      }
    }

    console.log('\n✓ Migration complete!');
    console.log('You can now run: docker-compose exec server npx prisma migrate dev');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateSpecialties()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
