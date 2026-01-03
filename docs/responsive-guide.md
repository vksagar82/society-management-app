# Getting Started with Responsive Design

Your Society Management App now features a fully responsive design with professional sidebar navigation. This guide will get you up and running quickly.

## Quick Start (3 Steps)

### 1. Start the Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 2. Test Responsive Design

**On Mobile:**

- Open Chrome DevTools (F12)
- Click the device toggle icon
- Select iPhone SE or iPhone 12 Pro
- You should see the blue header and FAB button

**On Desktop:**

- Use full browser window (1024px+)
- You should see the sidebar on the left

**On Tablet:**

- Resize browser to 768px width
- Sidebar should become visible

### 3. Explore the Interface

- **Mobile**: Tap the [≡] button (bottom-right) to toggle sidebar
- **Desktop**: Click the pin icon to collapse/expand sidebar
- **All devices**: Click navigation items to explore

## What's New

### Mobile Experience (< 768px)

```
┌─────────────────────┐
│ Blue NavBar         │
├─────────────────────┤
│ Page Content        │
│                     │
│        [FAB ≡]      │ ← Toggle
└─────────────────────┘
```

- Blue header bar with app logo
- Full-width page content
- FAB button (bottom-right) toggles sidebar
- Sidebar appears as overlay
- Auto-closes when navigating (unless pinned)

### Desktop Experience (≥ 768px)

```
┌────────┬──────────┐
│Sidebar │ Content  │
│(pinned)│          │
│ [pin]  │          │
└────────┴──────────┘
```

- Dark sidebar always visible (256px)
- Pin icon to collapse sidebar (80px - icons only)
- Full page content with responsive padding
- Smooth animations

## Navigation Items

Current navigation structure with SVG icons:

- **Dashboard** - Main dashboard page (house icon)
- **Issues** - Issue tracking and reporting (alert icon)
- **AMCs** - Annual Maintenance Contracts (document icon)
- **Assets** - Asset inventory (cube icon)
- **Users** - User management (people icon - admin only)
- **Profile** - User profile (in sidebar footer with avatar)

### Dynamic User Header

The sidebar header now displays the logged-in user's information:

```
┌─────────────────────┐
│ A  Admin Test User  │  ← User's initial + name
│    admin@test.com   │  ← User's email
├─────────────────────┤
│ Dashboard           │
│ Issues              │
│ AMCs                │
│ Assets              │
│ Users               │
├─────────────────────┤
│ A  Admin Test User  │  ← Footer with avatar
│    admin@test.com   │
└─────────────────────┘
```

**Display Logic:**

- **Avatar**: User's first letter (capitalized)
- **Name & Email**: Shown when sidebar expanded, hidden when collapsed
- **Tooltip**: Appears on hover when collapsed

## Admin Features

Navigate to `/admin` if you're an admin user:

- Admin dashboard with system statistics
- User management interface
- System monitoring
- Admin-specific features
- Admin navigation items only visible to admins (Users menu item)

Non-admin users will be redirected to login.

## Using Responsive Utilities

All pages can use pre-built responsive classes:

```typescript
import { RESPONSIVE_CLASSES } from "@/lib/responsive/utils";

export default function MyPage() {
  return (
    <div className={RESPONSIVE_CLASSES.container}>
      <div className={RESPONSIVE_CLASSES.gridAuto}>
        <div className={RESPONSIVE_CLASSES.card}>
          <h2 className="text-lg font-bold">Card Title</h2>
          <p className="text-gray-600">Content here</p>
        </div>
      </div>
    </div>
  );
}
```

## Detecting Screen Size

Use hooks to detect current screen size:

```typescript
"use client";

import { useIsMobile, useScreenSize } from "@/lib/responsive/utils";

export function MyComponent() {
  // Simple mobile detection
  const isMobile = useIsMobile();

  // Get detailed screen size
  const screenSize = useScreenSize(); // 'mobile' | 'tablet' | 'desktop'

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

## Common Tasks

### Add New Navigation Item

Edit `src/components/Sidebar.tsx`:

```typescript
const NAV_ITEMS: NavItem[] = [
  // ... existing items
  {
    href: "/my-feature",
    label: "My Feature",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="..."
        />
      </svg>
    ),
  },
];
```

### Create Admin Page

1. Create folder: `src/app/admin/my-feature`
2. Create file: `src/app/admin/my-feature/page.tsx`
3. Automatically protected - only admins can access
4. Add to nav items with `adminOnly: true`

### Change Sidebar Width

Edit `src/components/Sidebar.tsx`:

- `w-64` → Expanded width (256px)
- `w-20` → Collapsed width (80px)

Change `w-64` to `w-72`, `w-80`, etc. for different widths.

### Understanding Label Visibility

The sidebar uses intelligent label display:

```typescript
// Labels appear when sidebar is expanded
// Desktop: pinned state
// Mobile: drawer is open

