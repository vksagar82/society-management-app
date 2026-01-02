# 🚀 Deployment Guide - Vercel

Complete guide to deploy the Society Management App to Vercel in production.

## Prerequisites

- ✅ App running locally (`npm run dev` works)
- ✅ All `.env` variables configured
- ✅ GitHub repository with code pushed
- ✅ Vercel account created
- ✅ All service credentials (Supabase, Twilio, Telegram)

## Step-by-Step Deployment

### 1. Prepare for Production

#### Update Environment

```bash
# Update .env.local for production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app  # Update after first deploy
```

#### Verify Database

1. Go to Supabase Dashboard
2. Check all tables exist (run `SELECT * FROM users` should work)
3. Verify RLS policies are in place
4. Note your Project URL and Keys

#### Test Build Locally

```bash
npm run build
npm start
```

Visit http://localhost:3000 and verify everything works.

### 2. Connect to GitHub

If not done already:

```bash
git init
git add .
git commit -m "Initial commit: Society Management App"
git remote add origin https://github.com/your-username/society-management-app.git
git push -u origin main
```

### 3. Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended for First Deploy)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Select your GitHub repository
4. Configure project:
   - **Project Name**: `society-management-app`
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
5. Click "Environment Variables"
6. Add all variables from `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
JWT_SECRET=...
CRON_SECRET=...
NODE_ENV=production
```

7. Click "Deploy"
8. Wait for build to complete (2-5 minutes)
9. You'll get a URL like `https://society-management-app-abc123.vercel.app`

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Confirm directory
# - Link to Vercel account
# - Link to existing project (if re-deploying)
# - Add environment variables when prompted

# View deployment
vercel --prod
```

### 4. Configure Domain

#### Use Vercel's Free Domain

Your app is live at: `https://society-management-app-{random}.vercel.app`

#### Use Custom Domain

1. Go to Project Settings → Domains
2. Enter your domain (e.g., `app.yourdomain.com`)
3. Follow DNS configuration steps
4. Wait for DNS to propagate (1-24 hours)

### 5. Set Production Environment Variables

After first deploy, update `NEXT_PUBLIC_APP_URL`:

1. Go to Project Settings → Environment Variables
2. Edit `NEXT_PUBLIC_APP_URL`
3. Set to: `https://your-domain.vercel.app`
4. Redeploy if needed

### 6. Test Production Deployment

Visit your Vercel URL:

```
https://your-app-name.vercel.app/dashboard
```

✅ Check:

- Dashboard loads
- Navigation works
- Can create issues
- Can add AMCs
- Can add assets

### 7. Configure Cron Jobs

Cron jobs are configured in `vercel.json`:

```json
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
```

**Note:** Crons require Vercel Pro plan. For free tier:

- Crons won't run
- App works fully otherwise
- Manual checks via API are option

## Continuous Deployment

Your app is now **automatically updated** whenever you push to GitHub!

```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push origin main

# Vercel automatically rebuilds and redeploys!
# Check progress at vercel.com dashboard
```

## Monitoring & Maintenance

### View Logs

1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Click "Deployments"
4. Click deployment to see logs

### Monitor Performance

- **Vercel Dashboard**: Analytics tab shows:
  - Page performance
  - API response times
  - Bandwidth usage
  - Error rates

### Database Monitoring

1. Go to Supabase Dashboard
2. Monitor:
   - Database connections
   - Query performance
   - Disk usage
   - Auth logs

### Notification Testing

```bash
# Test WhatsApp from production
curl -X POST https://your-app.vercel.app/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": "test-id",
    "title": "Test Alert",
    "message": "This is a test",
    "channels": ["whatsapp"],
    "recipients": ["user-id"]
  }'
```

## Troubleshooting Deployment

### Build Fails

Check build logs:

1. Go to Vercel Dashboard
2. Click failed deployment
3. Scroll to "Build logs"
4. Common issues:
   - Missing env variables
   - TypeScript errors
   - Import issues

### Environment Variables Not Working

- Verify spelling exactly matches
- No spaces around `=` sign
- `NEXT_PUBLIC_*` vars visible in browser
- Secret vars only on server

### Database Connection Fails

1. Verify credentials in Vercel dashboard
2. Check Supabase firewall settings
3. Ensure database is not paused
4. Check network status at supabase.com

### API Routes Returning 404

- Verify file paths match routes
- Check for typos in filenames
- Ensure route files use `route.ts` not `route.js`

### Notifications Not Sending

1. Test credentials locally first
2. Verify Twilio sandbox is active
3. Check Telegram bot token
4. Review Vercel function logs

## Security Checklist

- [ ] All secrets are in Vercel environment, not code
- [ ] `.env.local` is in `.gitignore`
- [ ] CORS headers configured (if needed)
- [ ] RLS policies enabled in Supabase
- [ ] API routes validate input with Zod
- [ ] Rate limiting considered for public endpoints
- [ ] Domain has HTTPS (automatic with Vercel)

## Performance Optimization

### Database

```sql
-- Run in Supabase SQL Editor
ANALYZE;  -- Optimize query planner
CREATE INDEX idx_issues_society_created
  ON issues(society_id, created_at DESC);
```

### Images

- Compress images before uploading
- Use Next.js `<Image>` component
- Enable image optimization in `next.config.js`

### Caching

- Use Vercel's edge caching
- Configure `Cache-Control` headers
- Use SWR for client-side data fetching

## Rollback Procedure

If something goes wrong:

### Rollback to Previous Version

1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find previous working deployment
4. Click the three dots → "Promote to Production"

### Rollback in Git

```bash
git revert <commit-hash>
git push origin main
# Vercel automatically redeploys
```

## Scaling & Limits

**Vercel Free Plan:**

- Unlimited deployments
- 100 GB bandwidth/month
- Cold boots ~1s
- 3,000 function invocations/month
- **Crons NOT included** (Pro plan required)

**For Production Traffic:**

- Consider Vercel Pro ($20/month)
- Crons support
- Priority support
- 1,000 GB bandwidth/month

## Backup & Disaster Recovery

### Database Backups

Supabase provides:

- Daily backups (free tier)
- Manual backup point creation
- 7-day retention

To backup:

1. Go to Supabase → Backups
2. Click "Request backup"
3. Download if needed

### Restore from Backup

1. Go to Backups tab
2. Select backup date
3. Click "Restore"
4. Confirm (⚠️ This replaces current data)

## Post-Deployment Tasks

- [ ] Test all features in production
- [ ] Send test WhatsApp message
- [ ] Send test Telegram message
- [ ] Verify dashboard loads quickly
- [ ] Check mobile responsiveness
- [ ] Monitor error logs for 24 hours
- [ ] Document any issues
- [ ] Set up monitoring alerts

## Support & Help

**Vercel Issues:**

- Check [Vercel Status](https://vercel.status.page.io/)
- Read [Vercel Docs](https://vercel.com/docs)

**Supabase Issues:**

- Check [Supabase Status](https://status.supabase.com/)
- Read [Supabase Docs](https://supabase.com/docs)

**Twilio Issues:**

- Check [Twilio Status](https://status.twilio.com/)
- Review [Twilio Docs](https://www.twilio.com/docs)

---

**Deployment complete! 🎉**

Your app is now live and automatically updates with each git push.
