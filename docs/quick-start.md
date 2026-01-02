# Quick Start Guide

Get your Society Management System up and running in minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works)
- Gmail account (for email notifications)

## 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd society-management-app

# Install dependencies
npm install
```

## 2. Environment Setup

Create `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Secret
JWT_SECRET=your_random_32_char_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password
```

💡 **Tip**: See [Configuration Guide](configuration) for detailed environment variable setup.

## 3. Database Setup

### a. Run Schema Migration

1. Go to your Supabase Dashboard → SQL Editor
2. Copy contents from `database/schema.sql`
3. Execute the SQL

### b. Setup Authentication

```bash
# Run in Supabase SQL Editor
# Copy and paste from database/AUTH_MIGRATIONS.sql
```

### c. Create Test Society and Users

```bash
node setup-society.js
```

This creates:

- Test society: "Test Society"
- Admin user: `admin@test.com` / `admin123`
- Manager user: `manager@test.com` / `manager123`
- Member user: `member@test.com` / `member123`

## 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 5. First Login

1. Navigate to `/auth/login`
2. Login with test credentials:
   - **Email**: `admin@test.com`
   - **Password**: `admin123`

## 6. Test Email Notifications

```bash
# Test email configuration
node test-email.js
```

If successful, you'll receive a test email! 📧

## Next Steps

- ✅ [Configure Gmail for production](email-setup)
- ✅ [Learn about user roles and permissions](authentication)
- ✅ [Explore API endpoints](api-reference)
- ✅ [Deploy to production](deployment)

## Troubleshooting

### Login not working?

Make sure you've run:

1. `database/AUTH_MIGRATIONS.sql` in Supabase
2. `node setup-society.js` to create test users

### Email not sending?

1. Check SMTP credentials in `.env.local`
2. Ensure Gmail app password is correct (no spaces)
3. Run `node test-email.js` to diagnose

### Database errors?

Verify:

1. Supabase URL and keys are correct
2. Schema has been applied via `database/schema.sql`
3. RLS policies are configured

---

[← Back to Home](index) | [Next: Authentication →](authentication)
