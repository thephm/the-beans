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
        firstName: 'Admin',
        lastName: 'User',
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
  } else {
    // Always update existing admin user with latest password and role
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password: hashedAdminPassword,
        role: 'admin',
      }
    });
  }
  console.log('✅ Created/ensured admin user:', adminUser.email);

  // Seed specialties with translations FIRST (before roasters)
  console.log('☕ Seeding specialties...');
  
  const specialtiesData = [
    {
      en: { name: "Direct Trade", description: "Coffee sourced directly from farmers with transparent pricing and relationships." },
      fr: { name: "Commerce Direct", description: "Café acheté directement auprès des agriculteurs avec des prix et des relations transparents." }
    },
    {
      en: { name: "Organic", description: "Coffee grown without synthetic fertilizers or pesticides, certified organic." },
      fr: { name: "Biologique", description: "Café cultivé sans engrais ni pesticides synthétiques, certifié biologique." }
    },
    {
      en: { name: "Fair Trade", description: "Coffee certified to ensure farmers receive fair prices and ethical working conditions." },
      fr: { name: "Commerce Équitable", description: "Café certifié pour garantir que les agriculteurs reçoivent des prix équitables et des conditions de travail éthiques." }
    },
    {
      en: { name: "Light Roast", description: "Coffee roasted to a lighter color to highlight origin characteristics and acidity." },
      fr: { name: "Torréfaction Claire", description: "Café torréfié à une couleur plus claire pour mettre en valeur les caractéristiques d'origine et l'acidité." }
    },
    {
      en: { name: "Single Origin", description: "Coffee sourced from a single farm, region, or country, showcasing unique flavors." },
      fr: { name: "Origine Unique", description: "Café provenant d'une seule ferme, région ou pays, présentant des saveurs uniques." }
    },
    {
      en: { name: "Microlots", description: "Small, carefully curated lots of coffee with distinctive flavors and limited availability." },
      fr: { name: "Microlots", description: "Petits lots de café soigneusement sélectionnés avec des saveurs distinctives et une disponibilité limitée." }
    },
    {
      en: { name: "Experimental", description: "Coffee roasted or processed with innovative or unconventional methods." },
      fr: { name: "Expérimental", description: "Café torréfié ou traité avec des méthodes innovantes ou non conventionnelles." }
    },
    {
      en: { name: "Espresso", description: "Coffee specifically roasted and blended to perform well as espresso." },
      fr: { name: "Espresso", description: "Café spécialement torréfié et mélangé pour bien fonctionner en espresso." }
    },
    {
      en: { name: "Omni Roast", description: "Coffee roasted to perform well across multiple brewing methods, from filter to espresso." },
      fr: { name: "Torréfaction Omni", description: "Café torréfié pour bien fonctionner avec plusieurs méthodes d'infusion, du filtre à l'espresso." }
    },
    {
      en: { name: "Awards", description: "Coffee that has received recognized awards or high scores in competitions." },
      fr: { name: "Récompenses", description: "Café qui a reçu des prix reconnus ou des scores élevés dans des compétitions." }
    },
    {
      en: { name: "Subscription", description: "Coffee available via recurring subscription services for regular delivery." },
      fr: { name: "Abonnement", description: "Café disponible via des services d'abonnement récurrents pour une livraison régulière." }
    },
    {
      en: { name: "Carbon Neutral", description: "Coffee produced with practices that minimize or offset carbon emissions." },
      fr: { name: "Neutre en Carbone", description: "Café produit avec des pratiques qui minimisent ou compensent les émissions de carbone." }
    },
    {
      en: { name: "Decaf", description: "Coffee with most caffeine removed while preserving flavor." },
      fr: { name: "Décaféiné", description: "Café avec la plupart de la caféine enlevée tout en préservant la saveur." }
    },
    {
      en: { name: "Education", description: "Roasters focused on educating customers about coffee origins, brewing methods, and the craft of roasting." },
      fr: { name: "Éducation", description: "Torréfacteurs axés sur l'éducation des clients sur les origines du café, les méthodes d'infusion et l'art de la torréfaction." }
    },
    {
      en: { name: "Sustainable", description: "Coffee produced with environmentally and socially sustainable farming and business practices." },
      fr: { name: "Durable", description: "Café produit avec des pratiques agricoles et commerciales durables sur le plan environnemental et social." }
    },
    {
      en: { name: "Wholesale", description: "Roasters offering wholesale supply of coffee beans or products to cafes, restaurants, and businesses." },
      fr: { name: "Vente en Gros", description: "Torréfacteurs offrant la fourniture en gros de grains de café ou de produits aux cafés, restaurants et entreprises." }
    }
  ];

  const createdSpecialties: Record<string, any> = {};
  for (const specialtyData of specialtiesData) {
    // Try to find existing specialty by English translation name
    let specialty = await prisma.specialty.findFirst({
      where: {
        translations: {
          some: {
            language: 'en',
            name: specialtyData.en.name
          }
        }
      },
      include: {
        translations: true
      }
    });

    // Create if doesn't exist
    if (!specialty) {
      specialty = await prisma.specialty.create({
        data: {
          deprecated: false,
          translations: {
            create: [
              {
                language: 'en',
                name: specialtyData.en.name,
                description: specialtyData.en.description
              },
              {
                language: 'fr',
                name: specialtyData.fr.name,
                description: specialtyData.fr.description
              }
            ]
          }
        },
        include: {
          translations: true
        }
      });
    }
    
    createdSpecialties[specialtyData.en.name] = specialty;
  }

  console.log('✅ Seeded specialties successfully!');

  // Create test roasters (without specialties array)
  const roaster1 = await prisma.roaster.upsert({
    where: { name: 'Blue Bottle Coffee' },
    update: {},
    create: {
      name: 'Blue Bottle Coffee',
      slug: 'blue-bottle-coffee',
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
      hours: {
        monday: '6:00-18:00',
        tuesday: '6:00-18:00',
        wednesday: '6:00-18:00',
        thursday: '6:00-18:00',
        friday: '6:00-18:00',
        saturday: '7:00-18:00',
        sunday: '7:00-18:00',
      },
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
      slug: 'stumptown-coffee-roasters',
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
      hours: {
        monday: '6:30-19:00',
        tuesday: '6:30-19:00',
        wednesday: '6:30-19:00',
        thursday: '6:30-19:00',
        friday: '6:30-19:00',
        saturday: '7:00-19:00',
        sunday: '7:00-19:00',
      },
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
      slug: 'intelligentsia-coffee',
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
      hours: {
        monday: '6:00-20:00',
        tuesday: '6:00-20:00',
        wednesday: '6:00-20:00',
        thursday: '6:00-20:00',
        friday: '6:00-20:00',
        saturday: '7:00-20:00',
        sunday: '7:00-20:00',
      },
      images: ['https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&h=600&fit=crop'],
      verified: true,
      featured: true,
      rating: 4.6,
      reviewCount: 756,
      ownerId: testUser.id,
    },
  });

  console.log('✅ Created roasters:', [roaster1.name, roaster2.name, roaster3.name]);

  // Link roasters to specialties via RoasterSpecialty relation
  console.log('🔗 Linking roasters to specialties...');
  
  // Blue Bottle: Single Origin
  if (createdSpecialties['Single Origin']) {
    await prisma.roasterSpecialty.upsert({
      where: {
        roasterId_specialtyId: {
          roasterId: roaster1.id,
          specialtyId: createdSpecialties['Single Origin'].id
        }
      },
      update: {},
      create: {
        roasterId: roaster1.id,
        specialtyId: createdSpecialties['Single Origin'].id
      }
    });
  }

  // Stumptown: Direct Trade, Espresso, Single Origin
  if (createdSpecialties['Direct Trade']) {
    await prisma.roasterSpecialty.upsert({
      where: {
        roasterId_specialtyId: {
          roasterId: roaster2.id,
          specialtyId: createdSpecialties['Direct Trade'].id
        }
      },
      update: {},
      create: {
        roasterId: roaster2.id,
        specialtyId: createdSpecialties['Direct Trade'].id
      }
    });
  }
  if (createdSpecialties['Espresso']) {
    await prisma.roasterSpecialty.upsert({
      where: {
        roasterId_specialtyId: {
          roasterId: roaster2.id,
          specialtyId: createdSpecialties['Espresso'].id
        }
      },
      update: {},
      create: {
        roasterId: roaster2.id,
        specialtyId: createdSpecialties['Espresso'].id
      }
    });
  }
  if (createdSpecialties['Single Origin']) {
    await prisma.roasterSpecialty.upsert({
      where: {
        roasterId_specialtyId: {
          roasterId: roaster2.id,
          specialtyId: createdSpecialties['Single Origin'].id
        }
      },
      update: {},
      create: {
        roasterId: roaster2.id,
        specialtyId: createdSpecialties['Single Origin'].id
      }
    });
  }

  // Intelligentsia: Single Origin
  if (createdSpecialties['Single Origin']) {
    await prisma.roasterSpecialty.upsert({
      where: {
        roasterId_specialtyId: {
          roasterId: roaster3.id,
          specialtyId: createdSpecialties['Single Origin'].id
        }
      },
      update: {},
      create: {
        roasterId: roaster3.id,
        specialtyId: createdSpecialties['Single Origin'].id
      }
    });
  }

  console.log('✅ Linked roasters to specialties!');

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

  const northAmerica = await prisma.region.upsert({
    where: { name: 'North America' },
    update: {},
    create: {
      name: 'North America',
      description: 'North American coffee growing regions'
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

    // North America
    { name: 'United States of America', code: 'US', regionId: northAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/us.webp', isOrigin: false },
    { name: 'Canada', code: 'CA', regionId: northAmerica.id, flagSvg: 'https://flagpedia.net/data/flags/w580/ca.webp', isOrigin: false },
    { name: 'Hawaii', code: 'HI', regionId: northAmerica.id, flagSvg: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Flag_of_Hawaii.svg', isOrigin: true },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country
    });
  }

  console.log('📚 Seeding coffee resources...');
  const resourceSeeds = [
    { name: 'Coffee Insurrection', slug: 'coffee-insurrection', url: 'https://www.coffeeinsurrection.com', resourceType: 'website', platform: 'Web', state: 'active', location: 'Italy', notes: 'Supplied discovery source: Reddit. Verify social profiles before publication.' },
    { name: 'r/pourover', slug: 'r-pourover', url: 'https://www.reddit.com/r/pourover/', resourceType: 'community', platform: 'Reddit', state: 'active' },
    { name: 'r/espresso', slug: 'r-espresso', url: 'https://www.reddit.com/r/espresso/', resourceType: 'community', platform: 'Reddit', state: 'active' },
    { name: 'r/coffee_roasters', slug: 'r-coffee-roasters', url: 'https://www.reddit.com/r/coffee_roasters/', resourceType: 'community', platform: 'Reddit', state: 'active' },
    { name: 'Espresso Aficionado Discord', slug: 'espresso-aficionado-discord', url: 'https://discord.com/invite/mysterycoffeeleague', resourceType: 'community', platform: 'Discord', state: 'active' },
    { name: 'Google Maps', slug: 'google-maps', url: 'https://maps.google.com/', resourceType: 'discovery_tool', platform: 'Web', state: 'active', notes: 'Useful for geographic roaster discovery. Do not publish subjective comparisons.' },
    { name: 'RoastGuide', slug: 'roastguide', url: 'https://apps.apple.com/gb/app/roastguide/id1454418262', resourceType: 'app', platform: 'Apple App Store', state: 'active' },
    { name: 'r/coffeerotation', slug: 'r-coffeerotation', url: 'https://www.reddit.com/r/coffeerotation/', resourceType: 'community', platform: 'Reddit', state: 'active', notes: 'Supplied community creation date: 2024-10-31.' },
    { name: 'Roastful', slug: 'roastful', url: 'https://www.roastful.com/', resourceType: 'website', platform: 'Web', state: 'active', email: 'hello@roastful.com' },
    { name: 'LoffeeLabs', slug: 'loffeelabs', url: 'https://www.loffeelabs.com/roasters-registry/', resourceType: 'directory', platform: 'Web', state: 'active', location: 'Oahu, Hawaii, USA', email: 'loffeelabs@gmail.com', socialNetworks: { instagram: 'https://www.instagram.com/loffeelabs/', youtube: 'https://www.youtube.com/@LoffeeLabs' }, notes: 'Supplied site text says the organization is located on Oahu and holds meetups. Verify before publishing.' },
    { name: 'CoffeeDrippd', slug: 'coffeedrippd', url: 'https://coffeedrippd.com/', resourceType: 'discovery_tool', platform: 'Web', state: 'active', location: 'Reykjavik, Iceland', email: 'support@coffeedrippd.com', socialNetworks: { linkedin: 'https://www.linkedin.com/company/coffeedrippd/about/' }, notes: 'User tested a 100 km search and observed 12 roasters in NY. Keep private until dated and contextualized.' },
    { name: 'CoffeeRoast', slug: 'coffeeroast', url: 'https://coffeeroast.com/', resourceType: 'directory', platform: 'Web', state: 'active', notes: 'Google authentication, advertising, and registration observations remain private research notes.' },
    { name: 'Coffee Review', slug: 'coffee-review', url: 'https://www.coffeereview.com', resourceType: 'publication', platform: 'Web', state: 'active', location: 'Berkeley, CA, USA' },
    { name: 'World Coffee Research', slug: 'world-coffee-research', url: 'https://worldcoffeeresearch.org', resourceType: 'research', platform: 'Web', state: 'active' },
    { name: 'Sensory Lexicon', slug: 'world-coffee-research-sensory-lexicon', url: 'https://worldcoffeeresearch.org/resources/sensory-lexicon', resourceType: 'reference', platform: 'Web', state: 'active', parentSlug: 'world-coffee-research' },
    { name: 'The Fair Trade Scandal', slug: 'the-fair-trade-scandal', url: 'https://www.ohioswallow.com/9780821420928/the-fair-trade-scandal/', resourceType: 'book', platform: 'Web', state: 'active' },
    { name: 'Organic Coffee', slug: 'organic-coffee', url: 'https://www.ohioswallow.com/9780896802476/organic-coffee', resourceType: 'book', platform: 'Web', state: 'active' },
    { name: 'Holy Grounds - The Surprising Connection between Coffee and Faith', slug: 'holy-grounds', url: 'https://www.amazon.com/Holy-Grounds-Surprising-Connection-between/dp/1506448232', resourceType: 'book', platform: 'Web', state: 'active' },
    { name: 'Coffee Roaster - Local - Coffee Roastery Near You. Find Your Local Coffee Roaster', slug: 'coffee-roaster-local', url: 'https://www.thecoffeemaven.com/coffee-roaster-local', resourceType: 'article', platform: 'Web', state: 'active' },
    { name: '10 Steps to Coffee', slug: '10-steps-to-coffee', url: 'https://www.colonialcoffee.ca/10steps', resourceType: 'article', platform: 'Web', state: 'active', description: 'A practical guide that walks coffee drinkers through the key steps from choosing and buying beans to brewing a better cup, with straightforward advice for understanding coffee and improving your results.' },
    { name: 'What is Coffee?', slug: 'whatiscoffee', url: 'https://www.colonialcoffee.ca/whatiscoffee', resourceType: 'article', platform: 'Web', state: 'active' },
    { name: 'Coffee around the world', slug: 'coffee-around-the-world', url: 'https://www.colonialcoffee.ca/coffee-around-the-world', resourceType: 'article', platform: 'Web', state: 'active' },
    { name: 'INeedCoffee.com', slug: 'ineedcoffee', url: 'https://ineedcoffee.com/section/', resourceType: 'publication', platform: 'Web', state: 'archived' },
    { name: 'Alma Coffee', slug: 'alma-coffee-youtube', url: 'https://www.youtube.com/@myalmacoffee', resourceType: 'website', platform: 'YouTube', state: 'active', description: 'Provides behind-the-scenes videos and educational content about coffee from farm to cup, including coffee farming, processing methods, roasting, brewing, and the people and practices involved in producing coffee.' },
    { name: 'What Does Coffee Processing Look Like? | Video Walkthrough', slug: 'what-does-coffee-processing-look-like', url: 'https://www.youtube.com/watch?v=Ux98IXer_UE', resourceType: 'video', platform: 'YouTube', state: 'active', parentSlug: 'alma-coffee-youtube' },
    { name: "Maple Creek Coffee's Roasting Blog", slug: 'maple-creek-coffee-roasting-blog', url: 'https://maplecreekcoffee.ca/blog', resourceType: 'blog', platform: 'Web', state: 'active', publisherOrganizationName: 'Maple Creek Coffee' },
    { name: 'Commonly Coffee Blog', slug: 'commonly-coffee', url: 'https://commonlycoffee.com', resourceType: 'blog', platform: 'Web', state: 'active' },
    { name: 'Economics of coffee', slug: 'wikipedia-economics-of-coffee', url: 'https://en.wikipedia.org/wiki/Economics_of_coffee', resourceType: 'reference', platform: 'Web', state: 'active' }
  ] as const;

  const resourceIds = new Map<string, string>();
  await prisma.resource.deleteMany({ where: { slug: '69-top-coffee-producing-countries' } });
  for (const seed of resourceSeeds) {
    const { parentSlug, state: seedState, ...data } = seed as typeof seed & { parentSlug?: string; state?: string };
    const parentResourceId = parentSlug ? resourceIds.get(parentSlug) : undefined;
    const resourceData = { ...data, state: seedState || 'active', parentResourceId };
    const resource = await prisma.resource.upsert({
      where: { slug: seed.slug },
      update: resourceData,
      create: resourceData
    });
    resourceIds.set(seed.slug, resource.id);
  }

  const peopleSeeds = [
    ['coffee-insurrection', 'Tanya Nanetti', 'tanya-nanetti', 'creator'],
    ['coffee-insurrection', 'Endri Nonaj', 'endri-nonaj', 'creator'],
    ['r-coffeerotation', 'DannyyDo', 'dannydo', 'contributor'],
    ['coffeeroast', 'Theo C.', 'theo-c', 'creator'],
    ['coffee-review', 'Kenneth Davids', 'kenneth-davids', 'founder'],
    ['coffee-review', 'Ron Walters', 'ron-walters', 'founder'],
    ['coffee-review', 'Kim Westerman', 'kim-westerman', 'contact'],
    ['ineedcoffee', '@digitalcolony', 'digitalcolony', 'maintainer'],
    ['the-fair-trade-scandal', 'Noonco Sylla', 'noonco-sylla', 'author'],
    ['organic-coffee', 'Maria Elena Martinez-Torres', 'maria-elena-martinez-torres', 'author'],
    ['holy-grounds', 'Tim Schenck', 'tim-schenck', 'author']
  ] as const;
  for (const [resourceSlug, name, personSlug, role] of peopleSeeds) {
    const resourceId = resourceIds.get(resourceSlug);
    if (!resourceId) continue;
    const email = personSlug === 'kim-westerman' ? 'Kim@CoffeeReview.com' : undefined;
    const person = await prisma.person.upsert({ where: { slug: personSlug }, update: { name, email }, create: { name, slug: personSlug, email } });
    await prisma.resourcePerson.upsert({
      where: { resourceId_personId_role: { resourceId, personId: person.id, role } },
      update: {},
      create: { resourceId, personId: person.id, role }
    });
  }

  const observations = [
    ['roastguide', 'roaster_count', 487, new Date('2024-01-01'), 'Reported/supplied as the number of roasters worldwide as of 2024.'],
    ['r-coffeerotation', 'visitor_count', 1100, null, 'User supplied weekly visitor figure; verify date before publication.']
  ] as const;
  for (const [resourceSlug, observationType, value, observedAt, notes] of observations) {
    const resourceId = resourceIds.get(resourceSlug);
    if (!resourceId) continue;
    const existing = await prisma.resourceObservation.findFirst({ where: { resourceId, observationType, value } });
    if (!existing) await prisma.resourceObservation.create({ data: { resourceId, observationType, value, observedAt, notes } });
  }

  console.log('✅ Seeded regions and countries successfully!');
  console.log('✅ Seeded coffee resources successfully!');
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
