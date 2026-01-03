# Mobile-Responsive Architecture Guide

## Overview

The application has been redesigned with a mobile-first approach featuring:

- **Collapsible Sidebar Navigation** with pin feature for desktop
- **Responsive Layout** that adapts to mobile, tablet, and desktop screens
- **Separate Admin Module** with protected access
- **Mobile-Optimized Components** with touch-friendly interactions

## Key Changes

### 1. Sidebar Navigation (`src/components/Sidebar.tsx`)

- **Desktop (md and above)**: Full sidebar visible by default (pinned)
- **Desktop (md and above)**: Can toggle collapse/expand, with pin option
- **Mobile (below md)**: Hidden by default, toggles with FAB button
- **Mobile**: Overlay appears when open, closes on navigation (unless pinned)
- **Icon Labels**: Hidden on collapsed state, shown on expanded
- **Responsive Width**:
  - Expanded: `w-64` (256px)
  - Collapsed: `w-20` (80px) - desktop only
  - Mobile: Always `w-64` when open

### 2. Main Layout (`src/components/MainLayout.tsx`)

- Wraps content with sidebar
- Only shows sidebar for authenticated users
- Responsive padding: `p-4` mobile, `md:p-8` desktop
- Flexbox layout for proper sizing

### 3. Navigation Bar (`src/components/NavBar.tsx`)

- **Mobile-only** (hidden on md and above)
- Shows app logo and user profile
- Sticky positioning
- Blue color scheme (#3B82F6)

### 4. Admin Module

**New Directory**: `src/app/admin/`

```
admin/
├── layout.tsx          # Admin layout wrapper
├── page.tsx            # Admin dashboard
└── AdminLayout.tsx     # Admin protection component
```

- Protected by `AdminLayout` component
- Redirects non-admin users
- Separate dashboard with admin-specific controls

## Responsive Breakpoints

| Breakpoint | Size    | Device        |
| ---------- | ------- | ------------- |
| base       | 0-639px | Mobile        |
| sm         | 640px+  | Small mobile  |
| md         | 768px+  | Tablet        |
| lg         | 1024px+ | Desktop       |
| xl         | 1280px+ | Large desktop |

## Sidebar Behavior

### Mobile (< 768px)

```
┌─────────────────────────┐
│ NavBar (blue header)    │
├─────────────────────────┤
│                         │
│   Main Content          │
│                         │
│          [FAB Button]   │
└─────────────────────────┘

When FAB clicked:
┌─────────────────────────┐
│ Sidebar (overlay)       │
│ × [close button]        │
│ - Dashboard             │
│ - Issues                │
│ - AMCs                  │
│ - Assets                │
│ - Users (admin)         │
│ 👤 Profile              │
└─────────────────────────┘
```

### Desktop (≥ 768px)

```
┌──────────┬──────────────────────────┐
│ Sidebar  │                          │
│ (pinned) │    Main Content          │
│          │                          │
│ - Dash   │                          │
│ - Issues │                          │
│ - AMCs   │                          │
│ - Assets │                          │
│ - Users  │                          │
│ 👤 Prof  │                          │
└──────────┴──────────────────────────┘
```

### Desktop Unpinned (≥ 768px)

```
┌─┐┌────────────────────────────────┐
│□││    Main Content                 │
│─││                                 │
│D│├──────────────────────────────────┤
│a││ Sidebar (collapsed w-20)         │
│s││ 📊                               │
│h││ 🔧                               │
│ ││ 📋                               │
└─┘└────────────────────────────────┘
Icons only on hover/active
```

## Navigation Items

All items are in `src/components/Sidebar.tsx` in the `NAV_ITEMS` array:

```tsx
const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/issues", label: "Issues", icon: "🔧" },
  { href: "/amcs", label: "AMCs", icon: "📋" },
  { href: "/assets", label: "Assets", icon: "📦" },
  { href: "/users", label: "Users", icon: "👥", adminOnly: true },
];
```

## Mobile-Optimized Features

### Touch-Friendly Elements

- Minimum touch target size: 44x44px (buttons, links)
- Adequate spacing between interactive elements
- No hover-dependent features on mobile

### Performance

- CSS transitions for smooth animations
- Efficient state management
- Responsive images support ready

### Accessibility

- Semantic HTML structure
- ARIA labels for sidebar toggle
- Proper heading hierarchy
- Color contrast compliance

## Styling Utilities

### Responsive Classes in `src/lib/responsive/utils.ts`

```tsx
RESPONSIVE_CLASSES = {
  container: "mx-auto px-4 sm:px-6 lg:px-8",
  gridAuto: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  card: "bg-white rounded-lg shadow-md p-4 sm:p-6",
  button: "px-4 py-2 rounded-lg font-medium transition-colors",
  input:
    "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500",
};
```

### Responsive Hooks

```tsx
// Detect mobile screen
const isMobile = useIsMobile();

// Get current screen size
const screenSize = useScreenSize(); // returns 'mobile' | 'tablet' | 'desktop'
```

## CSS Enhancements

### Mobile-First Approach

All base styles are for mobile, then enhanced with:

- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+

### Key CSS Additions

- Scrollbar styling (desktop optimized)
- Input focus size fix (prevents zoom on iOS)
- Touch target minimum size
- Smooth scroll on desktop
- Animation utilities (slide-in/out)

## Usage Examples

### Using Responsive Classes

```tsx
export default function MyPage() {
  return (
    <div className={RESPONSIVE_CLASSES.container}>
      <div className={RESPONSIVE_CLASSES.gridAuto}>
        <div className={RESPONSIVE_CLASSES.card}>{/* Content */}</div>
      </div>
    </div>
  );
}
```

### Using Mobile Hook

```tsx
"use client";

import { useIsMobile } from "@/lib/responsive/utils";

export function MyComponent() {
  const isMobile = useIsMobile();

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

## Admin Module Access

### For Admins

Navigate to `/admin` to access the admin dashboard with:

- System-wide statistics
- User management
- Activity logs
- System alerts
- Configuration controls

### Admin-Only Navigation

The sidebar automatically shows/hides the "Users" link based on admin status via `isAdmin()` permission check.

## Testing Responsive Design

### Chrome DevTools

1. Press F12 to open DevTools
2. Click the device toggle icon
3. Choose different device presets:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Tablet (1024x768)

### Manual Testing

- Resize browser window to test breakpoints
- Check sidebar behavior at 768px threshold
- Test sidebar pin/unpin on desktop
- Verify mobile FAB appears below 768px

## Future Enhancements

- [ ] PWA support with offline mode
- [ ] Dark mode toggle
- [ ] Custom sidebar item ordering
- [ ] Persistent sidebar state (localStorage)
- [ ] Notification center in sidebar
- [ ] Search functionality in sidebar
- [ ] Quick actions menu
