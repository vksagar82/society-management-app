# Modern Design System Documentation v3.0

## Overview

This document outlines the complete design system for the Society Management Application, featuring **Heroicons**, **Headless UI**, and advanced gradient-based styling for a premium, professional appearance.

---

## 🎨 Core Design Principles

### 1. **Modern & Professional**

- Gradient-based color schemes
- Smooth animations and transitions
- Advanced shadows and depth
- Premium iconography with Heroicons

### 2. **User-Centric**

- Intuitive navigation
- Clear visual hierarchy
- Responsive across all devices
- Accessible and inclusive

### 3. **Consistent & Cohesive**

- Unified component library
- Standardized spacing and sizing
- Harmonious color palette
- Consistent interaction patterns

---

## 🎨 Color System

### Primary Gradients

```css
/* Blue to Indigo */
bg-gradient-to-r from-blue-600 to-indigo-600

/* Slate Background */
bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900

/* Card Backgrounds */
bg-gradient-to-br from-white to-blue-50/30
bg-gradient-to-br from-white to-indigo-50/30
bg-gradient-to-br from-white to-purple-50/30
```

### Status Colors with Gradients

- **Success**: `from-green-100 to-emerald-200` with `text-green-800`
- **Warning**: `from-yellow-100 to-amber-200` with `text-yellow-800`
- **Error**: `from-red-100 to-rose-200` with `text-red-800`
- **Info**: `from-blue-100 to-blue-200` with `text-blue-800`

### StatCard Color Variants

Each color includes complete gradient sets:

- **Blue**: Ocean to Sky gradients
- **Green**: Forest to Emerald gradients
- **Red**: Ruby to Rose gradients
- **Orange**: Sunset to Amber gradients
- **Purple**: Violet to Fuchsia gradients
- **Indigo**: Deep Blue gradients
- **Cyan**: Aqua to Teal gradients

---

## 🔤 Typography

### Font Hierarchy

```tsx
// Headings
h1: "text-4xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent";
h2: "text-3xl font-bold";
h3: "text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent";

// Body
p: "text-sm font-medium text-gray-700";
small: "text-xs font-bold uppercase tracking-widest";

// Labels
label: "text-xs font-semibold uppercase tracking-wider text-gray-600";
```

### Font Weights

- **Black**: `font-black` (900) - Primary values
- **Bold**: `font-bold` (700) - Headers, important text
- **Semibold**: `font-semibold` (600) - Sub-headers
- **Medium**: `font-medium` (500) - Body text

---

## 📐 Spacing & Layout

### Container Spacing

```tsx
padding: "p-6"; // Standard card padding
gap: "gap-6"; // Standard grid gap
margin: "mb-8"; // Section margins
```

### Border Radius

```tsx
Small: "rounded-lg"; // 8px - Buttons, small cards
Medium: "rounded-xl"; // 12px - Cards, containers
Large: "rounded-2xl"; // 16px - Large cards, modals
Circle: "rounded-full"; // Badges, avatars
```

---

## 🎯 Component Library

### 1. **StatCard** (Enhanced with Heroicons)

Premium statistics display with trends and icons.

```tsx
<StatCard
  title="Total Issues"
  value={125}
  color="blue"
  trend={12.5}
  trendLabel="vs last month"
  icon={<ExclamationTriangleIcon />}
/>
```

**Features:**

- Gradient backgrounds with ring effects
- Heroicon integration
- Animated trend indicators with ArrowUp/ArrowDown icons
- Hover animations (lift effect)
- Border with matching color rings

**Colors:** blue, green, red, orange, purple, indigo, cyan

---

### 2. **StatusBadge** (with Heroicons)

Status indicators with icons and gradients.

```tsx
<StatusBadge status="open" />
<StatusBadge status="resolved" />
```

**Supported Statuses:**

- `open` - Red gradient with ExclamationCircleIcon
- `in_progress` - Blue gradient with ClockIcon
- `resolved` - Green gradient with CheckCircleIcon
- `closed` - Gray gradient with XCircleIcon
- `active` - Green gradient with CheckCircleIcon
- `expired` - Red gradient with XCircleIcon
- `pending_renewal` - Yellow gradient with ClockIcon

---

### 3. **PriorityBadge** (with Heroicons)

Priority level indicators with matching icons.

```tsx
<PriorityBadge priority="high" />
<PriorityBadge priority="urgent" />
```

**Priority Levels:**

- `low` - Green gradient with SignalIcon
- `medium` - Yellow gradient with SignalIcon
- `high` - Orange gradient with ExclamationCircleIcon
- `urgent` - Red gradient with FireIcon

---

### 4. **Charts** (Modern SVG with Heroicons)

#### LineChart

Area chart with gradient fill and smooth curves.

```tsx
<LineChart
  title="Issues Trend"
  data={trendData}
  clickable
  onClick={() => router.push("/issues")}
/>
```

**Features:**

- Gradient area fill beneath line
- Dual-color gradient stroke
- Enhanced dots with glow effects
- ChevronRight icon for clickable charts
- Hover lift animation

#### BarChart

Vertical bars with gradient fills.

```tsx
<BarChart
  title="Assets by Category"
  data={categoryData}
  clickable
  onClick={() => router.push("/assets")}
/>
```

**Features:**

- Gradient-filled bars
- Rounded corners (rx="6")
- Individual bar gradients
- ChevronRight navigation indicator

#### PieChart

Donut chart with shadow effects.

```tsx
<PieChart
  title="Status Distribution"
  data={statusData}
  clickable
  onClick={() => router.push("/issues")}
/>
```

**Features:**

- SVG shadow filters for depth
- Responsive legend layout
- Truncated labels with flex layout
- Ring effect on legend items

#### ProgressBar

Animated progress indicator with shimmer.

