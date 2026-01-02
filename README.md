# Society Management System

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

**A comprehensive web application for managing residential societies with role-based access control, automated notifications, and real-time tracking.**

[📚 Documentation](https://vksagar82.github.io/society-management-app/) • [🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [🛠️ Tech Stack](#-tech-stack)

</div>

---

## 📚 Documentation

> **Complete documentation is available on GitHub Pages:**
>
> ### **[https://vksagar82.github.io/society-management-app/](https://vksagar82.github.io/society-management-app/)**

The documentation includes:

- **Quick Start Guide** - Get running in 5 minutes
- **Authentication & Authorization** - User roles, JWT, and security
- **API Reference** - Complete endpoint documentation
- **Configuration Guide** - Environment setup
- **Deployment Guide** - Production deployment to Vercel
- **Email Setup** - Gmail SMTP integration

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Authentication & Security

- Role-based access control (Admin/Manager/Member)
- JWT-based authentication
- SHA256 password hashing
- Secure session management

### 📊 Society Management

- Real-time dashboard with metrics
- Multi-society support
- User management with permissions
- Activity tracking and audit logs

</td>
<td width="50%">

### 📋 Operations

- AMC contract tracking with expiry alerts
- Asset inventory management
- Issue/complaint tracking system
- Automated maintenance scheduling

### 📧 Notifications

- Email alerts via Gmail SMTP
- Automatic expiry reminders
- Issue status updates
- Custom notification templates

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer              | Technology                                   |
| ------------------ | -------------------------------------------- |
| **Frontend**       | Next.js 14+, React, TypeScript, Tailwind CSS |
| **Backend**        | Next.js API Routes (Server-side)             |
| **Database**       | Supabase (PostgreSQL)                        |
| **Authentication** | JWT with SHA256                              |
| **Email**          | Nodemailer + Gmail SMTP                      |
| **Deployment**     | Vercel                                       |
| **Testing**        | Jest, Node.js Scripts                        |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- Supabase account ([Sign up free](https://supabase.com/))
- Gmail account for notifications

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/vksagar82/society-management-app.git
cd society-management-app

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# 4. Setup database (Run in Supabase SQL Editor)
# - Execute: database/schema.sql
# - Execute: database/AUTH_MIGRATIONS.sql

# 5. Create test data
node setup-society.js

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Test Accounts

| Role    | Email            | Password   |
| ------- | ---------------- | ---------- |
| Admin   | admin@test.com   | admin123   |
| Manager | manager@test.com | manager123 |
| Member  | member@test.com  | member123  |

⚠️ **Change these credentials in production!**

---

## 📖 Full Documentation

For complete setup instructions, API documentation, and deployment guides, visit:

### **[📚 GitHub Pages Documentation](https://vksagar82.github.io/society-management-app/)**

---

## 📦 Project Structure

```
society-management-app/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard
│   │   ├── amcs/         # AMC management
│   │   ├── assets/       # Asset tracking
│   │   └── issues/       # Issue reporting
│   ├── components/       # Reusable components
│   └── lib/              # Utilities and services
│       ├── auth/         # Auth context & utils
│       ├── supabase/     # Database client
│       └── notifications/ # Email service
├── database/             # SQL schema and migrations
├── docs/                 # GitHub Pages documentation
└── public/               # Static assets
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)
- Email via [Nodemailer](https://nodemailer.com/)

---

<div align="center">

**[⬆ Back to Top](#society-management-system)**

Made with ❤️ for better society management

</div>
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
