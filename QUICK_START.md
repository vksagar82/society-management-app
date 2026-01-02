# 🚀 Quick Start Guide

Get the Society Management App up and running in 10 minutes!

## Step 1: Initial Setup (2 minutes)

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local
```

## Step 2: Configure Services (5 minutes)

### Get Supabase Credentials

1. Visit [supabase.com](https://supabase.com)
2. Create new project
3. Copy URL and keys to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Create Database

1. In Supabase → SQL Editor
2. Create new query
3. Copy-paste entire `database/schema.sql`
4. Click "Run"

### Get Twilio WhatsApp (Optional but recommended)

1. Sign up at [twilio.com](https://twilio.com)
2. Get Account SID and Auth Token
3. Activate WhatsApp sandbox
4. Add to `.env.local`:

```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1xxxxxxxxxx
WHATSAPP_RECEIVER_ID=whatsapp:+91xxxxxxxxxx
```

### Get Telegram Bot (Optional)

1. Open Telegram, message @BotFather
2. Send `/newbot`
3. Follow prompts, get bot token
4. Add to `.env.local`:

```env
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
```

## Step 3: Run Locally (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

✅ You should see the Dashboard!

## Step 4: Test Features (2 minutes)

### Test Dashboard

- Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- See statistics cards load

### Test Issues

- Click "Issues" in navigation
- Click "+ Report Issue"
- Fill form and submit
- Issue appears in list

### Test AMCs

- Click "AMCs" in navigation
- Click "+ Add AMC"
- Fill form and submit
- AMC appears in list

### Test Assets

- Click "Assets" in navigation
- Click "+ Add Asset"
- Fill form and submit
- Asset appears in list

## Step 5: Deploy to Vercel (5 minutes)

### Push to GitHub

```bash
git add .
git commit -m "Initial commit: Society Management App"
git push origin main
```

### Deploy

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your repository
4. In "Environment Variables" add all from `.env.local`
5. Click "Deploy"

✅ App is live! Copy your Vercel URL

## 📝 Important Notes

### Environment Variables

- **NEVER commit `.env.local`** - Already in .gitignore
- Copy sample: `cp .env.local.example .env.local`
- Fill in YOUR credentials

### Database

- Run schema.sql only ONCE
- Creates 12 tables with relationships
- Includes RLS security policies

### Phone Numbers

- WhatsApp format: `+{country_code}{number}`
- Example: `+919876543210`
- Telegram: Just numeric chat ID

## 🧪 Full Feature List

| Feature          | File                     | Status                 |
| ---------------- | ------------------------ | ---------------------- |
| Dashboard        | `/src/app/dashboard`     | ✅ Ready               |
| Issue Reporting  | `/src/app/issues`        | ✅ Ready               |
| AMC Tracking     | `/src/app/amcs`          | ✅ Ready               |
| Asset Management | `/src/app/assets`        | ✅ Ready               |
| API Routes       | `/src/app/api/*`         | ✅ Ready               |
| WhatsApp Alerts  | `/src/lib/notifications` | ✅ Ready               |
| Telegram Alerts  | `/src/lib/notifications` | ✅ Ready               |
| Scheduled Crons  | `/src/app/api/crons/*`   | ✅ Ready (Vercel only) |
| Database Schema  | `/database/schema.sql`   | ✅ Ready               |
| Vercel Config    | `vercel.json`            | ✅ Ready               |

## 🆘 Troubleshooting

### "Cannot find module '@supabase/supabase-js'"

```bash
npm install @supabase/supabase-js axios zod react-hook-form
```

### "Supabase URL is missing"

Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL=...`

### "Twilio sending fails"

- Verify phone format: `whatsapp:+19876543210`
- Check Twilio sandbox is activated
- Confirm number is in sandbox participants

### "Port 3000 in use"

```bash
npm run dev -- -p 3001
```

### Build errors on Vercel

- Verify ALL env vars in Vercel dashboard
- Check branch deployment settings
- Review build logs

## 📚 Learn More

- **Architecture**: See `README.md`
- **Configuration**: See `CONFIGURATION.md`
- **API Docs**: See API routes in `/src/app/api`
- **Database**: See `database/schema.sql`

## 🎯 Next Steps

1. ✅ Setup complete! Local dev works
2. ✅ Test features locally
3. ✅ Deploy to Vercel
4. ✅ Test in production
5. ⏭️ Customize branding
6. ⏭️ Add more features
7. ⏭️ Invite users

## 💡 Tips

- Use browser DevTools to debug
- Check Vercel logs for production issues
- Test notifications with test messages first
- Keep `.env.local` file safe
- Update dependencies regularly: `npm update`

## 📞 Support

- Check `CONFIGURATION.md` for detailed setup
- Review `README.md` for feature docs
- Check browser console for client errors
- Check terminal for server errors

---

**Happy coding! 🎉**