```tsx
<ProgressBar label="Completion Rate" value={75} max={100} color="bg-blue-600" />
```

**Features:**

- Shimmer animation overlay
- Gradient background track
- Smooth transitions (500ms)
- Shadow effects

#### TrendCard

KPI card with Heroicons trend indicators.

```tsx
<TrendCard
  title="Response Time"
  value="2.4 days"
  change={-15}
  isPositive={false}
/>
```

**Features:**

- Auto TrendingUp/TrendingDown icons
- Arrow icons in trend badge
- Gradient backgrounds
- Border with shadow

---

### 5. **Sidebar** (Heroicons Navigation)

Responsive collapsible navigation with Heroicons.

**Icons Used:**

- `HomeIcon` - Dashboard
- `ExclamationTriangleIcon` - Issues
- `DocumentTextIcon` - AMCs
- `CubeIcon` - Assets
- `UsersIcon` - Users

**Features:**

- Gradient button backgrounds
- Smooth collapse/expand
- Tooltip popups on collapsed state
- ChevronLeft/Right toggle icons
- Mobile overlay with backdrop blur
- Ring effects on avatars
- Bars3Icon/XMarkIcon for mobile toggle

---

### 6. **NavBar** (Headless UI Menu)

Mobile navigation with dropdown menu using Headless UI.

**Icons Used:**

- `BellIcon` - Notifications (with badge)
- `UserCircleIcon` - Profile
- `Cog6ToothIcon` - Settings
- `ArrowRightOnRectangleIcon` - Logout
- `ChevronDownIcon` - Menu indicator

**Features:**

- Headless UI Menu component
- Smooth transitions (Transition component)
- Gradient menu items on hover
- Icon-based navigation
- Notification badge

---

## 🎭 Animations

### Keyframe Animations

```css
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### Transition Classes

```tsx
"transition-all duration-300"; // Standard transitions
"hover:shadow-xl"; // Shadow on hover
"hover:-translate-y-1"; // Lift effect
"hover:scale-110"; // Scale up
"animate-pulse"; // Pulse animation
"animate-shimmer"; // Shimmer effect
```

---

## 📱 Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Responsive Patterns

```tsx
// Flex direction
"flex flex-col lg:flex-row";

// Grid columns
"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4";

// Text sizes
"text-sm md:text-base lg:text-lg";

// Visibility
"hidden md:block";
"md:hidden";
```

---

## 🎯 Interactive Elements

### Hover States

```tsx
// Cards
"hover:shadow-2xl hover:-translate-y-1";

// Buttons
"hover:scale-110 hover:shadow-blue-500/50";

// Nav Items
"hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50";
```

### Active States

```tsx
// Navigation
"bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600";
"shadow-xl shadow-blue-500/30";

// Buttons
"ring-4 ring-blue-100";
```

---

## 🔧 Icon System (Heroicons)

### Installation

```bash
npm install @heroicons/react @headlessui/react
```

### Usage Pattern

```tsx
import {
  HomeIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";

<HomeIcon className="w-5 h-5" />
<ArrowUpIcon className="w-3.5 h-3.5" />
```

### Common Icons

- **Navigation**: HomeIcon, UsersIcon, CubeIcon, DocumentTextIcon
- **Actions**: ArrowUpIcon, ArrowDownIcon, ChevronRightIcon, XMarkIcon
- **Status**: CheckCircleIcon, XCircleIcon, ExclamationCircleIcon, ClockIcon
- **Trends**: TrendingUpIcon, TrendingDownIcon, FireIcon, SignalIcon
- **Menu**: BellIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon

---

## 🎨 Shadow System

### Elevation Levels

```tsx
shadow-sm      // Subtle elevation
shadow-md      // Medium elevation
shadow-lg      // High elevation
shadow-xl      // Very high elevation
shadow-2xl     // Maximum elevation
```

### Colored Shadows

```tsx
shadow-blue-500/50      // Blue tinted shadow
shadow-blue-500/30      // Lighter blue shadow
ring-2 ring-blue-400/50 // Blue ring
```

---

## 📦 Package Dependencies

```json
{
  "@heroicons/react": "^2.x",
  "@headlessui/react": "^2.x",
  "next": "16.1.1",
  "react": "19.2.3",
  "tailwindcss": "^4"
}
```

---

## 🔄 Version History

### v3.0 (Current)

- ✅ Integrated Heroicons for all icons
- ✅ Added Headless UI for dropdown menus
- ✅ Enhanced all components with gradients
- ✅ Added shimmer animations
- ✅ Improved shadow and ring effects
- ✅ Updated all charts with modern SVG gradients

### v2.0.1

- Fixed orange color support
- Added BarChart NaN safety guards
- Fixed PieChart legend overflow

### v2.0

- Professional modern design system
- Comprehensive dashboard analytics
- Interactive clickable charts

### v1.0

- Initial responsive mobile layout
- Basic sidebar navigation
- Simple component library

---

## 📝 Best Practices

1. **Always use Heroicons** for consistency
2. **Apply gradients** to backgrounds for depth
3. **Add hover states** for interactivity
4. **Use ring effects** for focus/active states
5. **Implement smooth transitions** (300ms duration)
6. **Follow responsive patterns** (mobile-first)
7. **Maintain color consistency** across components
8. **Test on multiple devices** before deployment

---

## 🎯 Accessibility

- **ARIA labels** on all interactive elements
- **Keyboard navigation** support
- **Focus indicators** with ring classes
- **Semantic HTML** structure
- **Color contrast** meeting WCAG AA standards
- **Icon + text** for screen readers

---

**Last Updated**: January 2026  
**Version**: 3.0  
**Framework**: Next.js 16 + React 19 + Tailwind CSS 4 + Heroicons 2 + Headless UI 2
