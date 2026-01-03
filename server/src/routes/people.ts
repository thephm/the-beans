import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

import { createAuditLog, getClientIP, getUserAgent } from '../lib/auditService';

const router = Router();
// Use shared Prisma client

// Person roles enum
export enum PersonRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  ROASTER = 'roaster',
  EMPLOYEE = 'employee',
  BILLING = 'billing',
  MARKETING = 'marketing',
  SCOUT = 'scout',
  CUSTOMER = 'customer'
}

// Permission helper functions
export function getPersonPermissions(roles: string[]): any {
  const permissions = {
    canEditRoaster: false,
    canManagePeople: false,
    canViewBilling: false,
    canDeleteRoaster: false
  };

  if (roles.includes(PersonRole.OWNER)) {
    permissions.canEditRoaster = true;
    permissions.canManagePeople = true;
    permissions.canViewBilling = true;
    permissions.canDeleteRoaster = true;
  } else if (roles.includes(PersonRole.ADMIN)) {
    permissions.canEditRoaster = true;
    permissions.canManagePeople = false; // Can't manage owners
    permissions.canViewBilling = false;
    permissions.canDeleteRoaster = false;
  } else if (roles.includes(PersonRole.ROASTER)) {
    permissions.canEditRoaster = true;
    permissions.canManagePeople = false;
    permissions.canViewBilling = false;
    permissions.canDeleteRoaster = false;
  } else if (roles.includes(PersonRole.EMPLOYEE)) {
    permissions.canEditRoaster = false;
    permissions.canManagePeople = false;
    permissions.canViewBilling = false;
    permissions.canDeleteRoaster = false;
  } else if (roles.includes(PersonRole.BILLING)) {
    permissions.canEditRoaster = false;
    permissions.canManagePeople = false;
    permissions.canViewBilling = true;
    permissions.canDeleteRoaster = false;
  }

  return permissions;
}

// Helper function to check if user can manage people for a roaster
async function canManagePeople(userId: string, roasterId: string): Promise<boolean> {
  try {
    // First, check if user is a system admin - they can always manage people
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (user?.role === 'admin') {
      return true;
    }

    // Check if user is already a person with proper permissions for this roaster
    const userperson = await prisma.roasterPerson.findFirst({
      where: {
        roasterId,
        userId,
        isActive: true,
        roles: {
          hasSome: [PersonRole.OWNER, PersonRole.ADMIN]
        }
      }
    });

    if (!userperson) return false;

    // Check permissions based on roles
    const permissions = getPersonPermissions(userperson.roles);
    return permissions.canManagePeople || permissions.canEditRoaster;
  } catch (error) {
    console.error('Error checking person permissions:', error);
    return false;
  }
}