{
  isMobile ? (
    isOpen
  ) : isPinned ? (
    <span className="text-sm font-medium">{item.label}</span>
  ) : null;
}

// Tooltips show on hover when collapsed
{
  (isMobile && !isOpen) || (!isMobile && !isPinned) ? (
    <div className="absolute left-full ml-2 hidden group-hover:block ...">
      {item.label}
    </div>
  ) : null;
}
```

### Style Components Responsively

Mobile-first approach using Tailwind:

```tsx
// Mobile (base)
<div className="p-4">
  Padding: 16px

// Tablet and up
<div className="p-4 md:p-8">
  Padding: 16px (mobile), 32px (tablet+)

// Multiple breakpoints
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  Columns: 1 (mobile), 2 (tablet), 3 (desktop)
```

## Responsive Breakpoints

| Size   | Width      | When             |
| ------ | ---------- | ---------------- |
| Mobile | 0-639px    | Phones           |
| sm     | 640px+     | Large phones     |
| **md** | **768px+** | **Tablets & up** |
| lg     | 1024px+    | Desktops         |
| xl     | 1280px+    | Large desktops   |

Use `md:`, `lg:`, `xl:` prefixes in Tailwind classes.

## Colors & Design System

**Gradient Palette:**

- **Sidebar**: Dark gradient (slate-800 → slate-900)
- **Active Item**: Blue gradient (blue-600 → blue-700)
- **Avatar**: Blue gradient (blue-500 → blue-600)
- **Icons**: Professional SVG (white strokes on dark bg)
- **Text**: White (#FFFFFF) on dark backgrounds
- **Secondary**: Blue-400 for email/metadata text

## Testing on Real Devices

### iPhone/Android

1. Find your local IP: `ipconfig getifaddr en0` (Mac) or check network settings
2. On mobile, visit: `http://YOUR_IP:3000`
3. Test navigation and sidebar toggle

### DevTools Device Presets

Chrome DevTools has preset devices:

- iPhone SE (375px) - Smallest phone
- iPhone 12 Pro (390px) - Standard phone
- iPad (768px) - Tablet threshold
- iPad Pro (1024px) - Large tablet/desktop

## Troubleshooting

**Sidebar not showing?**

- On mobile: Check if FAB button appears (bottom-right)
- On desktop: Check if viewport is ≥ 768px
- Refresh page and clear browser cache

**Mobile header hidden?**

- Check CSS media query: `md:hidden` class on NavBar
- Mobile header only shows below 768px
- Should disappear when viewport widens

**Labels still showing when collapsed?**

- Check sidebar isPinned state
- On desktop, click pin icon to toggle collapse
- Labels should hide with only icons showing

**Tooltip not appearing on hover?**

- Collapse the sidebar (unpin on desktop)
- Move mouse slowly over icon
- Tooltip should appear to the right of icon

**Pin button not working?**

- Only available on desktop (≥ 768px)
- Mobile devices have toggle instead

**Navigation not responsive?**

- Make sure using Tailwind breakpoint prefixes (`md:`, `lg:`, etc.)
- Test with Chrome DevTools device mode

## Getting Help

**Documentation Files:**

- [responsive-design.md](responsive-design.md) - Technical architecture details
- [responsive-guide.md](responsive-guide.md) - This quick start guide
- [MOBILE_RESPONSIVE_GUIDE.md](MOBILE_RESPONSIVE_GUIDE.md) - Mobile-specific features

**Key Components:**

- `src/components/Sidebar.tsx` (376 lines) - Main navigation component
- `src/components/NavBar.tsx` (75 lines) - Mobile header
- `src/components/MainLayout.tsx` - Layout wrapper

**Need to customize?**

See "Customization Guide" in [responsive-design.md](responsive-design.md) for detailed instructions on modifying colors, widths, breakpoints, and more.

## Next Steps

1. Read [responsive-design.md](responsive-design.md) for detailed architecture
2. Explore the components in `src/components/`
3. Customize colors and navigation as needed
4. Deploy to production!

---

**Last Updated**: January 3, 2026  
**Version**: 1.1.0  
**Status**: Production Ready ✅
