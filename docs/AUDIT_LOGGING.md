# Comprehensive Audit Logging System Documentation

## Overview

The society management app now includes a comprehensive audit logging system that tracks **every change** made by any user in the system. All changes are logged with detailed information including:

- **Who** made the change (user details)
- **What** was changed (entity type and ID)
- **When** it happened (timestamp)
- **How** they accessed it (IP address, user agent)
- **Before and after values** (for updates)

## Architecture

### Database Schema

The `audit_logs` table stores all audit records:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID NOT NULL REFERENCES societies(id),
  action VARCHAR(255) NOT NULL,           -- CREATE, UPDATE, DELETE, VIEW
  entity_type VARCHAR(100),                -- issue, asset, amc, user, auth_login
  entity_id UUID,                          -- ID of the changed entity
  user_id UUID REFERENCES users(id),       -- Who made the change
  old_values JSONB,                        -- Previous values (for updates)
  new_values JSONB,                        -- New values (for creates/updates)
  ip_address VARCHAR(45),                  -- User's IP address
  user_agent TEXT,                         -- Browser/client info
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_society_id ON audit_logs(society_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## Components

### 1. **Logging Helper** (`src/lib/audit/loggingHelper.ts`)

A high-level utility function for logging operations throughout the app.

**Key Functions:**

#### `logOperation()`

Logs any CRUD operation with automatic filtering of sensitive data.

```typescript
await logOperation({
  request: req,
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW",
  entityType: "issue" | "asset" | "amc" | "user" | "auth_login",
  entityId: "uuid-string",
  societyId: "uuid-string",
  userId: "uuid-string",
  oldValues: {}, // For UPDATE/DELETE operations
  newValues: {}, // For CREATE/UPDATE operations
  description: "Human readable description of what happened",
});
```

**Features:**

- ✅ Automatically redacts sensitive fields (passwords, tokens)
- ✅ Extracts IP address and user agent from request
- ✅ Non-blocking (doesn't throw errors)
- ✅ Works with all entity types

#### `getChangedFields()`

Compares old and new values and returns only the changed fields.

```typescript
const changes = getChangedFields(oldValues, newValues);
// Returns: { fieldName: { from: oldValue, to: newValue }, ... }
```

#### `formatAuditLogForDisplay()`

Formats audit logs in a user-friendly way for the admin UI.

## Logged Operations

### Authentication Operations

- **Login** - `action: "VIEW"`, `entity_type: "auth_login"`
  - Logs every successful login with email and timestamp
  - Tracks IP addresses for security monitoring
- **Signup** - `action: "CREATE"`, `entity_type: "user"`

  - Logs new user account creation
  - Records initial user details (email, name, phone, role)

- **Role Update** - `action: "UPDATE"`, `entity_type: "user"`
  - Logs when admin changes a user's role
  - Records old role → new role

### Issues

- **Create** - `action: "CREATE"`, `entity_type: "issue"`
  - Logs issue creation with full details
- **Update** - `action: "UPDATE"`, `entity_type: "issue"`
  - Logs status changes, priority changes, assignments
  - Tracks old vs. new values
- **Delete** - `action: "DELETE"`, `entity_type: "issue"`
  - Logs issue deletions (admin only)
  - Stores the deleted issue data for recovery purposes

### Assets

- **Create** - `action: "CREATE"`, `entity_type: "asset"`
  - Logs new asset additions
- **Update** - `action: "UPDATE"`, `entity_type: "asset"`
  - Logs maintenance dates, status changes, location updates
- **Delete** - `action: "DELETE"`, `entity_type: "asset"`
  - Logs asset removals (admin only)

### AMCs (Annual Maintenance Contracts)

- **Create** - `action: "CREATE"`, `entity_type: "amc"`
  - Logs new AMC contracts
- **Update** - `action: "UPDATE"`, `entity_type: "amc"`
  - Logs contract renewals, price changes, vendor changes
- **Delete** - `action: "DELETE"`, `entity_type: "amc"`
  - Logs AMC deletions (admin only)

## API Endpoints with Logging

### Authentication APIs

- `POST /api/auth/login` - Logs login attempts
- `POST /api/auth/signup` - Logs new user creation
- `POST /api/auth/update-role` - Logs role changes

### Issues APIs

- `POST /api/issues` - Logs issue creation
- `PUT /api/issues` - Logs issue updates
- `DELETE /api/issues?id=<id>` - Logs issue deletion

### Assets APIs

- `POST /api/assets` - Logs asset creation
- `PUT /api/assets` - Logs asset updates
- `DELETE /api/assets?id=<id>` - Logs asset deletion

### AMCs APIs

- `POST /api/amcs` - Logs AMC creation
- `PUT /api/amcs` - Logs AMC updates
- `DELETE /api/amcs?id=<id>` - Logs AMC deletion

## Admin Dashboard

### Audit Logs Viewer (`src/app/admin/audit-logs/page.tsx`)

The admin dashboard provides a comprehensive interface for viewing and analyzing audit logs.

**Features:**

#### 1. **Advanced Filtering**

- Filter by Entity Type (Issue, Asset, AMC, User, Login)
- Filter by Action (Create, Update, Delete, View)
- Adjustable page size (10, 20, 50, 100 records)
- Clear filters button

#### 2. **Export Functionality**

- **CSV Export** - Download logs as CSV for spreadsheet analysis
- **JSON Export** - Download raw data as JSON for custom processing

#### 3. **Detailed View Modal**

Click the "View" button on any log entry to see:

- Complete timestamp
- User information (name, email)
- Action type with color-coded badge
- Entity type and ID
- All changes in before/after format
- IP address and user agent information

#### 4. **Pagination**

- Navigate through large logs with next/previous buttons
- Display current page and total count

#### 5. **User-Friendly Display**

- Color-coded actions:
  - 🟢 **Create** - Green
  - 🔵 **Update** - Blue
  - 🔴 **Delete** - Red
  - ⚫ **View** - Gray
- Automatically formats dates and truncates long values
- Shows abbreviated entity IDs with full IDs in detail view

## Usage Examples

### Example 1: Logging an Asset Update

```typescript
// In src/app/api/assets/route.ts
const oldAssetData = await getAssetFromDB(assetId);
const updatedAsset = await updateAssetInDB(assetId, newData);

await logOperation({
  request: req,
  action: "UPDATE",
  entityType: "asset",
  entityId: assetId,
  societyId: userData.society_id,
  userId: authData.user.id,
  oldValues: oldAssetData,
  newValues: updatedAsset,
  description: `Asset ${oldAssetData.name} maintenance date updated`,
});
```

### Example 2: Logging a User Deletion

```typescript
// In DELETE handler
const userData = await getUserBeforeDeletion(userId);

// ... delete user ...

await logOperation({
  request: req,
  action: "DELETE",
  entityType: "user",
  entityId: userId,
  societyId: societyId,
  userId: currentAdminId,
  oldValues: userData,
  description: `User ${userData.email} account deleted`,
});
```

### Example 3: Viewing Logs as an Admin

1. Navigate to Admin Dashboard → Audit Logs
2. (Optional) Apply filters to narrow down results
3. Click "View" on any entry to see detailed changes
4. Use CSV/JSON export buttons to download data for analysis

## Data Security

### Sensitive Data Protection

The logging system automatically redacts:

- `password` fields
- `password_hash` fields
- `token` fields

These are replaced with `[REDACTED]` in logs to prevent exposing credentials.

### Access Control

- Only **admin users** can view audit logs
- Logs are scoped to the user's society (multi-tenancy)
- DELETE operations are restricted to admins only

### IP & User Agent Tracking

Every log includes:

- **IP Address** - For tracking user locations and detecting suspicious activity
- **User Agent** - Browser/client information for security analysis

## Best Practices

### 1. Always Log at the API Layer

All changes should be logged at the API endpoint level, not in client-side code.

### 2. Include Descriptive Information

Use the `description` parameter to explain what happened in human-readable terms:

```typescript
// Good
description: `Issue status changed: open → resolved`;

// Bad
description: `status updated`;
```

### 3. Get Old Values Before Updates

Always fetch the old data before performing updates to capture before/after values:

```typescript
const oldData = await db.get(id);
const newData = await db.update(id, newValues);

await logOperation({
  // ...
  oldValues: oldData,
  newValues: newData,
});
```

### 4. Log Deletions Carefully

When deleting records, always capture the full entity data:

```typescript
const entityToDelete = await db.get(id);
await db.delete(id);

await logOperation({
  action: "DELETE",
  // ...
  oldValues: entityToDelete, // Preserve deleted data
});
```

## Monitoring & Analysis

### Common Queries for Admins

**1. Find all changes made by a specific user:**

- Use the audit logs filter
- Filter by entity type + action
- View all entries for that user

**2. Track changes to a specific entity:**

- Export logs as JSON
- Search by entity_id
- Review complete history of changes

**3. Find deletion history:**

- Filter by action: "DELETE"
- Review who deleted what and when
- Check for unauthorized deletions

**4. Analyze user activity:**

- Filter by entity_type: "auth_login"
- View login attempts and patterns
- Identify suspicious access times

## Troubleshooting

### Logs Not Appearing

1. Check that the user has admin privileges
2. Verify the user's society_id matches the entity's society_id
3. Check browser console for any errors
4. Verify the audit_logs table has the records (database level)

### Permission Denied on Deletions

- Only admins can delete entities (issues, assets, AMCs)
- Non-admin users cannot DELETE via API
- Try logging in as admin user

### Export Not Working

- Check browser's popup blocker settings
- Ensure you have data to export (apply filters if needed)
- Try a different export format (CSV vs JSON)

## Future Enhancements

Potential improvements for the audit logging system:

- [ ] Real-time audit log notifications
- [ ] Role-based log visibility (show only relevant logs to managers)
- [ ] Advanced search with date range picker
- [ ] Automated alerts for suspicious activity
- [ ] Log retention policies and archival
- [ ] Audit log analytics dashboard
- [ ] Webhook integrations for external systems
- [ ] Integration with SIEM systems for enterprise deployments

## Conclusion

The comprehensive audit logging system provides complete visibility into all system changes. Admins can now:

- ✅ Track every change in the system
- ✅ See who made what changes and when
- ✅ Review detailed before/after values
- ✅ Export data for analysis
- ✅ Maintain compliance with regulatory requirements
- ✅ Investigate issues and troubleshoot problems
