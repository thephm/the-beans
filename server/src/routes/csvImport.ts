import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { prisma } from '../lib/prisma';
import { createAuditLog, getClientIP, getUserAgent } from '../lib/auditService';
import { generateUniqueRoasterSlug } from '../lib/slug';

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

const parseOptionalYear = (value: string | null): number | undefined => {
  if (!value) return undefined;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1800 || parsed > 2100) {
    return undefined;
  }

  return parsed;
};

const getRowValue = (row: Record<string, any>, ...keys: string[]): string | null => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return null;
};

const getCsvParseErrorMessage = (parseError: unknown): string => {
  if (!(parseError instanceof Error)) {
    return 'Invalid CSV format';
  }

  const errorWithContext = parseError as Error & {
    code?: string;
    lines?: number;
    records?: number;
    column?: string | number;
  };

  const details: string[] = [];

  if (typeof errorWithContext.lines === 'number') {
    details.push(`line ${errorWithContext.lines}`);
  }

  if (typeof errorWithContext.records === 'number') {
    details.push(`record ${errorWithContext.records + 1}`);
  }

  if (typeof errorWithContext.column === 'string' || typeof errorWithContext.column === 'number') {
    details.push(`column ${errorWithContext.column}`);
  }

  const locationSuffix = details.length > 0 ? ` (${details.join(', ')})` : '';

  return `Invalid CSV format: ${parseError.message}${locationSuffix}`;
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

const normalizeUrl = (value: string | undefined | null): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  return trimmed
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
};

const hasSecondaryIdentifierMatch = (
  roaster: any,
  website: string | null,
  instagram: string | null
): boolean => {
  if (!website && !instagram) {
    return false;
  }

  const roasterWebsite = normalizeUrl(roaster.website || null);
  const roasterInstagram = normalizeUrl((roaster.socialNetworks as any)?.instagram || null);

  if (website && roasterWebsite && website === roasterWebsite) {
    return true;
  }

  if (instagram && roasterInstagram && instagram === roasterInstagram) {
    return true;
  }

  return false;
};

