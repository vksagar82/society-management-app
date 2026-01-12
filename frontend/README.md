# Society Management Frontend

Modern Next.js 16 frontend application for society management with financial/banking themed UI.

## Tech Stack

- **Framework**: Next.js 16 with App Router & Turbopack
- **React**: React 19
- **TypeScript**: For type safety
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State Management**: Redux Toolkit
- **Forms**: React Hook Form with Zod validation
- **Auth**: localStorage with JWT
- **Charts**: Recharts
- **Tables**: @tanstack/react-table
- **Drag & Drop**: @dnd-kit suite
- **Dates**: react-day-picker, date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running (see backend_fastapi folder)

### Installation

1. Navigate to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

For local development, the `.env.local` file is already configured to use `http://127.0.0.1:8000`

For production, the `.env.production` file uses `https://society-management-app-backend.vercel.app`

### Running the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## Features Implemented

### Authentication Pages

- ✅ Login page with form validation
- ✅ Registration page with password confirmation
- ✅ Forgot password page
- ✅ Redux state management for auth

### Dashboard

- ✅ Protected dashboard layout
- ✅ Responsive sidebar navigation
- ✅ User profile display
- ✅ Statistics cards
- ✅ Quick action buttons

### User Management

- ✅ Users list page with search
- ✅ User cards with status indicators
- ✅ Role and approval status display

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── users/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── layout.tsx         # Root layout with Redux Provider
│   │   ├── page.tsx           # Home page (redirects)
│   │   └── globals.css        # Global styles with theme
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── card.tsx
│   │   └── providers/         # Context providers
│   │       └── ReduxProvider.tsx
│   ├── store/                 # Redux store
│   │   ├── slices/
│   │   │   └── authSlice.ts
│   │   ├── hooks.ts
│   │   └── index.ts
│   └── lib/                   # Utilities
│       ├── api.ts             # API client
│       └── utils.ts           # Helper functions
├── public/                    # Static assets
├── .env.local                 # Local environment variables
├── .env.production            # Production environment variables
├── tailwind.config.ts         # Tailwind configuration
├── next.config.ts             # Next.js configuration
└── package.json
```

## Design System

The application follows a financial/banking theme with:

### Colors

- **Primary**: Blue (#0ea5e9) - Financial trust and stability
- **Background**: White/Dark based on theme
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Destructive**: Red (#ef4444)

### Components

All components use Radix UI primitives with custom styling via Tailwind CSS and class-variance-authority for consistent design.

### Animations

Framer Motion is used for smooth page transitions and micro-interactions.

## API Integration

The app connects to the FastAPI backend using the API client in `src/lib/api.ts`:

- Automatically adds JWT token to requests
- Handles errors consistently
- Supports all HTTP methods (GET, POST, PUT, DELETE, PATCH)

## Authentication Flow

1. User logs in via `/auth/login`
2. JWT tokens stored in localStorage
3. Redux state updated with user info
4. Protected routes check for token
5. User redirected to dashboard
6. Logout clears tokens and redirects to login

## Development Tips

- Use `npm run dev -- --turbopack` for faster development with Turbopack
- Global styles are in `src/app/globals.css`
- Reusable components should go in `src/components/ui/`
- Keep page-specific logic in page components
- Use Redux for global state, React Hook Form for form state

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://society-management-app-backend.vercel.app`
4. Deploy

The app is optimized for Vercel with automatic deployments.

## Next Steps

To extend this application:

1. Add more dashboard pages (societies, issues, settings)
2. Implement role-based access control
3. Add data tables with sorting/filtering
4. Create forms for entity management
5. Add charts and analytics
6. Implement real-time notifications
7. Add internationalization with next-intl

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## License

MIT
