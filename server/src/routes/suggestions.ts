import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { createAuditLog, getClientIP, getUserAgent } from '../lib/auditService';
import { requireAuth } from '../middleware/requireAuth';
import { sendSubmissionThankYouEmail, sendAdminSubmissionNotification } from '../lib/emailService';

const router = express.Router();

// Admin only middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    
    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     RoasterSuggestion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         roasterName:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         country:
 *           type: string
 *         website:
 *           type: string
 *         submitterRole:
 *           type: string
 *           enum: [customer, rando, scout, owner, admin, marketing]
 *         submitterFirstName:
 *           type: string
 *         submitterLastName:
 *           type: string
 *         submitterEmail:
 *           type: string
 *         status:
 *           type: string
 *           enum: [new, approved, rejected, done]
 *         adminNotes:
 *           type: string
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Validation rules for creating a suggestion
const createSuggestionValidation = [
  body('roasterName').trim().notEmpty().withMessage('Roaster name is required'),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('website').trim().isURL().withMessage('Valid website URL is required'),
  body('submitterRole')
    .trim()
    .isIn(['customer', 'rando', 'scout', 'owner', 'admin', 'marketing'])
    .withMessage('Valid role is required'),
  body('submitterFirstName').optional().trim(),
  body('submitterLastName').optional().trim(),
  body('submitterEmail').optional().trim().custom((value, { req }) => {
    // Email is required for all roles except 'rando'
    if (req.body.submitterRole !== 'rando' && !value) {
      throw new Error('Email is required for this role');
    }
    // If email is provided, validate it
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error('Valid email is required');
    }
    return true;
  }),
  body('submitterPhone').optional().trim(),
];

/**
 * @swagger
 * /api/suggestions:
 *   post:
 *     summary: Submit a new roaster suggestion
 *     tags: [Suggestions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roasterName
 *               - website
 *               - submitterRole
 *             properties:
 *               roasterName:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               website:
 *                 type: string
 *               submitterRole:
 *                 type: string
 *                 enum: [customer, rando, scout, owner, admin, marketing]
 *               submitterFirstName:
 *                 type: string
 *               submitterLastName:
 *                 type: string
 *               submitterEmail:
 *                 type: string
 *               submitterPhone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Suggestion created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoasterSuggestion'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', createSuggestionValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      roasterName,
      city,
      state,
      country,
      website,
      submitterRole,
      submitterFirstName,
      submitterLastName,
      submitterEmail,
    } = req.body;

    const suggestion = await prisma.roasterSuggestion.create({
      data: {
        roasterName,
        city,
        state,
        country,
        website,
        submitterRole,
        submitterFirstName,
        submitterLastName,
        submitterEmail,
        status: 'new',
      },
    });

    // Log audit trail - construct explicit object with all field values from request body
    // Use || '' to ensure empty strings instead of undefined
    const auditValues = {
      roasterName: roasterName || '',
      city: city || '',
      state: state || '',
      country: country || '',
      website: website || '',
      submitterRole: submitterRole || '',
      submitterFirstName: submitterFirstName || '',
      submitterLastName: submitterLastName || '',
      submitterEmail: submitterEmail || '',
      status: 'new',
    };

    await createAuditLog({
      action: 'CREATE',
      entityType: 'roasterSuggestion',
      entityId: suggestion.id,
      entityName: roasterName || 'Unknown',
      userId: (req as any).user?.id || null,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      newValues: auditValues,
    });

    // Send emails asynchronously (don't block response)
    const emailDetails = {
      roasterName,
      submitterFirstName,
      submitterLastName,
      submitterEmail,
      submitterRole,
      website,
      city,
      state,
      country,
      suggestionId: suggestion.id,
    };

    // Send thank you email to submitter
    sendSubmissionThankYouEmail(emailDetails)
      .catch((error) => {
        console.error('❌ Failed to send thank you email:', error);
      });

    // Send notification to admin
    sendAdminSubmissionNotification(emailDetails)
      .catch((error) => {
        console.error('❌ Failed to send admin notification email:', error);
      });

    res.status(201).json(suggestion);
  } catch (error) {
    console.error('Error creating roaster suggestion:', error);
    res.status(500).json({ error: 'Failed to create suggestion' });
  }
});

/**
 * @swagger
 * /api/suggestions:
 *   get:
 *     summary: Get all roaster suggestions (Admin only)
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, approved, in_progress, rejected, done]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoasterSuggestion'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const suggestions = await prisma.roasterSuggestion.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

/**
 * @swagger
 * /api/suggestions/{id}:
 *   get:
 *     summary: Get a single roaster suggestion by ID (Admin only)
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Suggestion ID
 *     responses:
 *       200:
 *         description: Suggestion details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoasterSuggestion'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Suggestion not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const suggestion = await prisma.roasterSuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    res.json(suggestion);
  } catch (error) {
    console.error('Error fetching suggestion:', error);
    res.status(500).json({ error: 'Failed to fetch suggestion' });
  }
});

/**
 * @swagger
 * /api/suggestions/{id}:
 *   patch:
 *     summary: Update a roaster suggestion (Admin only)
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Suggestion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, approved, in_progress, rejected, done]
 *               adminNotes:
 *                 type: string
 *               roasterName:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               website:
 *                 type: string
 *               submitterFirstName:
 *                 type: string
 *               submitterLastName:
 *                 type: string
 *               submitterEmail:
 *                 type: string
 *               submitterRole:
 *                 type: string
 *                 enum: [customer, rando, scout, owner, admin, marketing]
 *     responses:
 *       200:
 *         description: Suggestion updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoasterSuggestion'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Suggestion not found
 *       500:
 *         description: Server error
 */