const normalizeNameTokens = (value: string): string[] => {
  const cleaned = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return [];

  const tokens = cleaned.split(' ');
  const removableSuffixes = new Set([
    'cafe',
    'cafes',
    'coffee',
    'co',
    'roaster',
    'roasters',
    'roastery',
    'roasting',
    'torrefacteur',
    'torrefacteurs',
    'torrefaction',
    'brulerie',
    'bruleries',
    'inc',
    'llc',
    'ltd'
  ]);

  while (tokens.length > 1 && removableSuffixes.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  return tokens;
};

const stripTrailingNumbers = (value: string): string => {
  return value.replace(/\s*\d+$/, '').trim();
};

const isNameVariantMatch = (existingName: string, importedName: string): boolean => {
  const existingTokens = normalizeNameTokens(existingName);
  const importedTokens = normalizeNameTokens(importedName);

  if (existingTokens.length === 0 || importedTokens.length === 0) {
    return false;
  }

  if (existingTokens[0] !== importedTokens[0]) {
    return false;
  }

  const existingNormalized = existingTokens.join(' ');
  const importedNormalized = importedTokens.join(' ');
  const existingWithoutTrailingNumbers = stripTrailingNumbers(existingNormalized);
  const importedWithoutTrailingNumbers = stripTrailingNumbers(importedNormalized);

  return (
    existingNormalized === importedNormalized ||
    existingWithoutTrailingNumbers === importedWithoutTrailingNumbers ||
    existingNormalized.startsWith(`${importedNormalized} `) ||
    importedNormalized.startsWith(`${existingNormalized} `) ||
    existingWithoutTrailingNumbers.startsWith(`${importedWithoutTrailingNumbers} `) ||
    importedWithoutTrailingNumbers.startsWith(`${existingWithoutTrailingNumbers} `)
  );
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
      return res.status(400).json({ error: getCsvParseErrorMessage(parseError) });
    }

    const results = {
      total: records.length,
      created: 0,
      updated: 0,
      skipped: 0,
      warnings: [] as string[],
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

        const importedWebsite = getRowValue(row, 'Web URL');
        const importedInstagram = getRowValue(row, 'Instagram URL');
        const importedEmail = getRowValue(row, 'Email', 'email address', 'Email Address');
        const importedPhone = getRowValue(row, 'Phone', 'Phone Number');
        const importedAddress = getRowValue(row, 'Address');
        const importedCity = getRowValue(row, 'City');
        const importedState = getRowValue(row, 'Province', 'State');
        const importedZipCode = getRowValue(row, 'Postal Code', 'Zip Code', 'ZIP Code');
        const importedDescription = getRowValue(row, 'Description');
        const normalizedImportedWebsite = normalizeUrl(importedWebsite);
        const normalizedImportedInstagram = normalizeUrl(importedInstagram);

        const sameNameRoasters = await prisma.roaster.findMany({
          where: {
            name: {
              equals: roasterName,
              mode: 'insensitive'
            }
          }
        });

        let existingRoaster = sameNameRoasters.find((candidate) => {
          return hasSecondaryIdentifierMatch(candidate, normalizedImportedWebsite, normalizedImportedInstagram);
        }) || null;
        const hasSecondaryIdentifiers = Boolean(normalizedImportedWebsite || normalizedImportedInstagram);

        let matchedBySecondaryVariantName = false;
        let matchSourceLabel = 'Web URL/Instagram URL';

        if (!existingRoaster && hasSecondaryIdentifiers) {
          const secondaryCandidates = await prisma.roaster.findMany();

          const urlMatchedCandidates = secondaryCandidates.filter((candidate) => {
            return hasSecondaryIdentifierMatch(candidate, normalizedImportedWebsite, normalizedImportedInstagram);
          });

          const variantNameCandidate = urlMatchedCandidates.find((candidate) => {
            return isNameVariantMatch(candidate.name, roasterName);
          });

          if (variantNameCandidate) {
            existingRoaster = variantNameCandidate;
            matchedBySecondaryVariantName = true;

            const matchedByWebsite = normalizedImportedWebsite
              && normalizeUrl(variantNameCandidate.website || null) === normalizedImportedWebsite;
            matchSourceLabel = matchedByWebsite ? 'Web URL' : 'Instagram URL';
          } else if (urlMatchedCandidates.length > 0) {
            results.skipped++;
            results.errors.push(
              `Row ${i + 1}: URL matched an existing roaster but name "${roasterName}" is not a close variant`
            );
            continue;
          }
        }

        if (!existingRoaster && !hasSecondaryIdentifiers && sameNameRoasters.length > 0) {
          const normalizedCountry = normalizeCountryName(row['Country']);
          existingRoaster = sameNameRoasters.find((candidate) => {
            return normalizeCountryName(candidate.country).toLowerCase() === normalizedCountry.toLowerCase();
          }) || null;

          if (!existingRoaster) {
            results.skipped++;
            results.errors.push(
              `Row ${i + 1}: Roaster "${roasterName}" matched by name but country did not match and no Web URL/Instagram URL provided`
            );
            continue;
          }
        }

        if (sameNameRoasters.length > 0 && !existingRoaster) {
          results.skipped++;
          results.errors.push(
            `Row ${i + 1}: Roaster "${roasterName}" exists by name but does not match Web URL/Instagram URL`
          );
          continue;
        }

        // Parse social networks
        const socialNetworks: any = {};
        if (getRowValue(row, 'Instagram URL')) socialNetworks.instagram = getRowValue(row, 'Instagram URL');
        if (getRowValue(row, 'TikTok URL')) socialNetworks.tiktok = getRowValue(row, 'TikTok URL');
        if (getRowValue(row, 'Facebook URL')) socialNetworks.facebook = getRowValue(row, 'Facebook URL');
        if (getRowValue(row, 'LinkedIn URL')) socialNetworks.linkedin = getRowValue(row, 'LinkedIn URL');
        if (getRowValue(row, 'YouTube URL')) socialNetworks.youtube = getRowValue(row, 'YouTube URL');
        if (getRowValue(row, 'Threads URL')) socialNetworks.threads = getRowValue(row, 'Threads URL');
        if (getRowValue(row, 'Pinterest URL')) socialNetworks.pinterest = getRowValue(row, 'Pinterest URL');
        if (getRowValue(row, 'BlueSky URL')) socialNetworks.bluesky = getRowValue(row, 'BlueSky URL');
        if (getRowValue(row, 'X URL')) socialNetworks.x = getRowValue(row, 'X URL');
        if (getRowValue(row, 'Reddit URL')) socialNetworks.reddit = getRowValue(row, 'Reddit URL');

        // Parse founded/closed years
        const founded = parseOptionalYear(getRowValue(row, 'Founded'));
        const closedYear = parseOptionalYear(getRowValue(row, 'Closed Year', 'Closed year'));

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
          const setIfChanged = (
            key: keyof typeof existingRoaster,
            value: any,
            normalize?: (input: any) => any
          ) => {
            const current = existingRoaster[key] as any;
            if (value === null || value === undefined || value === '') {
              return;
            }

            const currentComparable = normalize ? normalize(current) : current;
            const valueComparable = normalize ? normalize(value) : value;

            if (currentComparable !== valueComparable) {
              updateData[key] = value;
            }
          };

          setIfChanged('description', importedDescription);
          setIfChanged('website', importedWebsite, normalizeUrl);
          setIfChanged('email', importedEmail, (value) => typeof value === 'string' ? value.trim().toLowerCase() : value);
          setIfChanged('phone', importedPhone, (value) => typeof value === 'string' ? value.trim() : value);
          setIfChanged('founded', founded ?? null);
          setIfChanged('closedYear', closedYear ?? null);
          setIfChanged('address', importedAddress, (value) => typeof value === 'string' ? value.trim() : value);
          setIfChanged('city', importedCity, (value) => typeof value === 'string' ? value.trim() : value);
          setIfChanged('state', importedState, (value) => typeof value === 'string' ? value.trim() : value);
          setIfChanged('zipCode', importedZipCode, (value) => typeof value === 'string' ? value.trim() : value);
          setIfChanged('country', roasterCountry, (value) => typeof value === 'string' ? normalizeCountryName(value).toLowerCase() : value);

          if (closedYear !== undefined && existingRoaster.deprecated !== true) {
            updateData.deprecated = true;
          }

          const existingNameNormalized = existingRoaster.name.trim().toLowerCase();
          const importedNameNormalized = roasterName.toLowerCase();
          if (existingNameNormalized !== importedNameNormalized) {
            updateData.name = roasterName;
          }

          const existingSocial = (existingRoaster.socialNetworks as any) || {};
          const mergedSocial: any = { ...existingSocial };
          let socialChanged = false;
          for (const [key, value] of Object.entries(socialNetworks as Record<string, string>)) {
            const existingValue = mergedSocial[key];
            const normalizedExistingValue = typeof existingValue === 'string' ? normalizeUrl(existingValue) : null;
            if (normalizedExistingValue !== normalizeUrl(value)) {
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

            if (matchedBySecondaryVariantName && updateData.name) {
              results.warnings.push(
                `Row ${i + 1}: Name updated from "${existingRoaster.name}" to "${roasterName}" via ${matchSourceLabel} variant match (slug unchanged)`
              );
            }
          }

          roasterId = existingRoaster.id;
        } else {
          const slug = await generateUniqueRoasterSlug(prisma, roasterName);

          const roaster = await prisma.roaster.create({
            data: {
              name: roasterName,
              slug,
              description: importedDescription,
              website: importedWebsite,
              email: importedEmail,
              phone: importedPhone,
              founded: founded,
              closedYear: closedYear,
              address: importedAddress,
              city: importedCity,
              state: importedState,
              zipCode: importedZipCode,
              country: roasterCountry,
              onlineOnly: onlineOnlyValue !== null ? onlineOnlyValue : false,
              verified: false, // Always set to unverified for imports
              deprecated: closedYear !== undefined,
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

            const personEmail = getRowValue(row, 'Contact Email', 'Email', 'email address', 'Email Address');
            const personFirstName = row['First Name'].trim();
            const personLastName = row['Last Name'] || null;
            const personTitle = row['Title'] || null;
            const personMobile = getRowValue(row, 'Contact Mobile', 'Mobile', 'Phone', 'Phone Number');
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
            results.warnings.push(`Row ${i + 1}: Roaster "${roasterName}" already exists, updated.`);
          } else {
            results.skipped++;
            results.errors.push(`Row ${i + 1}: Roaster "${roasterName}" already exists, no changes.`);
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
