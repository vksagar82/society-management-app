# API Scopes Management - Implementation Guide

## Overview

Admin and Developer users can now manage API scopes per role, controlling feature visibility and access across the application.

## Access Points

### For Admins

- **URL**: `/admin`
- **Sidebar**: "Admin Panel" (visible only to admins)
- **Tabs Available**: Dashboard | Users | API Scopes | Audit Logs

### For Developers

- **URL**: `/developer`
- **Sidebar**: "Developer Panel" (visible only to developers)
- **Tabs Available**: Dashboard | Users | API Scopes | Audit Logs | System

## Features

### API Scopes Tab

Both Admin and Developer panels include the **API Scopes** management interface where you can:

1. **Select a Role** to configure:

   - Developer
   - Admin
   - Manager
   - Member

2. **Manage Scopes by Category**:

   - **Users**: view, edit, manage permissions
   - **Assets**: view, edit, manage permissions
   - **AMCs**: view, edit, manage permissions
   - **Issues**: view, edit, manage permissions
   - **Admin**: view, settings permissions
   - **Audit**: view, manage permissions

3. **Enable/Disable Scopes**:
   - Toggle scopes on/off per role
   - Changes are saved in real-time
   - All changes are logged in audit logs

## Database Schema

New table: `role_scopes`

- `id`: UUID primary key
- `society_id`: Optional society-specific scopes
- `role`: Target role (developer, admin, manager, member)
- `scope_name`: Scope identifier (e.g., 'users.view')
- `scope_description`: Human-readable description
- `is_enabled`: Boolean flag to enable/disable scope
- `created_at`, `updated_at`: Timestamps
- `created_by`: User who created the scope

## API Endpoints

### GET /api/scopes

Fetch all available scopes for the current user (developer only)

**Response:**

```json
{
  "scopes": [
    {
      "id": "uuid",
      "role": "admin",
      "scope_name": "users.view",
      "is_enabled": true,
      "created_at": "2024-01-05T12:00:00Z"
    }
  ],
  "defaultScopes": {
    "developer": [...],
    "admin": [...],
    "manager": [...],
    "member": [...]
  }
}
```

### POST /api/scopes

Create a new scope assignment

**Request:**

```json
{
  "societyId": "uuid or null",
  "role": "admin",
  "scopeName": "users.view",
  "isEnabled": true,
  "description": "View user profiles"
}
```

### PUT /api/scopes

Update scope enable/disable status

**Request:**

```json
{
  "id": "scope-id",
  "isEnabled": false,
  "description": "Updated description"
}
```

## Scope Definitions

### Users Management

- `users.view` - View user profiles and information
- `users.edit` - Edit user profiles
- `users.manage` - Create, delete, manage users

### Assets Management

- `assets.view` - View assets and categories
- `assets.edit` - Edit asset information
- `assets.manage` - Create, delete, manage assets

### AMC Management

- `amcs.view` - View AMC contracts and history
- `amcs.edit` - Edit AMC details
- `amcs.manage` - Create, delete, manage AMCs

### Issues Management

- `issues.view` - View issues and complaints
- `issues.edit` - Edit and comment on issues
- `issues.manage` - Create, delete, manage issues

### Admin Functions

- `admin.view` - Access admin dashboard
- `admin.settings` - Manage system settings

### Audit Functions

- `audit.view` - View audit logs
- `audit.manage` - Delete audit logs (developer only)

## Default Role Scopes

### Developer (Full Access)

All scopes enabled by default

### Admin (Full Access except Audit Management)

All scopes except `audit.manage`

### Manager (Limited Management)

- `users.view`, `assets.view`, `assets.edit`, `assets.manage`
- `amcs.view`, `amcs.edit`, `issues.view`, `issues.edit`, `issues.manage`

### Member (View & Edit Only)

- `users.view`, `assets.view`, `amcs.view`
- `issues.view`, `issues.edit`

## Usage Example

### Check if user has scope:

```typescript
import { hasScope } from "@/lib/auth/scopes";

if (hasScope("admin", "users.manage")) {
  // Show user management features
}
```

### Check specific resource access:

```typescript
import { canViewResource, canEditResource } from "@/lib/auth/permissions";

const enabledScopes = ["users.view", "users.edit", "assets.view"];

if (canViewResource(enabledScopes, "users")) {
  // Show users view
}

if (canEditResource(enabledScopes, "assets")) {
  // Show asset edit interface
}
```

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── page.tsx              # Admin main page
│   │   └── page-with-tabs.tsx    # Admin with tabs
│   ├── developer/
│   │   ├── page.tsx              # Developer main page
│   │   └── page-with-tabs.tsx    # Developer with tabs
│   ├── api/
│   │   └── scopes/
│   │       └── route.ts          # Scopes API endpoint
│   └── api-scopes-manager/
│       ├── ApiScopesManager.tsx      # Scopes manager component
│       └── ApiScopesManager.module.css # Styles
├── lib/
│   └── auth/
│       ├── scopes.ts             # Scopes definitions & utilities
│       └── permissions.ts        # Permission checking functions
└── components/
    └── Sidebar.tsx              # Updated with admin/developer links
```

## Navigation

Users with admin or developer roles will see the following in the sidebar:

- **Admin** → "Admin Panel" link (admin only)
- **Developer** → "Developer Panel" link (developer only)

Both panels include:

1. Dashboard - Overview and statistics
2. Users - User management
3. **API Scopes** - Configure scopes per role
4. Audit Logs - View system activities
5. System (Developer only) - System settings

## Audit Logging

All scope changes are automatically logged in the audit_logs table with:

- Action: CREATE, UPDATE
- Entity Type: role_scope
- User ID: Who made the change
- New Values: Updated scope configuration
- Timestamp: When the change occurred

## Security Notes

- Only developers can create/modify scopes
- Scopes are validated on the backend
- All changes are audited
- RLS policies protect scope data per society
- Scopes can be society-specific or global (null society_id)
