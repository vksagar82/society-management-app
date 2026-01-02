# Society Management System

<div align="center">

![Build Status](https://github.com/vksagar82/society-management-app/actions/workflows/test.yml/badge.svg)

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)](https://supabase.com/)

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
