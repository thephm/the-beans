import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP configuration missing. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email using the configured SMTP transporter
 */
export const sendEmail = async ({ to, subject, text, html }: SendEmailParams): Promise<boolean> => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('❌ Email transporter not configured. Cannot send email.');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"The Beans" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

interface SubmissionDetails {
  roasterName: string;
  submitterFirstName?: string;
  submitterLastName?: string;
  submitterEmail?: string;
  submitterRole: string;
  website: string;
  city?: string;
  state?: string;
  country?: string;
  suggestionId: string;
}

/**
 * Send thank you email to the person who submitted the roaster
 */
export const sendSubmissionThankYouEmail = async (details: SubmissionDetails): Promise<boolean> => {
  const { roasterName, submitterFirstName, submitterLastName, submitterEmail } = details;

  // Skip if no email provided (e.g., for 'rando' submissions)
  if (!submitterEmail) {
    console.log('⚠️ No submitter email provided, skipping thank you email');
    return false;
  }

  const name = [submitterFirstName, submitterLastName].filter(Boolean).join(' ') || 'there';
  
  const subject = 'Thank you for your roaster submission!';
  const text = `
Hi ${name},

Thank you for submitting "${roasterName}" to The Beans!

We appreciate you taking the time to help us build the most comprehensive directory of coffee roasters. Our team will review your submission and add it to our platform soon.

If you have any questions, feel free to reach out to us at ${process.env.CONTACT_US_EMAIL || 'contact@thebeans.ca'}.

Best regards,
The Beans Team
  `.trim();

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #9333EA;">Thank You For Your Submission!</h2>
  <p>Hi ${name},</p>
  <p>Thank you for submitting <strong>"${roasterName}"</strong> to The Beans!</p>
  <p>We appreciate you taking the time to help us build the most comprehensive directory of coffee roasters. Our team will review your submission and add it to our platform soon.</p>
  <p>If you have any questions, feel free to reach out to us at <a href="mailto:${process.env.CONTACT_US_EMAIL || 'contact@thebeans.ca'}">${process.env.CONTACT_US_EMAIL || 'contact@thebeans.ca'}</a>.</p>
  <p>Best regards,<br><strong>The Beans Team</strong></p>
</div>
  `.trim();

  return sendEmail({
    to: submitterEmail,
    subject,
    text,
    html,
  });
};

/**
 * Send notification email to admin about a new submission
 */
export const sendAdminSubmissionNotification = async (details: SubmissionDetails): Promise<boolean> => {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    console.warn('⚠️ ADMIN_EMAIL not configured. Cannot send admin notification.');
    return false;
  }

  const {
    roasterName,
    submitterFirstName,
    submitterLastName,
    submitterEmail,
    submitterRole,
    website,
    city,
    state,
    country,
    suggestionId,
  } = details;

  const submitterName = [submitterFirstName, submitterLastName].filter(Boolean).join(' ') || 'Anonymous';
  const location = [city, state, country].filter(Boolean).join(', ') || 'Location not provided';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const adminPanelUrl = `${frontendUrl}/admin/suggestions?id=${suggestionId}`;

  const subject = `New Roaster Submission: ${roasterName}`;
  const text = `
New roaster submission received!

Roaster Details:
- Name: ${roasterName}
- Website: ${website}
- Location: ${location}

Submitter Information:
- Name: ${submitterName}
- Email: ${submitterEmail || 'Not provided'}
- Role: ${submitterRole}

Please review and approve this submission in the admin panel:
${adminPanelUrl}
  `.trim();

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #9333EA;">New Roaster Submission</h2>
  
  <h3>Roaster Details:</h3>
  <ul>
    <li><strong>Name:</strong> ${roasterName}</li>
    <li><strong>Website:</strong> <a href="${website}">${website}</a></li>
    <li><strong>Location:</strong> ${location}</li>
  </ul>

  <h3>Submitter Information:</h3>
  <ul>
    <li><strong>Name:</strong> ${submitterName}</li>
    <li><strong>Email:</strong> ${submitterEmail || 'Not provided'}</li>
    <li><strong>Role:</strong> ${submitterRole}</li>
  </ul>

  <p style="margin-top: 20px;">
    Please review and approve this submission in the <a href="${adminPanelUrl}" style="color: #6F4E37; font-weight: bold;">admin panel</a>.
  </p>
</div>
  `.trim();

  return sendEmail({
    to: adminEmail,
    subject,
    text,
    html,
  });
};
