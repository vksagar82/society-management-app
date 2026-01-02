# Society Management App

A comprehensive web application for managing housing societies with authentication, AMC tracking, asset management, and automated email notifications.

## 📚 Complete Documentation

👉 **[View Full Documentation](docs/)** - GitHub Pages site with comprehensive guides

Quick links:

- 🚀 [Quick Start](docs/quick-start.md) - Get running in 5 minutes
- 🔐 [Authentication](docs/authentication.md) - User roles, JWT, security
- 📡 [API Reference](docs/api-reference.md) - Complete API documentation
- ⚙️ [Configuration](docs/configuration.md) - Environment variables
- 🌐 [Deployment](docs/deployment.md) - Production deployment guide
- 📧 [Email Setup](docs/email-setup.md) - Gmail SMTP configuration

## 🚀 Features

### Core Functionality

- **User Authentication**: Role-based access control (Admin, Manager, Member)
- **Dashboard**: Real-time overview of all society metrics
- **Issue Tracking**: Report, assign, and track maintenance issues
- **AMC Management**: Track annual maintenance contracts with automatic expiry alerts
- **Asset Management**: Comprehensive asset inventory with maintenance schedules
- **Email Notifications**: Automated alerts via Gmail SMTP

### Technical Stack

- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with SHA256 password hashing
- **Email**: Nodemailer with Gmail SMTP
- **Deployment**: Vercel

## 📋 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Gmail account (for notifications)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd society-management-app

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run database migrations in Supabase
# Execute: database/schema.sql
# Execute: database/AUTH_MIGRATIONS.sql

# Create test society and users
node setup-society.js

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default Test Accounts**:

- Admin: `admin@test.com` / `admin123`
- Manager: `manager@test.com` / `manager123`
- Member: `member@test.com` / `member123`

## 🛠️ Configuration

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

**Required environment variables:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
WHATSAPP_RECEIVER_ID=whatsapp:+target_phone_number

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Other
JWT_SECRET=your_jwt_secret_key
CRON_SECRET=your_cron_secret_key
NODE_ENV=development
```

### 3. Set up Supabase Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and create a new query
3. Copy and run the SQL from `database/schema.sql`
4. This creates all necessary tables with proper relationships and indexes

### 4. Configure Twilio (WhatsApp)

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get Account SID and Auth Token
3. Activate WhatsApp Sandbox
4. Get your WhatsApp-enabled number
5. Add credentials to `.env.local`

### 5. Configure Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Create a new bot with `/newbot`
3. Get the bot token
4. Send a message to your bot and get your chat ID
5. Add to `.env.local`

## 🚀 Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Build & Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # REST API routes
│   │   ├── amcs/        # AMC CRUD endpoints
│   │   ├── issues/      # Issue CRUD endpoints
│   │   ├── assets/      # Asset CRUD endpoints
│   │   ├── alerts/      # Notification endpoints
│   │   └── crons/       # Scheduled background tasks
│   ├── dashboard/       # Analytics dashboard
│   ├── issues/          # Issue reporting UI
│   ├── amcs/            # AMC management UI
│   ├── assets/          # Asset tracking UI
│   ├── layout.tsx       # Root layout with navigation
│   └── page.tsx         # Home page redirector
├── components/          # Reusable React components
│   ├── Badge.tsx        # Status/Priority badges
│   └── Form.tsx         # Generic form component
├── lib/
│   ├── supabase/       # Supabase client factory
│   └── notifications/  # WhatsApp/Telegram services
└── types/              # TypeScript interfaces

database/
└── schema.sql          # PostgreSQL schema with 12 tables
```

## 📊 API Endpoints

### AMCs (Annual Maintenance Contracts)

```
GET  /api/amcs?society_id={id}          # List all AMCs
POST /api/amcs                          # Create new AMC
```

### Issues

```
GET  /api/issues?society_id={id}&status={status}  # List issues
POST /api/issues                                  # Report new issue
```

### Assets

```
GET  /api/assets?society_id={id}&status={status}  # List assets
POST /api/assets                                  # Add new asset
```

### Alerts

```
GET  /api/alerts?society_id={id}        # List alerts
POST /api/alerts                        # Create & send alert
```

## 🔄 Automated Tasks (Cron Jobs)

Configured in `vercel.json` and run on Vercel servers:

### Daily at 9 AM UTC - AMC Expiry Check

- Identifies AMCs expiring within 30 days
- Sends WhatsApp/Telegram alerts to society admins
- Creates alert records in database

### Daily at 10 AM UTC - Asset Maintenance Check

- Checks for upcoming scheduled maintenance
- Alerts facility managers
- Maintains maintenance history

## 🔐 Security & Best Practices

- ✅ Environment variables for all secrets
- ✅ Row Level Security (RLS) in Supabase
- ✅ Zod validation on all API inputs
- ✅ TypeScript for type safety
- ✅ API route handlers with error handling
- ✅ HTTPS for all external communications

## 🎨 User Interface

### Dashboard (`/dashboard`)

- Real-time statistics cards
- Quick action buttons
- System health status

### Issues (`/issues`)

- Create/report new issues
- Filter by status (open, in_progress, resolved)
- Priority level indicators
- Assignment tracking

### AMCs (`/amcs`)

- Add maintenance contracts
- Track expiry dates (visual countdown)
- Vendor contact information
- Annual cost tracking

### Assets (`/assets`)

- Asset inventory management
- Category filtering
- Warranty tracking
- Maintenance scheduling

## 📦 Key Dependencies

```json
{
  "next": "^15.0",
  "react": "^19.0",
  "@supabase/supabase-js": "^2.0",
  "axios": "^1.6",
  "zod": "^3.0",
  "react-hook-form": "^7.0",
  "tailwindcss": "^3.0"
}
```

## 🚀 Deploy to Vercel

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Add society management app"
git push
```

### 2. Deploy

1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set environment variables in Vercel dashboard:
   - All NEXT*PUBLIC*\* and SECRET variables
   - CRON_SECRET for scheduled tasks
4. Deploy!

### 3. Post-Deployment

- Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
- Test notifications with a test message
- Monitor logs in Vercel dashboard

## 📊 Database Schema

**12 Tables with proper relationships:**

- `users` - Society members with roles
- `societies` - Society profiles
- `amcs` - Annual maintenance contracts
- `issues` - Maintenance issues/complaints
- `issue_comments` - Issue discussion history
- `assets` - Property assets
- `asset_maintenance` - Maintenance records
- `alerts` - Notification history
- `notification_preferences` - User alert settings
- `dashboard_stats` - Performance cache
- `audit_logs` - Activity tracking

## 🐛 Troubleshooting

**WhatsApp not sending?**

- Verify phone number format (international with +)
- Check Twilio sandbox is activated
- Confirm numbers are in sandbox participants

**Telegram alerts failing?**

- Validate bot token format
- Ensure chat ID is correct
- Check bot has permission to send messages

**Database connection errors?**

- Verify Supabase credentials
- Check firewall allows connections
- Ensure service role key has admin permissions

## 📄 License

MIT

## 🎯 Next Steps

1. Complete environment variable configuration
2. Set up Supabase project and run schema.sql
3. Configure Twilio and Telegram
4. Test locally with `npm run dev`
5. Deploy to Vercel

## 📞 Support

For issues or questions:

- Check the troubleshooting section
- Review logs in Supabase Dashboard
- Check Vercel deployment logs

# or

pnpm dev

# or

bun dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
```
