# Email Configuration Guide

This guide covers setting up email functionality for **The Beans** application, including the Contact Us form and system notifications.

## Overview

The application uses SMTP (Simple Mail Transfer Protocol) to send emails. Email features include:
- **Contact Us Form**: Users can send messages that are delivered to your configured email
- **User Notifications**: Welcome emails, password resets, and other system notifications
- **Admin Notifications**: System alerts sent to administrators

## Required Environment Variables

Configure these in your `server/.env` file:

```env
# Email Recipients
CONTACT_US_EMAIL="contact@yourdomain.com"  # Receives Contact Us form submissions
ADMIN_EMAIL="admin@yourdomain.com"         # Receives admin notifications

# SMTP Server Configuration
SMTP_HOST="smtp.gmail.com"                 # Your SMTP server hostname
SMTP_PORT=587                              # Port number (587 for TLS, 465 for SSL)
SMTP_USER="your-email@gmail.com"           # SMTP authentication username
SMTP_PASS="your-app-password"              # SMTP authentication password
```

## Provider Setup Instructions

### Gmail

Gmail is a popular choice for development and small-scale deployments.

1. **Enable 2-Factor Authentication**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**:
   - Visit [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Enter "The Beans App"
   - Click "Generate"
   - Copy the 16-character password

3. **Configure Environment Variables**:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="xxxx xxxx xxxx xxxx"  # The app password from step 2
   ```

**Important Gmail Limits**:
- Daily sending limit: ~500 emails/day for free accounts
- Rate limit: ~100 emails/hour
- Best for: Development, testing, small deployments

### Fastmail

Fastmail is a reliable email provider with excellent SMTP support.

1. **Create App Password**:
   - Log into [Fastmail](https://www.fastmail.com)
   - Go to Settings > Privacy & Security > App Passwords
   - Create new app password
   - Name it "The Beans App"
   - Copy the generated password

2. **Configure Environment Variables**:
   ```env
   SMTP_HOST="smtp.fastmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@fastmail.com"
   SMTP_PASS="your-app-password"  # From step 1
   ```

**Fastmail Benefits**:
- Higher sending limits
- Better deliverability
- Excellent support
- Best for: Production deployments

### SendGrid

SendGrid is a transactional email service with high deliverability.

1. **Sign Up**:
   - Create account at [SendGrid](https://sendgrid.com)
   - Verify your domain (for production)

2. **Create API Key**:
   - Go to Settings > API Keys
   - Create API Key with "Mail Send" permissions
   - Copy the API key

3. **Configure Environment Variables**:
   ```env
   SMTP_HOST="smtp.sendgrid.net"
   SMTP_PORT=587
   SMTP_USER="apikey"  # Literally the word "apikey"
   SMTP_PASS="your-api-key"  # The API key from step 2
   ```

**SendGrid Benefits**:
- Free tier: 100 emails/day
- Excellent deliverability
- Email analytics
- Best for: Production applications, high volume

### Mailgun

Mailgun is another popular transactional email service.

1. **Sign Up**:
   - Create account at [Mailgun](https://mailgun.com)
   - Verify your domain

2. **Get SMTP Credentials**:
   - Go to Sending > Domain Settings
   - Copy SMTP credentials

3. **Configure Environment Variables**:
   ```env
   SMTP_HOST="smtp.mailgun.org"
   SMTP_PORT=587
   SMTP_USER="postmaster@your-domain.com"  # From Mailgun dashboard
   SMTP_PASS="your-smtp-password"  # From Mailgun dashboard
   ```

**Mailgun Benefits**:
- Free tier: 5,000 emails/month (first 3 months)
- Good deliverability
- API and SMTP support
- Best for: Production applications

## Docker Configuration

When using Docker, remember to:

1. **Update `.env` file** in the `server/` directory
2. **Restart the server container** for changes to take effect:
   ```bash
   docker-compose restart server
   ```
3. **Check logs** to verify email configuration:
   ```bash
   docker logs the-beans-server-1
   ```

## Testing Email Configuration

### Test via Contact Form

1. Start your application:
   ```bash
   docker-compose up
   ```

2. Navigate to [http://localhost:3000/contact](http://localhost:3000/contact)

3. Fill out and submit the contact form

4. Check the email address configured in `CONTACT_US_EMAIL`

### Test via Docker Command Line

Test email sending directly from the Docker container:

```bash
docker exec the-beans-server-1 node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
transporter.sendMail({
  from: 'your-email@gmail.com',
  to: 'test@example.com',
  subject: 'Test Email',
  text: 'This is a test email'
}).then(info => console.log('✅ Email sent:', info.messageId))
  .catch(err => console.error('❌ Email error:', err.message));
"
```

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

**Error**: `Invalid login: 535 Authentication failed`

**Solutions**:
- Gmail: Ensure 2FA is enabled and you're using an App Password
- Check username/password are correct
- Verify SMTP_USER matches your email address

#### 2. Connection Timeout

**Error**: `Connection timeout` or `ETIMEDOUT`

**Solutions**:
- Check SMTP_HOST is correct
- Verify SMTP_PORT (587 for TLS, 465 for SSL)
- Check firewall/network settings
- Try alternative port if blocked

#### 3. TLS/SSL Errors

**Error**: `TLS` or `SSL` related errors

**Solutions**:
- Port 587: Use TLS (`secure: false`)
- Port 465: Use SSL (`secure: true`)
- Update nodemailer if outdated

#### 4. Emails Not Received

**Solutions**:
- Check spam/junk folder
- Verify CONTACT_US_EMAIL is set correctly
- Check server logs for errors
- Test with a different recipient email

### Checking Server Logs

View email-related errors in server logs:

```bash
# Docker
docker logs the-beans-server-1 | grep -i "email\|smtp"

# Local development
cd server && npm run dev
# Watch console output for email errors
```

### Verifying Configuration

Check if environment variables are loaded:

```bash
# Inside Docker container
docker exec the-beans-server-1 printenv | grep -E "SMTP|EMAIL"

# Local development
cd server && node -e "
require('dotenv').config();
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('CONTACT_US_EMAIL:', process.env.CONTACT_US_EMAIL);
"
```

## Production Considerations

### Security Best Practices

1. **Never commit credentials**: Keep `.env` files out of version control
2. **Use environment variables**: Set via hosting platform (Render, Railway, etc.)
3. **Rotate credentials**: Change SMTP passwords regularly
4. **Use app-specific passwords**: Never use your main email password

### Deliverability

To improve email deliverability:

1. **Verify your domain**: Use SPF, DKIM, and DMARC records
2. **Use a dedicated email service**: SendGrid, Mailgun for production
3. **Monitor bounce rates**: Set up bounce handling
4. **Avoid spam triggers**: Use professional email content

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// Already implemented in server/src/routes/contact.ts
// Limits contact form submissions to prevent spam
```

### Monitoring

Monitor email delivery:

1. **Server logs**: Check for SMTP errors
2. **Email service dashboards**: Use SendGrid/Mailgun analytics
3. **Bounce notifications**: Set up bounce handling
4. **Delivery confirmations**: Log successful sends

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CONTACT_US_EMAIL` | Yes | - | Email address that receives Contact Us form submissions |
| `ADMIN_EMAIL` | Yes | - | Email address for admin notifications |
| `SMTP_HOST` | Yes | - | SMTP server hostname (e.g., smtp.gmail.com) |
| `SMTP_PORT` | No | 587 | SMTP server port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | Yes | - | SMTP authentication username (usually your email) |
| `SMTP_PASS` | Yes | - | SMTP authentication password (app password or API key) |
| `FRONTEND_URL` | No | http://localhost:3000 | Frontend URL used in email links |

## Code References

Email functionality is implemented in:

- **Email Service**: [server/src/lib/emailService.ts](../server/src/lib/emailService.ts)
- **Contact Route**: [server/src/routes/contact.ts](../server/src/routes/contact.ts)
- **Nodemailer Config**: Configured in emailService.ts

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid SMTP Guide](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Mailgun SMTP Guide](https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp)

## Support

If you encounter issues:

1. Check this documentation for common solutions
2. Review server logs for specific error messages
3. Test email configuration using the test scripts above
4. Consult your email provider's documentation
5. Check [GitHub Issues](https://github.com/thephm/the-beans/issues) for similar problems
