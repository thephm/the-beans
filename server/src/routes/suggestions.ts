import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { createAuditLog, getClientIP, getUserAgent } from '../lib/auditService';
import { requireAuth } from '../middleware/requireAuth';
import { sendSubmissionThankYouEmail, sendAdminSubmissionNotification } from '../lib/emailService';

const router = express.Router();

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
 * POST /api/suggestions
 * Create a new roaster suggestion
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
        status: 'pending',
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
      status: 'pending',
    };

    await createAuditLog({
      action: 'CREATE',
      entityType: 'RoasterSuggestion',
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
 * GET /api/suggestions
 * Get all roaster suggestions (admin only)
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
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
 * PATCH /api/suggestions/:id
 * Update a roaster suggestion status (admin only)
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
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

    if (!status || !['pending', 'approved', 'rejected', 'done'].includes(status)) {
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
      entityType: 'RoasterSuggestion',
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

export default router;
