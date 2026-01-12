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

// Helper function to parse semicolon-separated values
const parseSemicolonList = (value: string | undefined): string[] => {
  if (!value || value.trim() === '') return [];
  return value.split(';').map(item => item.trim()).filter(item => item !== '');
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

// Helper function to get or create country by name
const getOrCreateCountry = async (name: string): Promise<string> => {
  // Try to find existing country by name
  const existingCountry = await prisma.country.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive'
      }
    }
  });

  if (existingCountry) {
    return existingCountry.id;
  }

  // Get a default region (we'll use the first one, or you can make this smarter)
  const defaultRegion = await prisma.region.findFirst();
  if (!defaultRegion) {
    throw new Error('No regions found in database. Please create at least one region first.');
  }

  // Create new country
  const country = await prisma.country.create({
    data: {
      code: name.substring(0, 2).toUpperCase(),
      name: name,
      regionId: defaultRegion.id
    }
  });

  return country.id;
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

        if (existingRoaster) {
          results.skipped++;
          results.errors.push(`Row ${i + 1}: Roaster "${roasterName}" already exists`);
          continue;
        }

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

        // Create roaster
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
            country: row['Country'].trim(),
            onlineOnly: onlineOnlyValue !== null ? onlineOnlyValue : false,
            verified: false, // Always set to unverified for imports
            showHours: false, // Default to false for imports
            socialNetworks: Object.keys(socialNetworks).length > 0 ? socialNetworks : null,
            createdById: req.userId,
            updatedById: req.userId
          }
        });

        // Process source countries
        const sourceCountries = parseSemicolonList(row['Source Countries']);
        for (const countryName of sourceCountries) {
          try {
            const countryId = await getOrCreateCountry(countryName);
            await prisma.roasterSourceCountry.create({
              data: {
                roasterId: roaster.id,
                countryId: countryId
              }
            });
          } catch (countryError) {
            console.error(`Error adding source country "${countryName}" for roaster "${roasterName}":`, countryError);
          }
        }

        // Process specialties
        const specialties = parseSemicolonList(row['Specialties']);
        for (const specialtyName of specialties) {
          try {
            const specialtyId = await getOrCreateSpecialty(specialtyName);
            await prisma.roasterSpecialty.create({
              data: {
                roasterId: roaster.id,
                specialtyId: specialtyId
              }
            });
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

            await prisma.roasterPerson.create({
              data: {
                roasterId: roaster.id,
                firstName: row['First Name'].trim(),
                lastName: row['Last Name'] || null,
                title: row['Title'] || null,
                email: row['Email'] || null, // Using Email column for person email
                mobile: row['Mobile'] || null,
                linkedinUrl: row['LinkedIn URL'] || null, // Person's LinkedIn
                instagramUrl: row['Instagram URL'] || null, // Person's Instagram
                bio: row['Bio'] || null,
                roles: rolesList.length > 0 ? rolesList : ['Owner'], // Default to Owner if no roles specified
                isPrimary: isPrimary,
                createdById: req.userId,
                updatedById: req.userId
              }
            });
          } catch (personError: any) {
            // Log but don't fail the import if person creation fails
            console.error(`Error adding person for roaster "${roasterName}":`, personError);
            results.errors.push(`Row ${i + 1}: Roaster created but person data failed: ${personError.message}`);
          }
        }

        // Create audit log
        try {
          await createAuditLog({
            action: 'CREATE',
            entityType: 'roaster',
            entityId: roaster.id,
            entityName: roaster.name,
            userId: req.userId,
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req)
          });
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError);
        }

        results.created++;

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
