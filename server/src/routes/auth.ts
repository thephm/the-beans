import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { auditBefore, auditAfter } from '../middleware/auditMiddleware';
import { createAuditLog, getClientIP, getUserAgent, getEntityName } from '../lib/auditService';

const router = Router();
// Use shared Prisma client

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - username
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           description: The user's email
 *         username:
 *           type: string
 *           description: The user's username
 *         firstName:
 *           type: string
 *           description: The user's first name (required)
 *         lastName:
 *           type: string
 *           description: The user's last name (required)
 *         avatar:
 *           type: string
 *           description: URL to the user's avatar image
 *         bio:
 *           type: string
 *           description: The user's bio
 *         location:
 *           type: string
 *           description: The user's location
 *       example:
 *         id: d5fE_aSd
 *         email: coffee@lover.com
 *         username: coffeelover
 *         firstName: Coffee
 *         lastName: Lover
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         description: Bad request
 *       409:
 *         description: User already exists
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 50 }),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
], async (req: any, res: any) => {
  try {
    // Set up audit context before validation
    req.auditData = {
      entityType: 'user',
      action: 'CREATE' as const
    };

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        // For self-registration, createdById is null (user created themselves)
        createdById: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        location: true,
        language: true,
        createdAt: true,
      }
    });

    // Set up audit logging - use the newly created user ID for audit
    req.userId = user.id;
    
    // Store entity for audit logging
    res.locals.auditEntity = user;

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Create audit log manually since we need the user ID from the created user
    if (req.auditData && req.userId) {
      const auditLogData = {
        action: req.auditData.action,
        entityType: req.auditData.entityType,
        entityId: user.id,
        entityName: getEntityName(req.auditData.entityType, user),
        userId: req.userId,
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
        oldValues: req.auditData.oldValues,
        newValues: user
      };
      
      // Create audit log asynchronously (don't block the response)
      setTimeout(() => createAuditLog(auditLogData), 0);
    }

    res.status(201).json({
      message: 'User created successfully',
      user,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Block login for deprecated users
    if (user.isDeprecated) {
      return res.status(403).json({
        error: 'Account deprecated',
        message: 'This account has been deprecated and cannot log in.'
      });
    }

    // OAuth users don't have passwords
    if (!user.password) {
      return res.status(401).json({
        error: 'Invalid login method',
        message: 'This account uses social login. Please sign in with your social account.'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update lastLogin timestamp
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        location: true,
        latitude: true,
        longitude: true,
        language: true,
        role: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email or username already taken
 */
router.put('/profile', [
  body('email').optional().isEmail().normalizeEmail(),
  body('username').optional().isLength({ min: 3, max: 50 }),
], async (req: any, res: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, language } = req.body;
    const userId = decoded.userId;

    // Set up audit context
    req.auditData = {
      entityType: 'user',
      action: 'UPDATE' as const
    };
    req.userId = userId;

    // Get current user data for audit
    const oldUser = await prisma.user.findUnique({ where: { id: userId } });
    req.auditData.oldValues = oldUser;

    // Check if email or username is already taken by another user
    if (email || username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                email ? { email } : {},
                username ? { username } : {}
              ].filter(obj => Object.keys(obj).length > 0)
            }
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Email or username already taken',
          message: existingUser.email === email ? 'Email already in use' : 'Username already taken'
        });
      }
    }

    // Update user profile
    const updateData: any = { updatedById: userId };
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    if (language && typeof language === 'string') updateData.language = language;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        bio: true,
        location: true,
        latitude: true,
        longitude: true,
        language: true,
        role: true,
        createdAt: true,
      }
    });

    // Store entity for audit logging
    res.locals.auditEntity = updatedUser;

    // Create audit log
    if (req.auditData && req.userId) {
      const auditLogData = {
        action: req.auditData.action,
        entityType: req.auditData.entityType,
        entityId: updatedUser.id,
        entityName: getEntityName(req.auditData.entityType, updatedUser),
        userId: req.userId,
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
        oldValues: req.auditData.oldValues,
        newValues: updatedUser
      };
      
      // Create audit log asynchronously
      setTimeout(() => createAuditLog(auditLogData), 0);
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate password reset token
router.get('/validate-reset-token', async (req: import('express').Request, res: import('express').Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.json({ valid: false, error: 'Missing token' });
  }
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return res.json({ valid: false });
  }
  return res.json({ valid: true });
});

// Reset password using token
router.post('/reset-password', [
  body('token').isString(),
  body('password').isLength({ min: 6 })
], async (req: import('express').Request, res: import('express').Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid input', details: errors.array() });
  }
  const { token, password } = req.body;
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }
  const user = await prisma.user.findUnique({ where: { id: resetToken.userId } });
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });
  // Remove the used token
  await prisma.passwordResetToken.delete({ where: { token } });
  // Remove all expired tokens
  await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  res.json({ message: 'Password reset successful' });
});

export default router;
