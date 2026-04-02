import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { prisma } from '../lib/prisma';
import { createAuditLog, getClientIP, getUserAgent } from '../lib/auditService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Admin authentication middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper function to parse list values (semicolon or comma separated)
const parseSemicolonList = (value: string | undefined): string[] => {
  if (!value || value.trim() === '') return [];

  const stripWrappingQuotes = (input: string): string => {
    return input.replace(/^("+)|("+)$/g, '').trim();
  };

  const normalized = stripWrappingQuotes(value.trim());
  const delimiter = normalized.includes(';') ? ';' : (normalized.includes(',') ? ',' : null);
  const parts = delimiter ? normalized.split(delimiter) : [normalized];

  return parts
    .map(item => stripWrappingQuotes(item))
    .map(item => item.trim())
    .filter(item => item !== '');
};

// Helper function to parse Yes/No values
const parseYesNo = (value: string | undefined): boolean | null => {
  if (!value || value.trim() === '') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'yes') return true;
  if (normalized === 'no') return false;
  return null;
};

// Helper function to get or create specialty by name
const getOrCreateSpecialty = async (name: string, language: string = 'en'): Promise<string> => {
  // Try to find existing specialty with this translation
  const existingTranslation = await prisma.specialtyTranslation.findFirst({
    where: {
      name: name,
      language: language
    },
    include: {
      specialty: true
    }
  });

  if (existingTranslation) {
    return existingTranslation.specialtyId;
  }

  // Create new specialty with translation
  const specialty = await prisma.specialty.create({
    data: {
      translations: {
        create: {
          language: language,
          name: name
        }
      }
    }
  });

  return specialty.id;
};

// Normalize common country name variants to canonical names.
const normalizeCountryName = (name: string): string => {
  const trimmed = name.trim();
  const normalized = trimmed.toLowerCase();
  const aliases: Record<string, string> = {
    'u.s.a.': 'United States of America',
    'u.s.a': 'United States of America',
    'usa': 'United States of America',
    'u.s.': 'United States of America',
    'u.s': 'United States of America',
    'united states': 'United States of America',
    'united states of america': 'United States of America',
    'uk': 'United Kingdom',
    'u.k.': 'United Kingdom',
    'united kingdom': 'United Kingdom',
    'south korea': 'Korea, South',
    'north korea': 'Korea, North',
    'dr congo': 'Democratic Republic of Congo',
    'drc': 'Democratic Republic of Congo',
    'democratic republic of the congo': 'Democratic Republic of Congo',
    'republic of the congo': 'Congo',
    'czech republic': 'Czechia'
  };

  return aliases[normalized] || trimmed;
};

// Helper function to resolve country by name (no auto-create)
const findCountryIdByName = async (name: string): Promise<string | null> => {
  const normalizedName = normalizeCountryName(name);
  const existingCountry = await prisma.country.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: 'insensitive'
      }
    }
  });

  return existingCountry ? existingCountry.id : null;
};

// Helper function to resolve origin country by name (no auto-create)
const findOriginCountryIdByName = async (name: string): Promise<string | null> => {
  const normalizedName = normalizeCountryName(name);
  const existingCountry = await prisma.country.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: 'insensitive'
      },
      isOrigin: true
    }
  });

  return existingCountry ? existingCountry.id : null;
};

/**
 * @swagger
 * /api/roasters/import/csv:
 *   post:
 *     summary: Import roasters from CSV file (Admin only)
 *     tags: [Roasters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import completed successfully
 *       400:
 *         description: Invalid CSV file or data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not an admin
 */
