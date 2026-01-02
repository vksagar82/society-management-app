# Configuration Guide

This guide helps you set up all required services for the Society Management App.

## 1. Supabase Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Enter project name (e.g., "society-management")
4. Set a strong database password
5. Select your region closest to users
6. Wait for project creation

### Get Credentials

1. Go to Project Settings → API
2. Copy these values to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` - Copy from "Project URL"
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Copy from "anon public" key
   - `SUPABASE_SERVICE_ROLE_KEY` - Copy from "service_role" key (keep this SECRET!)

### Create Database Schema

1. Go to SQL Editor
2. Create new query
3. Paste entire content from `database/schema.sql`
4. Click "Run"
5. Verify all tables are created

## 2. Twilio Setup (WhatsApp Notifications)

### Create Twilio Account

1. Go to [twilio.com](https://www.twilio.com/) and sign up
2. Verify your phone number
3. Choose "Messaging" as use case

### Get WhatsApp Number

1. Go to Messaging → WhatsApp
2. Click "Try WhatsApp"
3. Accept sandbox terms
4. Get your WhatsApp number (format: whatsapp:+1415...)

### Get Credentials

1. Go to Account → Settings
2. Copy these to `.env.local`:
   - `TWILIO_ACCOUNT_SID` - Copy from Account SID
   - `TWILIO_AUTH_TOKEN` - Copy from Auth Token
   - `TWILIO_WHATSAPP_NUMBER` - The WhatsApp number assigned to you

### Test WhatsApp

1. Save your Twilio number as a contact
2. Send "join {phrase}" to your Twilio WhatsApp number
3. You'll receive confirmation message

## 3. Telegram Bot Setup

### Create Bot

1. Open Telegram app or visit [web.telegram.org](https://web.telegram.org)
2. Search for **@BotFather**
3. Send `/newbot`
4. Follow prompts:
   - Enter bot name (e.g., "Society Manager Bot")
   - Enter bot username (e.g., "society_manager_bot")
5. Copy the token provided (e.g., `123456789:ABCDefGhIjKlMnOpQrStUvWxYz...`)

### Get Chat ID

1. Open Telegram and search for your bot
2. Send `/start` to your bot
3. In browser console or using [getidsbot](https://t.me/userinfobot), get your chat ID
4. Alternative: Use [this endpoint](https://api.telegram.org/bot{token}/getUpdates) to see messages

### Add to .env.local

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

## 4. Vercel Setup (Deployment)

### Connect GitHub

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project"
3. Select your GitHub repository
4. Vercel will auto-detect Next.js

### Set Environment Variables

1. Go to Project Settings → Environment Variables
2. Add all from `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   TWILIO_ACCOUNT_SID
   TWILIO_AUTH_TOKEN
   TWILIO_WHATSAPP_NUMBER
   TELEGRAM_BOT_TOKEN
   TELEGRAM_CHAT_ID
   JWT_SECRET
   CRON_SECRET
   NODE_ENV=production
   ```
3. Click Deploy

### Configure Crons

Cron jobs are automatically configured from `vercel.json`:

- Daily 9 AM - Check AMC expiry
- Daily 10 AM - Check asset maintenance

## 5. Phone Number Formatting

### Twilio WhatsApp Numbers

Format: `whatsapp:+{country_code}{number}`

Examples:

```
whatsapp:+12125551234        # USA
whatsapp:+919876543210       # India
whatsapp:+442071838750       # UK
whatsapp:+33123456789        # France
```

### Telegram Chat IDs

Numeric ID or username, examples:

```
123456789                    # Direct chat ID
-987654321                   # Group chat ID
```

## 6. Testing Notifications

### Test WhatsApp

```javascript
// Call from your app
const { success } = await sendWhatsAppMessage(
  "919876543210",
  "🔔 Test notification from Society Manager"
);
```

### Test Telegram

```javascript
// Call from your app
const { success } = await sendTelegramMessage(
  "123456789",
  "🔔 <b>Test notification</b> from Society Manager"
);
```

## 7. Environment Variables Reference

Create `.env.local` with all these variables:

```env
# === SUPABASE (Database) ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === TWILIO (WhatsApp) ===
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+1415xxxxxxx
WHATSAPP_RECEIVER_ID=whatsapp:+91xxxxxxxxxx

# === TELEGRAM ===
TELEGRAM_BOT_TOKEN=123456789:ABCDefGhIjKlMnOpQrStUvWxYz1234567890
TELEGRAM_CHAT_ID=987654321

# === APPLICATION ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this
CRON_SECRET=your-cron-secret-key-change-this

# === OPTIONAL: BLOB STORAGE ===
BLOB_READ_WRITE_TOKEN=your_blob_token
NEXT_PUBLIC_BLOB_URL=your_blob_url

# === OPTIONAL: EMAIL ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🧪 Quick Test Checklist

- [ ] `npm run dev` starts without errors
- [ ] Dashboard loads with mock data
- [ ] Can create an issue through UI
- [ ] Can add an AMC
- [ ] Can add an asset
- [ ] WhatsApp test message sends (check logs)
- [ ] Telegram test message receives in Telegram
- [ ] Can deploy to Vercel
- [ ] Production app works at vercel domain

## 🆘 Common Issues

| Issue                        | Solution                                         |
| ---------------------------- | ------------------------------------------------ |
| "Supabase URL not found"     | Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` |
| "Twilio credentials invalid" | Verify Account SID and Auth Token (no spaces)    |
| "Telegram message failed"    | Check bot token format and chat ID               |
| "WhatsApp not activated"     | Must send "join {phrase}" first to activate      |
| "Port 3000 already in use"   | Change port: `npm run dev -- -p 3001`            |
| "Build fails on Vercel"      | Check all env vars are set in Vercel dashboard   |

## 📞 Getting Help

- **Supabase Issues**: Check Supabase dashboard logs
- **Twilio Issues**: Check Twilio console messages/logs
- **Telegram Issues**: Check bot message history
- **App Issues**: Check browser console and terminal logs

## 🔒 Security Reminders

⚠️ **IMPORTANT:**

- Never commit `.env.local` to git
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Rotate `JWT_SECRET` in production
- Use strong `CRON_SECRET`
- In Vercel, use branch protection rules
- Enable 2FA on all service accounts