// GET /api/people - Get all people (admin only, for people management page)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 500 }),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
], requireAuth, async (req: Request, res: Response) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Only admin users can get all people
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;
    const { sortBy, sortOrder } = req.query;

    // Build orderBy clause
    let orderBy: any = [
      { firstName: 'asc' },
      { lastName: 'asc' }
    ]; // Default

    if (sortBy) {
      const direction = sortOrder === 'desc' ? 'desc' : 'asc';
      switch (sortBy) {
        case 'firstName':
        case 'lastName':
        case 'email':
        case 'mobile':
        case 'title':
        case 'isPrimary':
        case 'createdAt':
          orderBy = [{ [sortBy]: direction }];
          break;
        // For roaster and roles, we'll need to handle them specially
        default:
          orderBy = [
            { firstName: 'asc' },
            { lastName: 'asc' }
          ];
      }
    }

    // Get all people across all roasters
    const people = await prisma.roasterPerson.findMany({
      where: {
        isActive: true
      },
      skip,
      take: limit,
      include: {
        roaster: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: orderBy
    });

    const total = await prisma.roasterPerson.count({
      where: {
        isActive: true
      }
    });
    const pages = Math.ceil(total / limit);

    // Add permissions to each person
    const peopleWithPermissions = people.map((person: any) => ({
      ...person,
      permissions: getPersonPermissions(person.roles)
    }));

    res.json({
      data: peopleWithPermissions,
      count: people.length,
      pagination: {
        page,
        limit,
        total,
        pages,
      }
    });

  } catch (error) {
    console.error('Get all people error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/people/:id - Get a single person by ID
router.get('/:id', [
  param('id').isString().notEmpty().withMessage('Person ID is required')
], requireAuth, async (req: Request, res: Response) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    // Find person by ID
    const person = await prisma.roasterPerson.findUnique({
      where: { id },
      include: {
        roaster: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      }
    });
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    // Attach permissions
    const personWithPermissions = {
      ...person,
      permissions: getPersonPermissions(person.roles)
    };
    res.json({ person: personWithPermissions });
  } catch (error) {
    console.error('Get person by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/people/roaster/:roasterId - Get all people for a roaster
router.get('/roaster/:roasterId', [
  param('roasterId').isString().notEmpty().withMessage('Roaster ID is required')
], requireAuth, async (req: Request, res: Response) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roasterId } = req.params;

    // Check if roaster exists
    const roaster = await prisma.roaster.findUnique({
      where: { id: roasterId }
    });

    if (!roaster) {
      return res.status(404).json({ error: 'Roaster not found' });
    }

    // Get all people for the roaster
    const people = await prisma.roasterPerson.findMany({
      where: {
        roasterId,
        isActive: true
      },
      include: {
        roaster: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    // Add permissions to each person
    const peopleWithPermissions = people.map((person: any) => ({
      ...person,
      permissions: getPersonPermissions(person.roles)
    }));

      res.json({
        data: peopleWithPermissions,
        count: people.length
      });

  } catch (error) {
    console.error('Get people error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/people/email/:email - Get all roaster associations for a person by email
router.get('/email/:email', requireAuth, async (req: Request, res: Response) => {

  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find all people with this email across all roasters
    const people = await prisma.roasterPerson.findMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      },
      include: {
        roaster: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: {
        roaster: {
          name: 'asc'
        }
      }
    });

    const peopleWithPermissions = people.map(person => ({
      ...person,
      permissions: getPersonPermissions(person.roles)
    }));

    res.json({
      data: peopleWithPermissions,
      count: people.length
    });

  } catch (error) {
    console.error('Get people by email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/people - Create a new person
router.post('/', [
  body('roasterId').isString().notEmpty().withMessage('Roaster ID is required'),
  body('firstName').isString().isLength({ min: 1, max: 50 }).withMessage('First name is required and must be 1-50 characters'),
  body('lastName').optional().isString().isLength({ max: 50 }).withMessage('Last name must be 50 characters or less'),
  body('title').optional({ nullable: true }).isString().isLength({ max: 100 }).withMessage('Title must be 100 characters or less').custom((value: any) => value === null || typeof value === 'string' || value === '').withMessage('Title must be a string or null'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email address'),
  body('mobile').optional().isString().isLength({ max: 20 }).withMessage('Mobile must be 20 characters or less'),
  body('linkedinUrl').optional({ checkFalsy: true }).isURL().withMessage('Please enter a valid LinkedIn URL'),
  body('bio').optional().isString().isLength({ max: 1000 }).withMessage('Bio must be 1000 characters or less'),
  body('roles').optional().isArray().withMessage('Roles must be an array if provided'),
  body('roles.*').optional().isIn(Object.values(PersonRole)).withMessage('Invalid role'),
  body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean')
], requireAuth, async (req: Request, res: Response) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

  const roasterId = req.body.roasterId as string;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const title = req.body.title;
  const email = req.body.email;
  const mobile = req.body.mobile;
  const linkedinUrl = req.body.linkedinUrl;
  const instagramUrl = req.body.instagramUrl;
  const bio = req.body.bio;
  const roles = req.body.roles;
  const isPrimary = req.body.isPrimary;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if roaster exists
    const roaster = await prisma.roaster.findUnique({
      where: { id: roasterId }
    });

    if (!roaster) {
      return res.status(404).json({ error: 'Roaster not found' });
    }

    // Check if user can manage people for this roaster
    const canManage = await canManagePeople(userId, roasterId);
    if (!canManage) {
      return res.status(403).json({ error: 'Permission denied. Only owners and admins can manage people.' });
    }

    // If setting as primary, remove primary status from other people
    if (isPrimary) {
      await prisma.roasterPerson.updateMany({
        where: {
          roasterId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      });
    }

    // If email is provided, check if user exists
    // Normalize empty string to null to avoid unique constraint issues
    const normalizedEmail = email && email.trim() !== '' ? email : null;
    let linkedUserId = null;
    if (normalizedEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
      linkedUserId = existingUser?.id || null;
    }

    // Create the person
    const person = await prisma.roasterPerson.create({
      data: {
        roasterId,
        userId: linkedUserId,
        firstName,
        lastName,
        title,
        email: normalizedEmail,
        mobile,
        linkedinUrl,
        instagramUrl,
        bio,
        roles,
        isPrimary: isPrimary || false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      }
    });

    const personWithPermissions = {
      ...person,
      permissions: getPersonPermissions(person.roles)
    };

    // Audit log: CREATE person
    // Extract only the actual database fields (no relations) for audit
    const { user: _user, ...valuesForAudit } = person as any;
    
    await createAuditLog({
      action: 'CREATE',
      entityType: 'person',
      entityId: person.id,
      entityName: `${person.firstName} ${person.lastName || ''}`.trim(),
      userId,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      newValues: valuesForAudit,
    });

    res.status(201).json({
      message: 'person created successfully',
      person: personWithPermissions
    });

  } catch (error: any) {
    console.error('Create person error:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'A person with this email already exists for this roaster' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/people/:id - Update a person
router.put('/:id', [
  param('id').isString().notEmpty().withMessage('person ID is required'),
  body('roasterId').optional().isString().notEmpty().withMessage('Roaster ID must be a valid string'),
  body('firstName').optional().isString().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('lastName').optional().isString().isLength({ max: 50 }).withMessage('Last name must be 50 characters or less'),
  body('title').optional({ nullable: true }).isString().isLength({ max: 100 }).withMessage('Title must be 100 characters or less').custom((value: any) => value === null || typeof value === 'string' || value === '').withMessage('Title must be a string or null'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email address'),
  body('mobile').optional().isString().isLength({ max: 20 }).withMessage('Mobile must be 20 characters or less'),
  body('linkedinUrl').optional({ checkFalsy: true }).isURL().withMessage('Please enter a valid LinkedIn URL'),
  body('instagramUrl').optional({ checkFalsy: true }).isURL().withMessage('Please enter a valid Instagram URL'),
  body('bio').optional().isString().isLength({ max: 1000 }).withMessage('Bio must be 1000 characters or less'),
  body('roles').optional().isArray().withMessage('Roles must be an array if provided'),
  body('roles.*').optional().isIn(Object.values(PersonRole)).withMessage('Invalid role'),
  body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], requireAuth, async (req: Request, res: Response) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

  const id = req.params.id;
  const roasterId = req.body.roasterId as string | undefined;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const title = req.body.title;
  const email = req.body.email;
  const mobile = req.body.mobile;
  const linkedinUrl = req.body.linkedinUrl;
  const instagramUrl = req.body.instagramUrl;
  const bio = req.body.bio;
  const roles = req.body.roles;
  const isPrimary = req.body.isPrimary;
  const isActive = req.body.isActive;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get existing person
    const existingperson = await prisma.roasterPerson.findUnique({
      where: { id }
    });

    if (!existingperson) {
      return res.status(404).json({ error: 'person not found' });
    }

    // Check if user can manage people for this roaster
    const canManage = await canManagePeople(userId, existingperson.roasterId);
    if (!canManage) {
      return res.status(403).json({ error: 'Permission denied. Only owners and admins can manage people.' });
    }

    // If roasterId is being changed, validate and check permissions
    let newRoasterId = existingperson.roasterId;
    if (roasterId !== undefined && roasterId !== existingperson.roasterId) {
      // Check if new roaster exists
      const newRoaster = await prisma.roaster.findUnique({
        where: { id: roasterId as string }
      });

      if (!newRoaster) {
        return res.status(404).json({ error: 'New roaster not found' });
      }

      // Check if user can manage people for the new roaster
      const canManageNewRoaster = await canManagePeople(userId, roasterId as string);
      if (!canManageNewRoaster) {
        return res.status(403).json({ error: 'Permission denied. You cannot move people to a roaster you do not manage.' });
      }

      newRoasterId = roasterId as string;
    }

    // Prevent removing the last owner
    if (roles && !roles.includes(PersonRole.OWNER) && existingperson.roles.includes(PersonRole.OWNER)) {
      const ownerCount = await prisma.roasterPerson.count({
        where: {
          roasterId: existingperson.roasterId,
          isActive: true,
          roles: {
            has: PersonRole.OWNER
          }
        }
      });

      if (ownerCount <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last owner. At least one owner is required.' });
      }
    }

    // If setting as primary, remove primary status from other people
    if (isPrimary === true) {
      await prisma.roasterPerson.updateMany({
        where: {
          roasterId: newRoasterId,
          isPrimary: true,
          id: { not: id }
        },
        data: {
          isPrimary: false
        }
      });
    }

    // If email is provided, check if user exists
    // Normalize empty string to null to avoid unique constraint issues
    let linkedUserId = existingperson.userId;
    let normalizedEmail = undefined;
    if (email !== undefined) {
      normalizedEmail = email && email.trim() !== '' ? email : null;
      if (normalizedEmail) {
        const existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });
        linkedUserId = existingUser?.id || null;
      } else {
        linkedUserId = null;
      }
    }

    // Update the person
    const updatedperson = await prisma.roasterPerson.update({
      where: { id },
      data: {
        ...(roasterId !== undefined && { roasterId: newRoasterId }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(title !== undefined && { title }),
        ...(email !== undefined && { email: normalizedEmail }),
        ...(mobile !== undefined && { mobile }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(instagramUrl !== undefined && { instagramUrl }),
        ...(bio !== undefined && { bio }),
        ...(roles !== undefined && { roles }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(isActive !== undefined && { isActive }),
        userId: linkedUserId,
        updatedAt: new Date()
      },
      include: {
        roaster: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      }
    });

    const personWithPermissions = {
      ...updatedperson,
      permissions: getPersonPermissions(updatedperson.roles)
    };

    // Audit log: UPDATE person
    // Extract only the actual database fields (no relations) for audit comparison
    const { roaster: _roaster1, user: _user1, ...oldValuesForAudit } = existingperson as any;
    const { roaster: _roaster2, user: _user2, ...newValuesForAudit } = updatedperson as any;
    
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'person',
      entityId: updatedperson.id,
      entityName: `${updatedperson.firstName} ${updatedperson.lastName || ''}`.trim(),
      userId,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      oldValues: oldValuesForAudit,
      newValues: newValuesForAudit,
    });

    res.json({
      message: 'person updated successfully',
      person: personWithPermissions
    });

  } catch (error: any) {
    console.error('Update person error:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'A person with this email already exists for this roaster' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/people/:id - Delete a person
router.delete('/:id', [
  param('id').isString().notEmpty().withMessage('person ID is required')
], requireAuth, async (req: Request, res: Response) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

  const id = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get existing person
    const existingperson = await prisma.roasterPerson.findUnique({
      where: { id }
    });

    if (!existingperson) {
      return res.status(404).json({ error: 'person not found' });
    }

    // Check if user can manage people for this roaster
    const canManage = await canManagePeople(userId, existingperson.roasterId);
    if (!canManage) {
      return res.status(403).json({ error: 'Permission denied. Only owners and admins can manage people.' });
    }

    // Delete the person
    await prisma.roasterPerson.delete({
      where: { id }
    });

    // Audit log: DELETE person
    // Extract only the actual database fields (no relations) for audit
    const { roaster: _roaster, user: _user, ...valuesForAudit } = existingperson as any;
    
    await createAuditLog({
      action: 'DELETE',
      entityType: 'person',
      entityId: existingperson.id,
      entityName: `${existingperson.firstName} ${existingperson.lastName || ''}`.trim(),
      userId,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      oldValues: valuesForAudit,
    });

    res.json({
      message: 'person deleted successfully'
    });

  } catch (error) {
    console.error('Delete person error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
