import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a test user for roaster ownership
  let testUser = await prisma.user.findUnique({
    where: { email: 'coffee@lover.com' }
  });

  if (!testUser) {
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'coffeelover' }
    });

    testUser = await prisma.user.create({
      data: {
        email: 'coffee@lover.com',
        username: existingUser ? `coffeelover_${Date.now()}` : 'coffeelover',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Coffee',
        lastName: 'Lover',
        location: 'Everywhere',
        latitude: 0,
        longitude: 0,
        role: 'user',
        settings: {
          preferences: {
            showOnlyVerified: true,
            distanceUnit: 'km',
            roastLevel: 'no-preference',
            brewingMethods: {
              espresso: false,
              pourOver: false,
              frenchPress: false,
              coldBrew: false
            }
          },
          privacy: {
            showProfile: true,
            allowLocationTracking: false
          }
        }
      },
    });
  }


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

  // Check if admin user already exists by email or username
  let adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { username: adminUsername }
      ]
    }
  });

  if (!adminUser) {
    // Create new admin user if none exists
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedAdminPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        location: adminLocation,
        latitude: adminLatitude,
        longitude: adminLongitude,
        role: 'admin',
        settings: {
          preferences: {
            showOnlyVerified: true,
            distanceUnit: 'km',
            roastLevel: 'no-preference',
            brewingMethods: {
              espresso: false,
              pourOver: false,
              frenchPress: false,
              coldBrew: false
            }
          },
          privacy: {
            showProfile: true,
            allowLocationTracking: false
          }
        }
      },
    });
  } else if (adminUser.role !== 'admin') {
    // Update existing user to admin role if needed
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: 'admin' }
    });
  }
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

  // Seed regions and countries
  console.log('📍 Seeding coffee origin regions and countries...');
  
  // Create regions
  const latinAmerica = await prisma.region.upsert({
    where: { name: 'Latin America' },
    update: {},
    create: {
      name: 'Latin America',
      description: 'Central and South American coffee growing regions'
    }
  });

  const africa = await prisma.region.upsert({
    where: { name: 'Africa' },
    update: {},
    create: {
      name: 'Africa',
      description: 'African coffee growing regions'
    }
  });

  const asiaPacific = await prisma.region.upsert({
    where: { name: 'Asia/Pacific' },
    update: {},
    create: {
      name: 'Asia/Pacific',
      description: 'Asian and Pacific coffee growing regions'
    }
  });

  const caribbean = await prisma.region.upsert({
    where: { name: 'Caribbean' },
    update: {},
    create: {
      name: 'Caribbean',
      description: 'Caribbean coffee growing regions'
    }
  });

  // Create countries with ISO codes and flag SVGs using flagpedia.net CDN
  const countries = [
    // Latin America
    { name: 'Brazil', code: 'BR', regionId: latinAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/br.webp' },
    { name: 'Colombia', code: 'CO', regionId: latinAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/co.webp' },
    { name: 'Guatemala', code: 'GT', regionId: latinAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/gt.webp' },
    { name: 'Costa Rica', code: 'CR', regionId: latinAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/cr.webp' },
    { name: 'Honduras', code: 'HN', regionId: latinAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/hn.webp' },
    { name: 'Mexico', code: 'MX', regionId: latinAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/mx.webp' },
    { name: 'Peru', code: 'PE', regionId: latinAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/pe.webp' },
    { name: 'Nicaragua', code: 'NI', regionId: latinAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/ni.webp' },
    { name: 'El Salvador', code: 'SV', regionId: latinAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/sv.webp' },
    { name: 'Panama', code: 'PA', regionId: latinAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/pa.webp' },
    { name: 'Ecuador', code: 'EC', regionId: latinAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/ec.webp' },
    { name: 'Bolivia', code: 'BO', regionId: latinAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/bo.webp' },
    
    // Africa
    { name: 'Ethiopia', code: 'ET', regionId: africa.id, flagSvg: 'https://flagpedia.net/data/flags/w580/et.webp' },
    { name: 'Kenya', code: 'KE', regionId: africa.id, flagSvg: 'https://flagpedia.net/data/flags/w580/ke.webp' },
    { name: 'Tanzania', code: 'TZ', regionId: africa.id, flagSvg: 'https://flagpedia.net/data/flags/w580/tz.webp' },
    { name: 'Rwanda', code: 'RW', regionId: africa.id, flagSvg: 'https://flagpedia.net/data/flags/w580/rw.webp' },
    { name: 'Burundi', code: 'BI', regionId: africa.id, flagSvg: 'https://flagpedia.net/data/flags/w580/bi.webp' },
    { name: 'Uganda', code: 'UG', regionId: africa.id, flagSvg: 'https://flagpedia.net/data/flags/w580/ug.webp' },
    { name: 'Malawi', code: 'MW', regionId: africa.id, flagSvg: 'https://flagpedia.net/data/flags/w580/mw.webp' },
    { name: 'Zambia', code: 'ZM', regionId: africa.id, flagSvg: 'https://flagpedia.net/data/flags/w580/zm.webp' },
    { name: 'Democratic Republic of Congo', code: 'CD', regionId: africa.id, flagSvg: 'https://flagpedia.net/data/flags/w580/cd.webp' },
    
    // Asia/Pacific
    { name: 'Indonesia', code: 'ID', regionId: asiaPacific.id, flagSvg: 'https://flagpedia.net/data/flags/w580/id.webp' },
    { name: 'Vietnam', code: 'VN', regionId: asiaPacific.id, flagSvg: 'https://flagpedia.net/data/flags/w580/vn.webp' },
    { name: 'India', code: 'IN', regionId: asiaPacific.id, flagSvg: 'https://flagpedia.net/data/flags/w580/in.webp' },
    { name: 'Papua New Guinea', code: 'PG', regionId: asiaPacific.id, flagSvg: 'https://flagpedia.net/data/flags/w580/pg.webp' },
    { name: 'Yemen', code: 'YE', regionId: asiaPacific.id, flagSvg: 'https://flagpedia.net/data/flags/w580/ye.webp' },
    { name: 'Thailand', code: 'TH', regionId: asiaPacific.id, flagSvg: 'https://flagpedia.net/data/flags/w580/th.webp' },
    { name: 'Myanmar', code: 'MM', regionId: asiaPacific.id, flagSvg: 'https://flagpedia.net/data/flags/w580/mm.webp' },
    { name: 'Philippines', code: 'PH', regionId: asiaPacific.id, flagSvg: 'https://flagpedia.net/data/flags/w580/ph.webp' },
    { name: 'China', code: 'CN', regionId: asiaPacific.id, flagSvg: 'https://flagpedia.net/data/flags/w580/cn.webp' },
    
    // Caribbean
    { name: 'Jamaica', code: 'JM', regionId: caribbean.id, flagSvg: 'https://flagpedia.net/data/flags/w580/jm.webp' },
    { name: 'Haiti', code: 'HT', regionId: caribbean.id, flagSvg: 'https://flagpedia.net/data/flags/w580/ht.webp' },
    { name: 'Dominican Republic', code: 'DO', regionId: caribbean.id, flagSvg: 'https://flagpedia.net/data/flags/w580/do.webp' },
    { name: 'Puerto Rico', code: 'PR', regionId: caribbean.id, flagSvg: 'https://flagpedia.net/data/flags/w580/pr.webp' },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country
    });
  }

  console.log('✅ Seeded regions and countries successfully!');
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
