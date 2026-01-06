import { PrismaClient } from '@prisma/client';
async function main() {
  const prisma = new PrismaClient();

  // Load admin credentials from environment variables
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@thebeans.ca';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';

  // Hash password for security
  const bcrypt = require('bcryptjs');
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  // Create or update admin user
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedAdminPassword,
      username: adminUsername,
      role: 'admin',
      language: 'en',
    },
    create: {
      email: adminEmail,
      password: hashedAdminPassword,
      username: adminUsername,
      role: 'admin',
      language: 'en',
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  // Create a test user for roaster ownership
  const testUser = await prisma.user.upsert({
    where: { email: 'coffee@lover.com' },
    update: {},
    create: {
      email: 'coffee@lover.com',
      username: 'coffee_lover',
      password: 'password123',
      language: 'en',
      role: 'user',
      firstName: 'Coffee',
      lastName: 'Lover',
    },
  });

  // Create roasters using upsert by name, all owned by testUser
  const roaster1 = await prisma.roaster.upsert({
    where: { name: 'Purple Mountain Coffee' },
    update: {},
    create: {
      name: 'Purple Mountain Coffee',
      description: 'A roaster from the mountains.',
      ownerId: testUser.id,
      socialNetworks: {
        instagram: 'https://instagram.com/purplemountain',
      },
    },
  } as any);

  const roaster2 = await prisma.roaster.upsert({
    where: { name: 'Lavender Bean Co.' },
    update: {},
    create: {
      name: 'Lavender Bean Co.',
      description: 'Lavender-infused beans.',
      ownerId: testUser.id,
      socialNetworks: {
        facebook: 'https://facebook.com/lavenderbean',
      },
    },
  } as any);

  const roaster3 = await prisma.roaster.upsert({
    where: { name: 'Violet Coffee Works' },
    update: {},
    create: {
      name: 'Violet Coffee Works',
      description: 'Violet-inspired coffee blends.',
      ownerId: testUser.id,
      socialNetworks: {
        twitter: 'https://twitter.com/violetcoffee',
      },
    },
  } as any);

  // Create beans after roasters are created
  await prisma.bean.create({
    data: {
      name: 'Ethiopian Yirgacheffe',
      roasterId: roaster1.id,
      // Add other required fields as needed
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
