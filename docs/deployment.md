---
layout: default
title: Deployment
---

# Deployment Guide

Deploy your Society Management System to production.

## Vercel Deployment (Recommended)

Vercel provides seamless Next.js deployment with zero configuration.

### Prerequisites

- GitHub account
- Vercel account (free tier works)
- Code pushed to GitHub repository

### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Authorize Vercel to access the repo

### Step 2: Configure Project

**Framework Preset**: Next.js (auto-detected)

**Build Settings**:

```bash
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**Root Directory**: `.` (leave as root)

### Step 3: Environment Variables

Add all variables from your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
SUPABASE_JWT_SECRET=your_secret

# JWT
JWT_SECRET=production_secret_32_chars

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=production@gmail.com
SMTP_PASS=production_app_password

# Cron
CRON_SECRET=random_cron_secret
```

⚠️ **Important**: Use **different credentials** for production!

### Step 4: Deploy

Click "Deploy" and wait 2-3 minutes. Vercel will:

- Install dependencies
- Build the application
- Deploy to CDN
- Provide a production URL

### Step 5: Post-Deployment

1. **Test the deployment**:

   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **Run database migrations** (if not done):

   - Execute `database/schema.sql` in Supabase
   - Execute `database/AUTH_MIGRATIONS.sql`

3. **Create production society**:

   ```bash
   # Update setup-society.js with production credentials
   node setup-society.js
   ```

4. **Test email notifications**:
   ```bash
   node test-email.js
   ```

---

## Custom Domain Setup

### Add Custom Domain in Vercel

1. Go to Project Settings → Domains
2. Add your domain: `society.yourdomain.com`
3. Update DNS records as instructed by Vercel

**DNS Configuration** (for Cloudflare/Namecheap):

| Type  | Name    | Value                | TTL  |
| ----- | ------- | -------------------- | ---- |
| CNAME | society | cname.vercel-dns.com | Auto |

Wait 5-10 minutes for DNS propagation.

### Update Environment Variables

Update your application URLs:

```bash
NEXT_PUBLIC_APP_URL=https://society.yourdomain.com
```

---

## Scheduled Cron Jobs

### Using Vercel Cron

Create `vercel.json` in root:

```json
{
  "crons": [
    {
      "path": "/api/crons/check-amc-expiry",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/crons/check-asset-maintenance",
      "schedule": "0 10 * * *"
    }
  ]
}
```

**Schedule Format**: [Cron expression](https://crontab.guru/)

- `0 9 * * *` = Every day at 9:00 AM UTC
- `0 */6 * * *` = Every 6 hours

### Cron Endpoint Authentication

Update cron endpoints to verify secret:

```typescript
const authHeader = req.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

Add `CRON_SECRET` to Vercel environment variables.

---

## Database Production Setup

### Enable Row Level Security (RLS)

Run in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE amcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their society's data
CREATE POLICY "Users see own society"
  ON amcs FOR SELECT
  USING (society_id IN (
    SELECT society_id FROM users WHERE id = auth.uid()
  ));
```

### Database Backups

1. **Supabase Auto-Backups**: Enabled by default (7-day retention on free tier)
2. **Manual Backup**:

   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Export database
   supabase db dump -f backup.sql
   ```

---

## Monitoring & Analytics

### Vercel Analytics

Enable in Vercel Dashboard:

- Real-time analytics
- Performance metrics
- Error tracking

### Application Monitoring

Add error tracking service:

```bash
# Example: Sentry
npm install @sentry/nextjs

# Configure in next.config.ts
```

### Health Check Endpoint

Create `/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
}
```

Monitor: `https://your-app.vercel.app/api/health`

---

## Security Hardening

### 1. Environment Security

```bash
# Generate strong secrets
JWT_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)
```

### 2. HTTPS Only

Add to `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        }
      ]
    }
  ];
}
```

### 3. CORS Configuration

```typescript
// In API routes
const allowedOrigins = [
  "https://society.yourdomain.com",
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : "",
];

const origin = req.headers.get("origin");
if (origin && allowedOrigins.includes(origin)) {
  // Allow request
}
```

### 4. Rate Limiting

Consider using Vercel Edge Middleware:

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Implement rate limiting logic
  const ip = request.ip ?? "127.0.0.1";
  // Check redis/kv for rate limits

  return NextResponse.next();
}
```

---

## Performance Optimization

### 1. Image Optimization

Use Next.js Image component:

```tsx
import Image from "next/image";

<Image src="/logo.png" alt="Logo" width={200} height={200} priority />;
```

### 2. Code Splitting

```tsx
// Lazy load components
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <p>Loading...</p>,
});
```

### 3. Database Indexes

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_amcs_society_id ON amcs(society_id);
CREATE INDEX idx_amcs_end_date ON amcs(contract_end_date);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_users_email ON users(email);
```

---

## Backup & Disaster Recovery

### Database Backup Strategy

1. **Daily automated backups** (Supabase handles this)
2. **Weekly manual exports**:
   ```bash
   supabase db dump > backup-$(date +%Y%m%d).sql
   ```
3. **Store backups in S3/Cloud Storage**

### Application State Backup

- Environment variables documented
- GitHub repository as source of truth
- Vercel automatic deployments from git

### Recovery Plan

1. Restore database from Supabase backup
2. Redeploy from GitHub (automatic via Vercel)
3. Verify environment variables
4. Test critical paths

---

## Troubleshooting

### Build Failures

**Check**:

- All dependencies in `package.json`
- No TypeScript errors (`npm run build` locally)
- Environment variables set in Vercel

### Runtime Errors

**Check Vercel Logs**:

- Dashboard → Your Project → Deployments → Latest → Runtime Logs
- Look for error stack traces

### Database Connection Issues

**Check**:

- Supabase project not paused
- Correct connection strings
- RLS policies not blocking queries

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Email credentials tested
- [ ] Security review completed

### Deployment

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Domain configured (if custom)
- [ ] Cron jobs configured
- [ ] Database migrations run

### Post-Deployment

- [ ] Health check endpoint responding
- [ ] Login/signup working
- [ ] Email notifications sending
- [ ] Database connections stable
- [ ] Analytics tracking
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented

---

[← Configuration](configuration) | [Next: Email Setup →](email-setup)