router.post('/import/csv', requireAdmin, upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    
    // Parse CSV
    let records;
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true // Handle UTF-8 BOM if present
      });
    } catch (parseError) {
      console.error('CSV parse error:', parseError);
      return res.status(400).json({ error: 'Invalid CSV format' });
    }

    const results = {
      total: records.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const row: any = records[i];
      
      try {
        // Skip if roaster name is missing
        if (!row['Roaster Name'] || row['Roaster Name'].trim() === '') {
          results.skipped++;
          results.errors.push(`Row ${i + 1}: Missing roaster name`);
          continue;
        }

        // Skip if country is missing
        if (!row['Country'] || row['Country'].trim() === '') {
          results.skipped++;
          results.errors.push(`Row ${i + 1}: Missing country`);
          continue;
        }

        const roasterName = row['Roaster Name'].trim();

        // Check if roaster already exists
        const existingRoaster = await prisma.roaster.findUnique({
          where: { name: roasterName }
        });

        // Parse social networks
        const socialNetworks: any = {};
        if (row['Instagram URL']) socialNetworks.instagram = row['Instagram URL'];
        if (row['TikTok URL']) socialNetworks.tiktok = row['TikTok URL'];
        if (row['Facebook URL']) socialNetworks.facebook = row['Facebook URL'];
        if (row['LinkedIn URL']) socialNetworks.linkedin = row['LinkedIn URL'];
        if (row['YouTube URL']) socialNetworks.youtube = row['YouTube URL'];
        if (row['Threads URL']) socialNetworks.threads = row['Threads URL'];
        if (row['Pinterest URL']) socialNetworks.pinterest = row['Pinterest URL'];
        if (row['BlueSky URL']) socialNetworks.bluesky = row['BlueSky URL'];
        if (row['X URL']) socialNetworks.x = row['X URL'];
        if (row['Reddit URL']) socialNetworks.reddit = row['Reddit URL'];

        // Parse founded year
        let founded: number | undefined;
        if (row['Founded'] && row['Founded'].trim() !== '') {
          founded = parseInt(row['Founded'], 10);
          if (isNaN(founded)) {
            founded = undefined;
          }
        }

        // Parse online only
        const onlineOnlyValue = parseYesNo(row['Online Only']);

        const roasterCountry = normalizeCountryName(row['Country']);
        const roasterCountryId = await findCountryIdByName(roasterCountry);
        if (!roasterCountryId) {
          results.skipped++;
          results.errors.push(`Row ${i + 1}: Unknown country "${roasterCountry}"`);
          continue;
        }

        let roasterId: string;
        let didUpdate = false;

        if (existingRoaster) {
          if (existingRoaster.verified) {
            results.skipped++;
            results.errors.push(`Row ${i + 1}: Roaster "${roasterName}" already exists (verified)`);
            continue;
          }

          const updateData: any = {};
          const setIfMissing = (key: keyof typeof existingRoaster, value: any) => {
            const current = existingRoaster[key] as any;
            if ((current === null || current === '') && value !== null && value !== undefined && value !== '') {
              updateData[key] = value;
            }
          };

          setIfMissing('description', row['Description']?.trim() || null);
          setIfMissing('website', row['Web URL']?.trim() || null);
          setIfMissing('email', row['Email']?.trim() || null);
          setIfMissing('phone', row['Phone']?.trim() || null);
          setIfMissing('founded', founded ?? null);
          setIfMissing('address', row['Address'] || null);
          setIfMissing('city', row['City'] || null);
          setIfMissing('state', row['Province'] || null);
          setIfMissing('zipCode', row['Postal Code'] || null);

          const existingSocial = (existingRoaster.socialNetworks as any) || {};
          const mergedSocial: any = { ...existingSocial };
          let socialChanged = false;
          for (const [key, value] of Object.entries(socialNetworks)) {
            if (value && !mergedSocial[key]) {
              mergedSocial[key] = value;
              socialChanged = true;
            }
          }
          if (socialChanged) {
            updateData.socialNetworks = mergedSocial;
          }

          if (Object.keys(updateData).length > 0) {
            updateData.updatedById = req.userId;
            await prisma.roaster.update({
              where: { id: existingRoaster.id },
              data: updateData
            });
            didUpdate = true;
          }

          roasterId = existingRoaster.id;
        } else {
          const roaster = await prisma.roaster.create({
            data: {
              name: roasterName,
              description: row['Description']?.trim() || null,
              website: row['Web URL']?.trim() || null,
              email: row['Email']?.trim() || null,
              phone: row['Phone']?.trim() || null,
              founded: founded,
              address: row['Address'] || null,
              city: row['City'] || null,
              state: row['Province'] || null,
              zipCode: row['Postal Code'] || null,
              country: roasterCountry,
              onlineOnly: onlineOnlyValue !== null ? onlineOnlyValue : false,
              verified: false, // Always set to unverified for imports
              showHours: false, // Default to false for imports
              socialNetworks: Object.keys(socialNetworks).length > 0 ? socialNetworks : null,
              createdById: req.userId,
              updatedById: req.userId
            }
          });

          roasterId = roaster.id;
        }

        // Process source countries
        const sourceCountries = parseSemicolonList(row['Source Countries']);
        for (const rawCountryName of sourceCountries) {
          const countryName = normalizeCountryName(rawCountryName);
          const countryId = await findOriginCountryIdByName(countryName);
          if (!countryId) {
            results.errors.push(`Row ${i + 1}: Unknown source country "${countryName}"`);
            continue;
          }

          try {
            const existingLink = await prisma.roasterSourceCountry.findUnique({
              where: {
                roasterId_countryId: {
                  roasterId: roasterId,
                  countryId: countryId
                }
              }
            });

            if (!existingLink) {
              await prisma.roasterSourceCountry.create({
                data: {
                  roasterId: roasterId,
                  countryId: countryId
                }
              });
              didUpdate = true;
            }
          } catch (countryError) {
            console.error(`Error adding source country "${countryName}" for roaster "${roasterName}":`, countryError);
          }
        }

        // Process specialties
        const specialties = parseSemicolonList(row['Specialties']);
        for (const specialtyName of specialties) {
          try {
            const specialtyId = await getOrCreateSpecialty(specialtyName);
            const existingSpecialty = await prisma.roasterSpecialty.findUnique({
              where: {
                roasterId_specialtyId: {
                  roasterId: roasterId,
                  specialtyId: specialtyId
                }
              }
            });

            if (!existingSpecialty) {
              await prisma.roasterSpecialty.create({
                data: {
                  roasterId: roasterId,
                  specialtyId: specialtyId
                }
              });
              didUpdate = true;
            }
          } catch (specialtyError) {
            console.error(`Error adding specialty "${specialtyName}" for roaster "${roasterName}":`, specialtyError);
          }
        }

        // Process roaster person if data is provided
        if (row['First Name'] && row['First Name'].trim() !== '') {
          try {
            // Parse person roles
            const rolesList = parseSemicolonList(row['Role']);
            const isPrimary = parseYesNo(row['Primary']) === true;

            const personEmail = row['Contact Email'] || row['Email'] || null;
            const personFirstName = row['First Name'].trim();
            const personLastName = row['Last Name'] || null;
            const personTitle = row['Title'] || null;
            const personMobile = row['Contact Mobile'] || row['Mobile'] || null;
            const personLinkedIn = row['LinkedIn URL'] || null;
            const personInstagram = row['Instagram URL'] || null;
            const personBio = row['Bio'] || null;
            const personRoles = rolesList.length > 0 ? rolesList : ['Owner'];

            let existingPerson = null;
            if (personEmail) {
              existingPerson = await prisma.roasterPerson.findUnique({
                where: {
                  roasterId_email: {
                    roasterId: roasterId,
                    email: personEmail
                  }
                }
              });
            } else {
              existingPerson = await prisma.roasterPerson.findFirst({
                where: {
                  roasterId: roasterId,
                  firstName: { equals: personFirstName, mode: 'insensitive' },
                  ...(personLastName ? { lastName: { equals: personLastName, mode: 'insensitive' } } : {}),
                  ...(personTitle ? { title: { equals: personTitle, mode: 'insensitive' } } : {})
                }
              });
            }

            if (existingPerson) {
              const personUpdate: any = {};
              const setPersonIfMissing = (key: keyof typeof existingPerson, value: any) => {
                const current = existingPerson?.[key] as any;
                if ((current === null || current === '') && value !== null && value !== undefined && value !== '') {
                  personUpdate[key] = value;
                }
              };

              setPersonIfMissing('lastName', personLastName);
              setPersonIfMissing('title', personTitle);
              setPersonIfMissing('mobile', personMobile);
              setPersonIfMissing('linkedinUrl', personLinkedIn);
              setPersonIfMissing('instagramUrl', personInstagram);
              setPersonIfMissing('bio', personBio);
              if (!existingPerson.email && personEmail) {
                personUpdate.email = personEmail;
              }

              if (personRoles.length > 0 && (!existingPerson.roles || existingPerson.roles.length === 0)) {
                personUpdate.roles = personRoles;
              }
              if (isPrimary && !existingPerson.isPrimary) {
                personUpdate.isPrimary = true;
              }

              if (Object.keys(personUpdate).length > 0) {
                personUpdate.updatedById = req.userId;
                await prisma.roasterPerson.update({
                  where: { id: existingPerson.id },
                  data: personUpdate
                });
                didUpdate = true;
              }
            } else {
              await prisma.roasterPerson.create({
                data: {
                  roasterId: roasterId,
                  firstName: personFirstName,
                  lastName: personLastName,
                  title: personTitle,
                  // Prefer explicit contact fields, fall back to legacy columns for compatibility.
                  email: personEmail,
                  mobile: personMobile,
                  linkedinUrl: personLinkedIn,
                  instagramUrl: personInstagram,
                  bio: personBio,
                  roles: personRoles,
                  isPrimary: isPrimary,
                  createdById: req.userId,
                  updatedById: req.userId
                }
              });
              didUpdate = true;
            }
          } catch (personError: any) {
            // Log but don't fail the import if person creation fails
            console.error(`Error adding person for roaster "${roasterName}":`, personError);
            results.errors.push(`Row ${i + 1}: Person data failed: ${personError.message}`);
          }
        }

        // Create audit log
        if (!existingRoaster || didUpdate) {
          try {
            await createAuditLog({
              action: existingRoaster ? 'UPDATE' : 'CREATE',
              entityType: 'roaster',
              entityId: roasterId,
              entityName: roasterName,
              userId: req.userId,
              ipAddress: getClientIP(req),
              userAgent: getUserAgent(req)
            });
          } catch (auditError) {
            console.error('Failed to create audit log:', auditError);
          }
        }

        if (existingRoaster) {
          if (didUpdate) {
            results.updated++;
          } else {
            results.skipped++;
            results.errors.push(`Row ${i + 1}: Roaster "${roasterName}" already exists`);
          }
        } else {
          results.created++;
        }

      } catch (rowError: any) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        results.errors.push(`Row ${i + 1}: ${rowError.message}`);
      }
    }

    res.json({
      message: 'CSV import completed',
      results
    });

  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: 'Internal server error during CSV import' });
  }
});

export default router;