/**
 * PATCH /api/suggestions/:id
 * Update a roaster suggestion status (admin only)
 */
router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { 
      status, 
      adminNotes,
      roasterName,
      city,
      state,
      country,
      website,
      submitterFirstName,
      submitterLastName,
      submitterEmail,
      submitterRole
    } = req.body;

    if (!status || !['new', 'approved', 'in_progress', 'rejected', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    // Fetch the old suggestion before updating for audit log
    const oldSuggestion = await prisma.roasterSuggestion.findUnique({
      where: { id },
    });

    if (!oldSuggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    const updateData: any = {
      status,
      reviewedAt: new Date(),
    };

    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (roasterName !== undefined) updateData.roasterName = roasterName;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (website !== undefined) updateData.website = website;
    if (submitterFirstName !== undefined) updateData.submitterFirstName = submitterFirstName;
    if (submitterLastName !== undefined) updateData.submitterLastName = submitterLastName;
    if (submitterEmail !== undefined) updateData.submitterEmail = submitterEmail;
    if (submitterRole !== undefined) updateData.submitterRole = submitterRole;

    const suggestion = await prisma.roasterSuggestion.update({
      where: { id },
      data: updateData,
    });

    // Log audit trail with old and new values for proper change tracking
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'roasterSuggestion',
      entityId: suggestion.id,
      entityName: suggestion.roasterName,
      userId: (req as any).user?.id || null,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      oldValues: oldSuggestion as Record<string, any>,
      newValues: suggestion as Record<string, any>,
    });

    res.json(suggestion);
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ error: 'Failed to update suggestion' });
  }
});

/**
 * @swagger
 * /api/suggestions/{id}:
 *   delete:
 *     summary: Delete a roaster suggestion (Admin only)
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Suggestion ID
 *     responses:
 *       200:
 *         description: Suggestion deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Suggestion not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if suggestion exists
    const existingSuggestion = await prisma.roasterSuggestion.findUnique({
      where: { id },
    });

    if (!existingSuggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    // Delete the suggestion
    await prisma.roasterSuggestion.delete({
      where: { id },
    });

    // Log audit trail
    await createAuditLog({
      action: 'DELETE',
      entityType: 'roasterSuggestion',
      entityId: id,
      entityName: existingSuggestion.roasterName,
      userId: (req as any).user?.id || null,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      oldValues: existingSuggestion as Record<string, any>,
    });

    res.json({ message: 'Suggestion deleted successfully' });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({ error: 'Failed to delete suggestion' });
  }
});

/**
 * @swagger
 * /api/suggestions/{id}/create-roaster:
 *   post:
 *     summary: Create a roaster from a suggestion (Admin only)
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Suggestion ID
 *     responses:
 *       200:
 *         description: Roaster created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roaster:
 *                   $ref: '#/components/schemas/Roaster'
 *                 contact:
 *                   type: object
 *                 suggestion:
 *                   $ref: '#/components/schemas/RoasterSuggestion'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Suggestion not found
 *       500:
 *         description: Server error
 */
