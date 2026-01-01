import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { sendEmail } from '../lib/emailService';
import { createAuditLog, getClientIP, getUserAgent } from '../lib/auditService';
import crypto from 'crypto';

const router = Router();

// Request password reset
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req: import('express').Request, res: import('express').Response) => {
  console.log('DEBUG: forgot-password handler called');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('DEBUG: forgot-password validation failed', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  const { email } = req.body;
  console.log('DEBUG: forgot-password email received', email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Always respond with success to avoid user enumeration
    console.log('DEBUG: forgot-password user not found');
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }
  // Generate token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min expiry
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: expires,
    },
  });
  console.log('DEBUG: forgot-password token created', token);
  // Send email
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const emailResult = await sendEmail({
    to: email,
    subject: 'Reset your password',
    text: `Reset your password: ${resetUrl}\nThis link expires in 30 minutes.`,
    html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes.</p>`,
  });
  console.log('DEBUG: forgot-password sendEmail result', emailResult);
  // Audit log
  await createAuditLog({
    action: 'UPDATE', // Use a valid action type
    entityType: 'user',
    entityId: user.id,
    entityName: user.email,
    userId: user.id,
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
    newValues: { email },
  });
  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

export default router;
