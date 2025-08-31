import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Starting database seed

  // Create or update default admin user using env vars
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminFirstName = process.env.ADMIN_FIRSTNAME || 'Admin';
  const adminLastName = process.env.ADMIN_LASTNAME || 'User';
  const adminLocation = process.env.ADMIN_LOCATION || 'Headquarters';
  const adminRole = 'admin';
  const adminHashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      username: adminUsername,
      password: adminHashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      location: adminLocation,
      role: adminRole,
    },
    create: {
      email: adminEmail,
      username: adminUsername,
      password: adminHashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      location: adminLocation,
      role: adminRole,
    },
  });

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'coffee@lover.com' },
    update: {
      username: 'coffeelover',
      password: hashedPassword,
      firstName: 'Coffee',
      lastName: 'Lover',
      bio: 'Passionate about discovering the best coffee roasters!',
      location: 'Seattle, WA',
      latitude: 47.6062,
      longitude: -122.3321,
    },
    create: {
      email: 'coffee@lover.com',
      username: 'coffeelover',
      password: hashedPassword,
      firstName: 'Coffee',
      lastName: 'Lover',
      bio: 'Passionate about discovering the best coffee roasters!',
      location: 'Seattle, WA',
      latitude: 47.6062,
      longitude: -122.3321,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bean@enthusiast.com' },
    update: {
      username: 'beanenthusiast',
      password: hashedPassword,
      firstName: 'Bean',
      lastName: 'Enthusiast',
      bio: 'Single origin coffee specialist and roaster owner.',
      location: 'Portland, OR',
      latitude: 45.5152,
      longitude: -122.6784,
    },
    create: {
      email: 'bean@enthusiast.com',
      username: 'beanenthusiast',
      password: hashedPassword,
      firstName: 'Bean',
      lastName: 'Enthusiast',
      bio: 'Single origin coffee specialist and roaster owner.',
      location: 'Portland, OR',
      latitude: 45.5152,
      longitude: -122.6784,
    },
  });

  // Create roasters
  const roaster1 = await prisma.roaster.create({
    data: {
      name: 'Purple Mountain Coffee',
      description: 'Award-winning roaster specializing in light roasts and pour-over brewing methods. We source our beans directly from farmers around the world.',
      email: 'hello@purplemountaincoffee.com',
      phone: '(206) 555-0123',
      website: 'https://purplemountaincoffee.com',
      address: '1234 Pine Street',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      latitude: 47.6097,
      longitude: -122.3331,
      images: [
        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'
      ],
      hours: {
        monday: { open: '07:00', close: '19:00' },
        tuesday: { open: '07:00', close: '19:00' },
        wednesday: { open: '07:00', close: '19:00' },
        thursday: { open: '07:00', close: '19:00' },
        friday: { open: '07:00', close: '20:00' },
        saturday: { open: '08:00', close: '20:00' },
        sunday: { open: '08:00', close: '18:00' }
      },
      priceRange: '$$',
      specialties: ['Single Origin', 'Pour Over', 'Light Roast', 'Ethiopian'],
      verified: true,
      featured: true,
      rating: 4.8,
      reviewCount: 142,
      ownerId: user1.id,
    },
  });

  const roaster2 = await prisma.roaster.create({
    data: {
      name: 'Lavender Bean Co.',
      description: 'Family-owned roastery with multiple locations and online ordering. We focus on creating the perfect espresso blends.',
      email: 'info@lavenderbeancoffe.com',
      phone: '(503) 555-0456',
      website: 'https://lavenderbeanco.com',
      address: '5678 Oak Avenue',
      city: 'Portland',
      state: 'OR',
      zipCode: '97205',
      latitude: 45.5158,
      longitude: -122.6793,
      images: [
        'https://images.unsplash.com/photo-1442550528053-c431ecb55509?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop'
      ],
      hours: {
        monday: { open: '06:30', close: '18:00' },
        tuesday: { open: '06:30', close: '18:00' },
        wednesday: { open: '06:30', close: '18:00' },
        thursday: { open: '06:30', close: '18:00' },
        friday: { open: '06:30', close: '19:00' },
        saturday: { open: '07:00', close: '19:00' },
        sunday: { open: '07:00', close: '17:00' }
      },
      priceRange: '$$$',
      specialties: ['Espresso', 'Blends', 'Italian Roast', 'Fair Trade'],
      verified: true,
      featured: true,
      rating: 4.9,
      reviewCount: 89,
      ownerId: user2.id,
    },
  });

  const roaster3 = await prisma.roaster.create({
    data: {
      name: 'Violet Coffee Works',
      description: 'Modern roastery focusing on sustainable sourcing and innovative brewing techniques. Cold brew specialists.',
      email: 'team@violetcoffeeworks.com',
      phone: '(415) 555-0789',
      website: 'https://violetcoffeeworks.com',
      address: '9012 Market Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      latitude: 37.7749,
      longitude: -122.4194,
      images: [
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'
      ],
      hours: {
        monday: { open: '07:00', close: '16:00' },
        tuesday: { open: '07:00', close: '16:00' },
        wednesday: { open: '07:00', close: '16:00' },
        thursday: { open: '07:00', close: '16:00' },
        friday: { open: '07:00', close: '16:00' },
        saturday: { closed: true },
        sunday: { closed: true }
      },
      priceRange: '$$',
      specialties: ['Cold Brew', 'Nitro Coffee', 'Sustainable', 'Medium Roast'],
      verified: true,
      featured: false,
      rating: 4.7,
      reviewCount: 67,
      ownerId: user1.id,
    },
  });

  // Create beans
  await prisma.bean.create({
    data: {
      name: 'Ethiopian Yirgacheffe',
      description: 'Bright and floral with notes of lemon and tea. Light roast.',
      origin: 'Yirgacheffe, Ethiopia',
      process: 'Washed',
      roastLevel: 'Light',
      price: 18.99,
      weight: '12oz',
      tastingNotes: ['Lemon', 'Floral', 'Tea', 'Bright'],
      availability: true,
      roasterId: roaster1.id,
    },
  });

  await prisma.bean.create({
    data: {
      name: 'House Espresso Blend',
      description: 'Our signature espresso blend with chocolate and caramel notes.',
      origin: 'Guatemala & Brazil',
      process: 'Various',
      roastLevel: 'Medium-Dark',
      price: 16.99,
      weight: '12oz',
      tastingNotes: ['Chocolate', 'Caramel', 'Nutty', 'Smooth'],
      availability: true,
      roasterId: roaster2.id,
    },
  });

  // Database seeded successfully
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