router.post('/:id/create-roaster', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch the suggestion
    const suggestion = await prisma.roasterSuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    // Check if a roaster was already created from this suggestion
    if (suggestion.roasterId) {
      return res.status(400).json({ 
        error: 'Roaster already created from this suggestion',
        roasterId: suggestion.roasterId
      });
    }

    // Find or create the submitter user based on email
    let submitterUser = await prisma.user.findUnique({
      where: { email: suggestion.submitterEmail }
    });

    // Create the roaster
    const roaster = await prisma.roaster.create({
      data: {
        name: suggestion.roasterName,
        city: suggestion.city,
        state: suggestion.state || undefined,
        country: suggestion.country,
        website: suggestion.website,
        ownerId: submitterUser?.id,
        createdById: (req as any).user?.id,
        verified: false,
        sourceType: 'Suggestion',
        sourceDetails: `Created from suggestion ${id}`,
        showHours: false, // Disable show hours by default when converting from suggestion
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        }
      }
    });

    // Check if a contact person with this email already exists
    let contact;
    let nameChanged = false;
    const existingContact = await prisma.roasterPerson.findFirst({
      where: { email: suggestion.submitterEmail },
    });

    if (existingContact) {
      // Check if name is different
      const existingName = `${existingContact.firstName} ${existingContact.lastName || ''}`.trim();
      const newName = `${suggestion.submitterFirstName} ${suggestion.submitterLastName || ''}`.trim();
      nameChanged = existingName.toLowerCase() !== newName.toLowerCase();

      // Try to create a new link for this existing person to the new roaster.
      // If a unique constraint occurs (unlikely for a newly-created roaster),
      // fall back to finding and reusing the existing roasterPerson record.
      try {
        contact = await prisma.roasterPerson.create({
          data: {
            roasterId: roaster.id,
            firstName: existingContact.firstName,
            lastName: existingContact.lastName,
            email: existingContact.email,
            mobile: suggestion.submitterPhone || existingContact.mobile,
            userId: submitterUser?.id || existingContact.userId,
            roles: ['scout'],
            isPrimary: false,
            isActive: true,
            createdById: (req as any).user?.id,
          }
        });
      } catch (err: any) {
        console.error('Error creating roasterPerson link for existingContact:', err);
        if (err.code === 'P2002') {
          // Find the existing person for this roaster/email and reuse it
          const existingLink = await prisma.roasterPerson.findFirst({
            where: {
              roasterId: roaster.id,
              email: existingContact.email
            },
            include: {
              user: true,
              roaster: true
            }
          });
          if (existingLink) {
            contact = existingLink;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    } else {
      // Create new contact person for the roaster
      try {
        contact = await prisma.roasterPerson.create({
          data: {
            roasterId: roaster.id,
            firstName: suggestion.submitterFirstName,
            lastName: suggestion.submitterLastName || undefined,
            email: suggestion.submitterEmail,
            mobile: suggestion.submitterPhone || undefined,
            userId: submitterUser?.id,
            roles: ['scout'],
            isPrimary: false,
            isActive: true,
            createdById: (req as any).user?.id,
          }
        });
      } catch (err: any) {
        console.error('Error creating new roasterPerson for suggestion:', err);
        if (err.code === 'P2002') {
          // Another process created the same person concurrently; find and reuse it
          const existingLink = await prisma.roasterPerson.findFirst({
            where: {
              roasterId: roaster.id,
              email: suggestion.submitterEmail
            },
            include: {
              user: true,
              roaster: true
            }
          });
          if (existingLink) {
            contact = existingLink;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    }

    // Update the suggestion with the roaster ID
    const updatedSuggestion = await prisma.roasterSuggestion.update({
      where: { id },
      data: {
        roasterId: roaster.id,
        status: 'in_progress',
      },
      include: {
        roaster: true
      }
    });

    // Log audit trails
    await createAuditLog({
      action: 'CREATE',
      entityType: 'roaster',
      entityId: roaster.id,
      entityName: roaster.name,
      userId: (req as any).user?.id || null,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      newValues: roaster as Record<string, any>,
    });

    await createAuditLog({
      action: 'CREATE',
      entityType: 'roasterPerson',
      entityId: contact.id,
      entityName: `${contact.firstName} ${contact.lastName || ''}`.trim(),
      userId: (req as any).user?.id || null,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      newValues: contact as Record<string, any>,
    });

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'roasterSuggestion',
      entityId: suggestion.id,
      entityName: suggestion.roasterName,
      userId: (req as any).user?.id || null,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      oldValues: suggestion as Record<string, any>,
      newValues: updatedSuggestion as Record<string, any>,
    });

    res.json({ 
      roaster, 
      contact, 
      suggestion: updatedSuggestion,
      nameChanged: nameChanged,
      existingContactUsed: !!existingContact
    });
  } catch (error: any) {
    console.error('Error creating roaster from suggestion:', error);
    
    // Handle duplicate roaster name error
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({ 
        error: 'A roaster with this name already exists. Please modify the name before creating.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create roaster from suggestion' });
  }
});

export default router;
