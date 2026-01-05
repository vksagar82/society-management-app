# Quick Start: API Scopes Management

## What's New?

✅ **Admin Panel** (`/admin`) - For admins to manage scopes and system  
✅ **Developer Panel** (`/developer`) - For developers to configure everything  
✅ **API Scopes Tab** - Manage permissions per role  
✅ **Dynamic Navigation** - Sidebar shows links based on user role

## Accessing API Scopes

### Option 1: Direct URL

- **Admin**: Visit `/admin` → Click "API Scopes" tab
- **Developer**: Visit `/developer` → Click "API Scopes" tab

### Option 2: From Sidebar

- Login as Admin/Developer user
- Look for "Admin Panel" or "Developer Panel" in sidebar
- Click the link
- Navigate to "API Scopes" tab

## Managing Scopes

1. **Select a role** from the buttons at the top
2. **View all available scopes** organized by category:

   - Users
   - Assets
   - AMCs
   - Issues
   - Admin
   - Audit

3. **Toggle scopes on/off** using the switch on the right
4. **Changes save automatically**
5. **All changes are audited** in audit logs

## Default Permissions by Role

| Feature         | Developer | Admin | Manager | Member |
| --------------- | --------- | ----- | ------- | ------ |
| Users (view)    | ✅        | ✅    | ❌      | ❌     |
| Users (manage)  | ✅        | ✅    | ❌      | ❌     |
| Assets (view)   | ✅        | ✅    | ✅      | ✅     |
| Assets (manage) | ✅        | ✅    | ✅      | ❌     |
| AMCs (view)     | ✅        | ✅    | ✅      | ✅     |
| AMCs (manage)   | ✅        | ✅    | ✅      | ❌     |
| Issues (view)   | ✅        | ✅    | ✅      | ✅     |
| Issues (manage) | ✅        | ✅    | ✅      | ❌     |
| Admin Panel     | ✅        | ✅    | ❌      | ❌     |
| Audit (view)    | ✅        | ✅    | ❌      | ❌     |
| Audit (manage)  | ✅        | ❌    | ❌      | ❌     |

## Features

### Developer Panel (`/developer`)

- Dashboard with API call statistics
- User Management
- **API Scopes Configuration**
- Audit Logs (full access, can delete)
- System Settings & Monitoring

### Admin Panel (`/admin`)

- Dashboard with society statistics
- User Management
- **API Scopes Configuration**
- Audit Logs (view only)

## Troubleshooting

### I don't see the API Scopes tab

- Make sure you're logged in as Admin or Developer
- Check your global_role in the users table
- Try refreshing the page

### I don't see Admin/Developer in sidebar

- Your account's `global_role` must be 'admin' or 'developer'
- Contact a developer to update your role

### Changes aren't saving

- Check the browser console for errors
- Make sure your JWT token is valid
- Verify you have internet connection

## Files Changed

**New files created:**

- `/src/app/developer/` - Developer panel and pages
- `/src/app/api-scopes-manager/` - Scopes manager component
- `/src/app/api/scopes/route.ts` - Scopes API endpoint
- `/src/lib/auth/scopes.ts` - Scopes definitions

**Modified files:**

- `/src/app/admin/` - Added tabbed interface
- `/src/lib/auth/permissions.ts` - Added scope checking functions
- `/src/components/Sidebar.tsx` - Added admin/developer navigation links
- `/database/schema.sql` - Added role_scopes table

## Database Setup

Run the migration to create the role_scopes table:

```sql
-- API Scopes - Define permissions for each role
CREATE TABLE role_scopes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  scope_name VARCHAR(100) NOT NULL,
  scope_description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  CONSTRAINT uq_role_scope UNIQUE (society_id, role, scope_name)
);

-- Enable RLS
ALTER TABLE role_scopes ENABLE ROW LEVEL SECURITY;
```

## Testing

1. Create a test admin user
2. Login as admin
3. Navigate to `/admin`
4. Click "API Scopes" tab
5. Select a role
6. Toggle some scopes on/off
7. Refresh the page - changes should persist
8. Check audit logs to see the changes recorded

## Need Help?

See the full documentation at:
`/docs/API_SCOPES_IMPLEMENTATION.md`
