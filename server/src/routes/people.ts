import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import { AuthenticatedRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

// Person roles enum
export enum PersonRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  BILLING = 'billing'
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

// GET /api/people/:roasterId - Get all people for a roaster
router.get('/:roasterId', [
  param('roasterId').isString().notEmpty().withMessage('Roaster ID is required')
], requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

// POST /api/people - Create a new person
router.post('/', [
  body('roasterId').isString().notEmpty().withMessage('Roaster ID is required'),
  body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be 1-100 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email address'),
  body('mobile').optional().isString().isLength({ max: 20 }).withMessage('Mobile must be 20 characters or less'),
  body('bio').optional().isString().isLength({ max: 1000 }).withMessage('Bio must be 1000 characters or less'),
  body('roles').isArray({ min: 1 }).withMessage('At least one role is required'),
  body('roles.*').isIn(Object.values(PersonRole)).withMessage('Invalid role'),
  body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean')
], requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roasterId, name, email, mobile, bio, roles, isPrimary } = req.body;
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
    let linkedUserId = null;
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      linkedUserId = existingUser?.id || null;
    }

    // Create the person
    const person = await prisma.roasterPerson.create({
      data: {
        roasterId,
        userId: linkedUserId,
        name,
        email,
        mobile,
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

    res.status(201).json({
      message: 'person created successfully',
      person: personWithPermissions
    });

  } catch (error) {
    console.error('Create person error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/people/:id - Update a person
router.put('/:id', [
  param('id').isString().notEmpty().withMessage('person ID is required'),
  body('name').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email address'),
  body('mobile').optional().isString().isLength({ max: 20 }).withMessage('Mobile must be 20 characters or less'),
  body('bio').optional().isString().isLength({ max: 1000 }).withMessage('Bio must be 1000 characters or less'),
  body('roles').optional().isArray({ min: 1 }).withMessage('At least one role is required if provided'),
  body('roles.*').optional().isIn(Object.values(PersonRole)).withMessage('Invalid role'),
  body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, mobile, bio, roles, isPrimary, isActive } = req.body;
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
          roasterId: existingperson.roasterId,
          isPrimary: true,
          id: { not: id }
        },
        data: {
          isPrimary: false
        }
      });
    }

    // If email is provided, check if user exists
    let linkedUserId = existingperson.userId;
    if (email !== undefined) {
      if (email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
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
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(mobile !== undefined && { mobile }),
        ...(bio !== undefined && { bio }),
        ...(roles !== undefined && { roles }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(isActive !== undefined && { isActive }),
        userId: linkedUserId,
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
      ...updatedperson,
      permissions: getPersonPermissions(updatedperson.roles)
    };

    res.json({
      message: 'person updated successfully',
      person: personWithPermissions
    });

  } catch (error) {
    console.error('Update person error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/people/:id - Delete a person
router.delete('/:id', [
  param('id').isString().notEmpty().withMessage('person ID is required')
], requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
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

    // Prevent deleting the last owner
    if (existingperson.roles.includes(PersonRole.OWNER)) {
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
        return res.status(400).json({ error: 'Cannot delete the last owner. At least one owner is required.' });
      }
    }

    // Delete the person
    await prisma.roasterPerson.delete({
      where: { id }
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
