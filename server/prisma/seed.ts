import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      location: 'Seattle, WA',
      latitude: 47.6062,
      longitude: -122.3321,
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create test roasters
  const roaster1 = await prisma.roaster.upsert({
    where: { id: 'roaster1' },
    update: {},
    create: {
      id: 'roaster1',
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
      verified: true,
      featured: true,
      rating: 4.5,
      reviewCount: 1247,
      ownerId: testUser.id,
    },
  });

  const roaster2 = await prisma.roaster.upsert({
    where: { id: 'roaster2' },
    update: {},
    create: {
      id: 'roaster2',
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
      verified: true,
      featured: true,
      rating: 4.7,
      reviewCount: 892,
      ownerId: testUser.id,
    },
  });

  const roaster3 = await prisma.roaster.upsert({
    where: { id: 'roaster3' },
    update: {},
    create: {
      id: 'roaster3',
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
      verified: true,
      featured: true,
      rating: 4.6,
      reviewCount: 756,
      ownerId: testUser.id,
    },
  });

  console.log('✅ Created roasters:', [roaster1.name, roaster2.name, roaster3.name]);

  // Create test cafes
  const cafe1 = await prisma.cafe.upsert({
    where: { id: 'cafe1' },
    update: {},
    create: {
      id: 'cafe1',
      name: 'Blue Bottle Coffee - Hayes Valley',
      address: '315 Linden St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'US',
      latitude: 37.7749,
      longitude: -122.4194,
      phone: '(510) 653-3394',
      website: 'https://bluebottlecoffee.com/cafes/hayes-valley',
      hours: '{"monday": "6:00-19:00", "tuesday": "6:00-19:00", "wednesday": "6:00-19:00", "thursday": "6:00-19:00", "friday": "6:00-19:00", "saturday": "7:00-19:00", "sunday": "7:00-19:00"}',
      amenities: ['WiFi', 'Outdoor Seating', 'Wheelchair Accessible'],
      rating: 4.4,
      reviewCount: 523,
      roasterId: roaster1.id,
    },
  });

  const cafe2 = await prisma.cafe.upsert({
    where: { id: 'cafe2' },
    update: {},
    create: {
      id: 'cafe2',
      name: 'Stumptown Coffee - Downtown Portland',
      address: '128 SW 3rd Ave',
      city: 'Portland',
      state: 'OR',
      zipCode: '97204',
      country: 'US',
      latitude: 45.5152,
      longitude: -122.6784,
      phone: '(503) 230-7794',
      website: 'https://stumptowncoffee.com/pages/downtown',
      hours: '{"monday": "6:30-18:00", "tuesday": "6:30-18:00", "wednesday": "6:30-18:00", "thursday": "6:30-18:00", "friday": "6:30-18:00", "saturday": "7:00-18:00", "sunday": "7:00-18:00"}',
      amenities: ['WiFi', 'Meeting Rooms', 'Pour Over Bar'],
      rating: 4.6,
      reviewCount: 381,
      roasterId: roaster2.id,
    },
  });

  const cafe3 = await prisma.cafe.upsert({
    where: { id: 'cafe3' },
    update: {},
    create: {
      id: 'cafe3',
      name: 'Intelligentsia Coffee - Millennium Park',
      address: '53 E Randolph St',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'US',
      latitude: 41.8781,
      longitude: -87.6298,
      phone: '(312) 253-0594',
      website: 'https://intelligentsiacoffee.com/pages/millennium-park',
      hours: '{"monday": "6:00-19:00", "tuesday": "6:00-19:00", "wednesday": "6:00-19:00", "thursday": "6:00-19:00", "friday": "6:00-19:00", "saturday": "7:00-19:00", "sunday": "7:00-19:00"}',
      amenities: ['WiFi', 'Laptop Friendly', 'Cupping Classes'],
      rating: 4.5,
      reviewCount: 627,
      roasterId: roaster3.id,
    },
  });

  console.log('✅ Created cafes:', [cafe1.name, cafe2.name, cafe3.name]);

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
