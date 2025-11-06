import express from 'express';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';

const router = express.Router();

const CONTACT_US_EMAIL = process.env.CONTACT_US_EMAIL;

router.post(
  '/',
  [
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('email').isEmail(),
    body('message').notEmpty().isString(),
  ],
  async (req: express.Request, res: express.Response) => {
    console.log('Contact form POST received:', {
      firstName: req.body?.firstName,
      lastName: req.body?.lastName,
      email: req.body?.email,
      message: req.body?.message,
      ip: req.ip,
      time: new Date().toISOString()
    });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (!CONTACT_US_EMAIL) {
      return res.status(500).json({ error: 'Contact email not configured.' });
    }
    const { firstName, lastName, email, message } = req.body;
    
    // Build sender name from firstName and lastName if provided
    let senderName = '';
    if (firstName || lastName) {
      senderName = [firstName, lastName].filter(Boolean).join(' ');
    }
    const fromAddress = senderName ? `${senderName} <${email}>` : email;
    
    try {
      // Configure nodemailer transport (example: using SMTP)
      const smtpPort = Number(process.env.SMTP_PORT || 587);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: smtpPort,
        secure: smtpPort === 465, // true for port 465, false for other ports
        requireTLS: true, // Force TLS for port 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates in development
        }
      });
      // Verify SMTP connection before sending
      await transporter.verify().catch((verifyErr: any) => {
        console.error('SMTP verification failed:', verifyErr);
        throw new Error('SMTP verification failed: ' + verifyErr.message);
      });
      await transporter.sendMail({
        from: fromAddress,
        to: CONTACT_US_EMAIL,
        subject: 'New message for thebeans.ca',
        replyTo: email,
        text: message,
      }).then((info: any) => {
        console.log('Contact email sent:', info);
      }).catch((sendErr: any) => {
        console.error('Error sending contact email:', sendErr);
        throw new Error('Error sending contact email: ' + sendErr.message);
      });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Contact form error:', err);
      return res.status(500).json({ error: 'Failed to send email.', details: err.message });
    }
  }
);

export default router;
