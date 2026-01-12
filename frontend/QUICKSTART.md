# Quick Start Guide

## 🚀 Start Development Server

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000

## 🔐 Test Login

1. Go to http://localhost:3000
2. You'll be redirected to login page
3. Register a new account or use existing credentials
4. After login, you'll see the dashboard

## 📁 Project Layout

- `src/app/auth/*` - Authentication pages
- `src/app/dashboard/*` - Dashboard pages
- `src/components/ui/*` - Reusable UI components
- `src/store/*` - Redux state management
- `src/lib/*` - Utility functions and API client

## 🎨 Adding New Pages

1. Create page in `src/app/[route]/page.tsx`
2. Use existing components from `src/components/ui/`
3. Connect to Redux if needed with `useAppDispatch` and `useAppSelector`
4. Add API calls using `api.get()`, `api.post()`, etc.

## 🔧 Common Commands

```bash
# Development with Turbopack (faster)
npm run dev:turbo

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check

# Lint code
npm run lint
```

## 🌐 Environment Variables

### Local Development (.env.local)

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Production (.env.production)

```
NEXT_PUBLIC_API_URL=https://society-management-app-backend.vercel.app
```

## 📦 Key Dependencies

- **Next.js 16** - Framework
- **React 19** - UI Library
- **Tailwind CSS 4** - Styling
- **Redux Toolkit** - State Management
- **React Hook Form** - Forms
- **Zod** - Validation
- **Radix UI** - Components
- **Framer Motion** - Animations

## 🎯 Available Routes

### Public Routes

- `/` - Home (redirects to auth/dashboard)
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/forgot-password` - Password reset

### Protected Routes (Requires Login)

- `/dashboard` - Main dashboard
- `/dashboard/users` - User management

## 💡 Pro Tips

1. **Use TypeScript** - Get autocomplete and type safety
2. **Reuse Components** - Don't create duplicate UI components
3. **Follow Naming** - Use kebab-case for files, PascalCase for components
4. **Global Styles** - Add global styles to `globals.css`
5. **API Calls** - Always use the `api` client from `lib/api.ts`

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000
```

### Node Modules Issues

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Radix UI](https://www.radix-ui.com/)

## 🎨 Design System

### Colors

Access theme colors using CSS variables:

- `background` - Page background
- `foreground` - Text color
- `primary` - Primary brand color
- `secondary` - Secondary color
- `destructive` - Error/danger color
- `muted` - Muted text
- `accent` - Accent highlights

### Components

All UI components support variants:

```tsx
<Button variant="default | destructive | outline | secondary | ghost | link">
<Button size="default | sm | lg | icon">
```

## 🚀 Deployment Checklist

1. ✅ Update `.env.production` with production API URL
2. ✅ Run `npm run build` to test build
3. ✅ Push code to GitHub
4. ✅ Connect to Vercel
5. ✅ Set environment variables in Vercel
6. ✅ Deploy!

---

Happy coding! 🎉
