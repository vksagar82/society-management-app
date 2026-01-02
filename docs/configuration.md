---
layout: default
title: Configuration
---

# Configuration Guide

Complete environment variable setup and configuration options.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Supabase Configuration

```bash
# Supabase Project URL
NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (Public)
NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_ANON_KEY=your_anon_key_here

# Supabase Service Role Key (Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Supabase JWT Secret
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

**Where to find these**:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the values

---

### PostgreSQL Database

```bash
# PostgreSQL Connection (for direct database access)
POSTGRES_DATABASE=postgres
POSTGRES_HOST=db.your-project.supabase.co
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_db_password
```

⚠️ **Note**: Usually not needed as Supabase client handles connections.

---

### JWT Authentication

```bash
# JWT Secret for token signing (32+ random characters)
JWT_SECRET=your_random_32_character_secret_here_change_in_production
```

**Generate a secure secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Email Configuration (Gmail SMTP)

```bash
# SMTP Server Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Gmail Credentials
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_16_char_app_password
```

📧 **Important**: Use Gmail App Password, not your regular password!

**How to get Gmail App Password**:
1. Go to [Google Account Settings](https://myaccount.google.com)
2. Security → 2-Step Verification (must be enabled)
3. App passwords → Select "Mail" and "Other (Custom name)"
4. Copy the 16-character password (remove spaces)

---

### Cron Job Secret (Optional)

```bash
# Secret for authenticating cron job requests
CRON_SECRET=your_cron_secret_here
```

Only needed if deploying scheduled jobs on Vercel or similar platforms.

---

## Complete .env.local Template

```bash
# ====================================
# SUPABASE CONFIGURATION
# ====================================
NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL=https://cbhroejkykzifqysbuhz.supabase.co
NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your_jwt_secret...

# ====================================
# POSTGRESQL DATABASE
# ====================================
POSTGRES_DATABASE=postgres
POSTGRES_HOST=db.cbhroejkykzifqysbuhz.supabase.co
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_db_password

# ====================================
# JWT AUTHENTICATION
# ====================================
JWT_SECRET=your_random_32_character_secret_here

# ====================================
# EMAIL CONFIGURATION (GMAIL SMTP)
# ====================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your16charapppass

# ====================================
# CRON JOB AUTHENTICATION (OPTIONAL)
# ====================================
CRON_SECRET=your_cron_secret_here

# ====================================
# NODE ENVIRONMENT
# ====================================
NODE_ENV=development
```

---

## Application Configuration

### Database Schema

Run these SQL files in Supabase SQL Editor in order:

1. **database/schema.sql** - Main database schema
2. **database/AUTH_MIGRATIONS.sql** - Authentication fields and test users

### Initial Setup Script

```bash
# Creates test society and assigns users
node setup-society.js
```

This creates:
- Society: "Test Society"
- Users: admin@test.com, manager@test.com, member@test.com

---

## Feature Flags (Future)

Consider adding feature flags for controlling features:

```bash
# Enable/disable features
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_ANALYTICS=true
```

---

## Security Checklist

### Development

- ✅ Use `.env.local` for sensitive data
- ✅ Never commit `.env.local` to git
- ✅ Use different credentials for dev/prod
- ✅ Enable CORS only for your domain

### Production

- ✅ Rotate all secrets and passwords
- ✅ Use strong JWT_SECRET (32+ characters)
- ✅ Enable Supabase Row Level Security (RLS)
- ✅ Use environment variables in Vercel
- ✅ Enable HTTPS only
- ✅ Set up proper CORS headers
- ✅ Use production-grade email service
- ✅ Enable rate limiting

---

## Vercel Environment Variables

When deploying to Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env.local`
3. Set appropriate environments: Production, Preview, Development

**Variable Types**:
- `NEXT_PUBLIC_*` → Available to browser
- Others → Server-side only (more secure)

---

## Troubleshooting

### Database Connection Failed

**Check**:
- Supabase URL is correct
- ANON_KEY and SERVICE_ROLE_KEY are valid
- Project is not paused (Supabase free tier)

### Email Not Sending

**Check**:
- Gmail app password has no spaces
- 2-Step Verification enabled in Google account
- SMTP_USER and SMTP_PASS are correct
- Run `node test-email.js` to diagnose

### JWT Token Invalid

**Check**:
- JWT_SECRET is set and same across requests
- Token hasn't expired (7-day limit)
- Token format is correct (base64url encoded)

### CORS Errors

**Check**:
- Supabase URL includes `https://`
- API routes don't have hardcoded localhost URLs
- Vercel environment variables are set correctly

---

[← API Reference](api-reference) | [Next: Deployment →](deployment)
