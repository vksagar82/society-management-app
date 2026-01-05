# Password Reset Feature

This document explains how to configure and use the forgot password functionality.

## Features

- **Forgot Password Page**: Users can request a password reset by entering their email
- **Email with Reset Link**: Users receive an email with a secure reset link
- **Reset Password Page**: Users can set a new password using the token from their email
- **Security**: Tokens expire after 1 hour for security

## Setup Instructions

### 1. Database Migration

Run the migration to add reset token fields to your database:

```sql
-- Run this SQL in your Supabase SQL editor or PostgreSQL client
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
```

Or execute the migration file:

```bash
psql -h your-db-host -U your-username -d your-database -f database/add-password-reset.sql
```

### 2. Email Configuration

Add the following environment variables to your `.env.local` file:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Society Management <your-email@gmail.com>

# App URL for reset links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Gmail Setup (Recommended for Testing)

1. Go to your Google Account settings
2. Enable 2-factor authentication if not already enabled
3. Generate an App Password:
   - Go to Security > 2-Step Verification > App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the generated password
4. Use this app password as `SMTP_PASS`

#### Other Email Providers

**SendGrid:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

**Amazon SES:**

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

### 3. Update Production URL

For production deployment, update the `NEXT_PUBLIC_APP_URL`:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Usage

### For Users

1. **Request Password Reset:**

   - Go to login page
   - Click "Forgot your password?"
   - Enter your email address
   - Click "Send reset link"

2. **Check Email:**

   - Open the email from Society Management
   - Click the "Reset Password" button or copy the link

3. **Set New Password:**

   - Enter your new password (minimum 6 characters)
   - Confirm the password
   - Click "Reset password"

4. **Login:**
   - You'll be redirected to the login page
   - Use your new password to sign in

### For Developers

#### API Endpoints

**POST /api/auth/forgot-password**

```json
{
  "email": "user@example.com"
}
```

Response: Always returns success to prevent user enumeration

**POST /api/auth/reset-password**

```json
{
  "token": "reset-token-from-email",
  "password": "newpassword123"
}
```

Response: Success or error message

**POST /api/send-email** (Internal)

```json
{
  "to": "user@example.com",
  "subject": "Email Subject",
  "html": "<p>Email content</p>"
}
```

## Security Features

1. **Token Expiry**: Reset tokens expire after 1 hour
2. **Single Use**: Tokens are cleared after successful password reset
3. **User Enumeration Prevention**: The API doesn't reveal if an email exists
4. **Secure Token Generation**: Uses cryptographically secure random tokens (32 bytes)
5. **Password Hashing**: Passwords are hashed using SHA256

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials**: Verify all environment variables are correct
2. **Check spam folder**: Reset emails might be marked as spam
3. **Enable less secure apps**: For Gmail, ensure app passwords are enabled
4. **Check logs**: Look for email errors in the terminal/console

### Invalid Token Error

1. **Token expired**: Request a new reset email (tokens expire in 1 hour)
2. **Token already used**: Tokens are single-use, request a new one
3. **Database issue**: Ensure the migration was run successfully

### Reset Link Not Working

1. **Check URL**: Ensure `NEXT_PUBLIC_APP_URL` is set correctly
2. **Copy-paste link**: If clicking doesn't work, copy the full URL from email
3. **Clear browser cache**: Try in incognito/private mode

## Email Template Customization

To customize the password reset email template, edit the HTML in:
`src/app/api/auth/forgot-password/route.ts`

```typescript
html: `
  <div style="font-family: Arial, sans-serif;">
    <!-- Your custom email design -->
  </div>
`;
```

## Testing

To test the forgot password flow locally:

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Go to http://localhost:3000/auth/login

3. Click "Forgot your password?"

4. Enter a test user email

5. Check the terminal for the email output (or your email inbox if SMTP is configured)

6. Copy the reset link and open it in your browser

7. Enter a new password and submit

## Files Created

- `src/app/auth/forgot-password/page.tsx` - Forgot password page
- `src/app/auth/reset-password/page.tsx` - Reset password page
- `src/app/api/auth/forgot-password/route.ts` - API endpoint for requesting reset
- `src/app/api/auth/reset-password/route.ts` - API endpoint for resetting password
- `src/app/api/send-email/route.ts` - Email sending utility
- `database/add-password-reset.sql` - Database migration

## Future Enhancements

- Rate limiting for password reset requests
- Email verification for new accounts
- Multi-factor authentication
- Password strength requirements
- Password reset history/audit logging
