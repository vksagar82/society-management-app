---
layout: default
title: Home
---

# Society Management System

A comprehensive web application for managing housing societies, built with Next.js, TypeScript, and Supabase.

## 🚀 Features

- **User Authentication & Authorization**
  - Role-based access control (Admin, Manager, Member)
  - JWT-based authentication
  - Secure password hashing (SHA256)

- **AMC Management**
  - Track annual maintenance contracts
  - Multiple vendor contacts support
  - Automatic expiry alerts via email

- **Asset Management**
  - Maintain inventory of society assets
  - Track maintenance schedules
  - Asset lifecycle management

- **Issue Tracking**
  - Report and track issues
  - Status updates and notifications
  - Priority-based categorization

- **Email Notifications**
  - Gmail SMTP integration
  - Automated alerts for expiring AMCs
  - Issue status updates
  - Asset maintenance reminders

## 📚 Documentation

<div class="doc-grid">
  <div class="doc-card">
    <h3>🏃 <a href="quick-start">Quick Start</a></h3>
    <p>Get up and running in 5 minutes</p>
  </div>

  <div class="doc-card">
    <h3>🔐 <a href="authentication">Authentication</a></h3>
    <p>User roles, permissions, and security</p>
  </div>

  <div class="doc-card">
    <h3>📡 <a href="api-reference">API Reference</a></h3>
    <p>Complete API endpoint documentation</p>
  </div>

  <div class="doc-card">
    <h3>⚙️ <a href="configuration">Configuration</a></h3>
    <p>Environment variables and setup</p>
  </div>

  <div class="doc-card">
    <h3>🚀 <a href="deployment">Deployment</a></h3>
    <p>Deploy to Vercel and production</p>
  </div>

  <div class="doc-card">
    <h3>📧 <a href="email-setup">Email Setup</a></h3>
    <p>Configure Gmail SMTP notifications</p>
  </div>
</div>

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with SHA256 password hashing
- **Email**: Nodemailer with Gmail SMTP
- **Deployment**: Vercel

## 📋 Quick Links

- [GitHub Repository](#)
- [Live Demo](#)
- [Report an Issue](#)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## 📄 License

This project is licensed under the MIT License.

<style>
.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.doc-card {
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 20px;
  background: #f6f8fa;
  transition: transform 0.2s, box-shadow 0.2s;
}

.doc-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.doc-card h3 {
  margin-top: 0;
}

.doc-card a {
  text-decoration: none;
  color: inherit;
}

.doc-card p {
  color: #586069;
  margin-bottom: 0;
}
</style>
