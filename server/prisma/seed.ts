import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create a test user for roaster ownership
  const testUser = await prisma.user.upsert({
    where: { email: 'coffee@lover.com' },
    update: {},
    create: {
      email: 'coffee@lover.com',
      username: 'coffeelover',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Coffee',
      lastName: 'Lover',
      location: 'Everywhere',
      latitude: 0,
      longitude: 0,
      role: 'user',
    },
  });
  console.log('🌱 Starting database seeding...');


  // Create default admin user from env vars if not exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminFirstName = process.env.ADMIN_FIRSTNAME || 'Admin';
  const adminLastName = process.env.ADMIN_LASTNAME || 'User';
  const adminLocation = process.env.ADMIN_LOCATION || 'Headquarters';
  const adminLatitude = process.env.ADMIN_LATITUDE ? parseFloat(process.env.ADMIN_LATITUDE) : undefined;
  const adminLongitude = process.env.ADMIN_LONGITUDE ? parseFloat(process.env.ADMIN_LONGITUDE) : undefined;

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: adminUsername,
      password: hashedAdminPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      location: adminLocation,
      latitude: adminLatitude,
      longitude: adminLongitude,
      role: 'admin',
    },
  });
  console.log('✅ Created/ensured admin user:', adminUser.email);

  // Create test roasters
  const roaster1 = await prisma.roaster.upsert({
    where: { name: 'Blue Bottle Coffee' },
    update: {},
    create: {
      name: 'Blue Bottle Coffee',
      description: 'Artisanal coffee roaster focused on freshness and quality.',
      email: 'info@bluebottlecoffee.com',
      phone: '(510) 653-3394',
      website: 'https://bluebottlecoffee.com',
      address: '300 Webster St',
      city: 'Oakland',
      state: 'CA',
      zipCode: '94607',
      country: 'US',
      latitude: 37.8044,
      longitude: -122.2711,
      hours: '{"monday": "6:00-18:00", "tuesday": "6:00-18:00", "wednesday": "6:00-18:00", "thursday": "6:00-18:00", "friday": "6:00-18:00", "saturday": "7:00-18:00", "sunday": "7:00-18:00"}',
      priceRange: '$$$',
      specialties: ['Single Origin', 'Pour Over', 'Cold Brew'],
      images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'],
      verified: true,
      featured: true,
      rating: 4.5,
      reviewCount: 1247,
      ownerId: testUser.id,
    },
  });

  const roaster2 = await prisma.roaster.upsert({
    where: { name: 'Stumptown Coffee Roasters' },
    update: {},
    create: {
      name: 'Stumptown Coffee Roasters',
      description: 'Portland-based roaster known for direct trade relationships.',
      email: 'hello@stumptowncoffee.com',
      phone: '(503) 230-7794',
      website: 'https://stumptowncoffee.com',
      address: '128 SW 3rd Ave',
      city: 'Portland',
      state: 'OR',
      zipCode: '97204',
      country: 'US',
      latitude: 45.5152,
      longitude: -122.6784,
      hours: '{"monday": "6:30-19:00", "tuesday": "6:30-19:00", "wednesday": "6:30-19:00", "thursday": "6:30-19:00", "friday": "6:30-19:00", "saturday": "7:00-19:00", "sunday": "7:00-19:00"}',
      priceRange: '$$$',
      specialties: ['Direct Trade', 'Espresso', 'Single Origin'],
      images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=600&fit=crop'],
      verified: true,
      featured: true,
      rating: 4.7,
      reviewCount: 892,
      ownerId: testUser.id,
    },
  });

  const roaster3 = await prisma.roaster.upsert({
    where: { name: 'Intelligentsia Coffee' },
    update: {},
    create: {
      name: 'Intelligentsia Coffee',
      description: 'Chicago-based specialty coffee roaster with a focus on education.',
      email: 'info@intelligentsiacoffee.com',
      phone: '(773) 348-8058',
      website: 'https://intelligentsiacoffee.com',
      address: '3123 N Broadway',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60657',
      country: 'US',
      latitude: 41.9441,
      longitude: -87.6448,
      hours: '{"monday": "6:00-20:00", "tuesday": "6:00-20:00", "wednesday": "6:00-20:00", "thursday": "6:00-20:00", "friday": "6:00-20:00", "saturday": "7:00-20:00", "sunday": "7:00-20:00"}',
      priceRange: '$$$',
      specialties: ['Education', 'Cupping', 'Single Origin'],
      images: ['https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&h=600&fit=crop'],
      verified: true,
      featured: true,
      rating: 4.6,
      reviewCount: 756,
      ownerId: testUser.id,
    },
  });

  console.log('✅ Created roasters:', [roaster1.name, roaster2.name, roaster3.name]);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
