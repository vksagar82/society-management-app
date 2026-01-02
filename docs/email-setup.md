---
layout: default
title: Email Setup
---

# Email Setup Guide

Configure Gmail SMTP for automated email notifications.

## Overview

The system sends automated email alerts for:
- 📧 Expired/expiring AMC contracts
- 📧 Issue status updates
- 📧 Asset maintenance reminders

## Gmail App Password Setup

### Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click **2-Step Verification**
3. Follow the prompts to enable it
4. Verify with your phone

⚠️ **Required**: App passwords only work with 2-Step Verification enabled.

### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. If prompted, sign in again
3. Select:
   - **App**: Mail
   - **Device**: Windows Computer (or "Other")
4. Click **Generate**

### Step 3: Copy Password

Google shows a 16-character password like:
```
abcd efgh ijkl mnop
```

**Important**: Remove all spaces when adding to .env.local:
```bash
SMTP_PASS=abcdefghijklmnop
```

---

## Environment Configuration

Add to `.env.local`:

```bash
# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your16charapppassword
```

### Full Example

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=vksagar82@gmail.com
SMTP_PASS=tpxvlttctqsnitmj
```

---

## Testing Email Setup

### Quick Test

Run the test script:

```bash
node test-email.js
```

**Expected Output**:

```
📧 Testing Email Sending via Gmail...

📋 Configuration:
   Host: smtp.gmail.com
   Port: 587
   User: your-email@gmail.com
   Pass: tpxv...

🔄 Sending test email...

✅ Email sent successfully!

📬 Message Details:
   Message ID: <81b0a02b-7818-b02c-a081-1724978eb1ff@gmail.com>
   Response: 250 2.0.0 OK
   To: your-email@gmail.com

💡 Next steps:
   1. Check your email inbox
   2. If you don't see it, check spam folder
   3. System is ready to send AMC expiry alerts!
```

### Check Your Inbox

1. Open Gmail inbox
2. Look for email: **"Test Email from Society Management"**
3. If not in inbox, check **Spam** folder

---

## Troubleshooting

### Error: Invalid login (535-5.7.8)

**Cause**: App password is incorrect or has spaces.

**Solutions**:
1. Regenerate app password at [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Ensure 2-Step Verification is enabled
3. Copy password without spaces to `.env.local`
4. Restart development server

```bash
# Wrong (with spaces)
SMTP_PASS=abcd efgh ijkl mnop

# Correct (no spaces)
SMTP_PASS=abcdefghijklmnop
```

---

### Error: Connection timeout (ETIMEDOUT)

**Cause**: Firewall blocking SMTP port 587.

**Solutions**:
1. Check firewall allows outbound connections to port 587
2. Try alternative port 465 (SSL):
   ```bash
   SMTP_PORT=465
   # Update code: secure: true in transporter
   ```
3. Disable VPN temporarily to test

---

### Error: Self signed certificate

**Cause**: TLS certificate verification issue.

**Solution**: Already handled in code with:
```typescript
tls: {
  rejectUnauthorized: false,
}
```

If still failing, check Node.js version (18+ recommended).

---

### Email not received

**Check**:
1. ✅ Spam/Junk folder
2. ✅ Gmail filters not blocking
3. ✅ `test-email.js` shows success
4. ✅ Correct recipient email in test

**Debug**:
```bash
# Check Gmail activity
https://myaccount.google.com/notifications

# Review "Less secure app access" (should be OFF, use app passwords instead)
```

---

## Email Templates

### AMC Expiry Alert

**Subject**: AMC Expiry Alert - [Vendor Name]

**Template**:
```
Subject: AMC Expiry Alert

Severity: Warning
Type: amc_expiry

The AMC for [Vendor Name] is expiring on [Date]. Please renew the contract in time.
```

**HTML Version**:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
    <h2 style="color: #333; margin-top: 0;">AMC Expiry Alert</h2>
    <div style="color: #666; line-height: 1.6;">
      The AMC for <strong>Star Cool</strong> is expiring on <strong>1/2/2026</strong>.
      <br/>Please renew the contract in time.
    </div>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">
      This is an automated message from Society Management System.
    </p>
  </div>
</div>
```

---

## Alert Triggers

### When Emails are Sent

1. **AMC Creation**: If contract expires within 30 days
   ```typescript
   const daysUntilExpiry = Math.ceil(
     (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
   );
   
   if (daysUntilExpiry <= 30) {
     // Send email to all society admins
   }
   ```

2. **Scheduled Cron**: Daily check at 9 AM UTC
   ```json
   {
     "path": "/api/crons/check-amc-expiry",
     "schedule": "0 9 * * *"
   }
   ```

3. **Issue Updates**: When status changes
4. **Asset Maintenance**: 7 days before due date

---

## Production Configuration

### Use Dedicated Email Account

Create a dedicated Gmail account for production:

```
societyalerts@yourdomain.com
```

**Benefits**:
- Separate from personal email
- Easier to monitor
- Better security isolation

### Email Limits

**Gmail Free Account**:
- 500 emails/day
- 100 recipients per email

**Gmail Workspace**:
- 2000 emails/day
- Better for production

### Alternative SMTP Providers

Consider these for production:

1. **SendGrid** (12,000 free emails/month)
2. **Amazon SES** (62,000 free emails/month)
3. **Mailgun** (5,000 free emails/month)
4. **Postmark** (100 free emails/month)

---

## Code Reference

### Email Service

Location: `src/lib/notifications/notificationService.ts`

```typescript
import nodemailer from "nodemailer";

const getEmailTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const sendEmailNotification = async (
  email: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    const transporter = getEmailTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: subject,
      html: `<!-- HTML template -->`,
      text: message,
    });
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};
```

---

## Testing Checklist

Before deploying to production:

- [ ] Test email sent successfully
- [ ] Email received in inbox (not spam)
- [ ] HTML formatting looks good
- [ ] Links work correctly
- [ ] Unsubscribe option (future)
- [ ] Expired AMC triggers email
- [ ] Multiple recipients work
- [ ] Error handling graceful
- [ ] Production credentials set
- [ ] Rate limits understood

---

## Next Steps

1. ✅ Configure Gmail app password
2. ✅ Test with `node test-email.js`
3. ✅ Create expired AMC to test alert
4. ✅ Set up scheduled cron jobs
5. ✅ Monitor email delivery
6. ✅ Consider production email service

---

[← Deployment](deployment) | [Back to Home](index)
