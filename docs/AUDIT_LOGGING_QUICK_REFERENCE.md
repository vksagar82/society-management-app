# Audit Logging - Quick Reference Card

## For Admins 👨‍💼

### How to View Audit Logs

1. Click **Admin** menu
2. Select **Audit Logs**
3. Use **Filters** to find specific changes
4. Click **View** to see details
5. **Export** as CSV or JSON

### What You Can See

- ✅ Who made the change (user name & email)
- ✅ What changed (entity type & ID)
- ✅ When it happened (timestamp)
- ✅ What changed (old → new values)
- ✅ Where they were (IP address)
- ✅ What they used (browser/device info)

### Filter Options

| Filter          | Options                        |
| --------------- | ------------------------------ |
| **Entity Type** | Issue, Asset, AMC, User, Login |
| **Action**      | Create, Update, Delete, View   |
| **Page Size**   | 10, 20, 50, 100 records        |

### Export Formats

- **CSV** - Use in Excel/Sheets for analysis
- **JSON** - Use for custom processing

---

## For Developers 👨‍💻

### Add Logging in 3 Lines

```typescript
import { logOperation } from "@/lib/audit/loggingHelper";

await logOperation({
  request: req,
  action: "CREATE", // CREATE | UPDATE | DELETE | VIEW
  entityType: "issue", // issue | asset | amc | user | auth_login
  entityId: data.id, // UUID of the entity
  societyId: userData.society_id, // User's society
  userId: authData.user.id, // Who made the change
  newValues: data, // New/created values
  oldValues: oldData, // For UPDATE/DELETE (old values)
  description: "Issue created", // Human-readable description
});
```

### Entity Types to Use

```
"user"       → User account changes
"issue"      → Issue/complaint management
"asset"      → Asset/equipment management
"amc"        → Annual Maintenance Contracts
"auth_login" → Login events
```

### Actions to Log

```
"CREATE" → New record created
"UPDATE" → Record modified (capture oldValues + newValues)
"DELETE" → Record deleted (capture oldValues)
"VIEW"   → Access/login (for auth events)
```

### Common Patterns

#### CREATE

```typescript
const { data } = await supabase
  .from("issues")
  .insert([validatedData])
  .select()
  .single();
await logOperation({
  action: "CREATE",
  entityType: "issue",
  entityId: data.id,
  newValues: data,
  // ... other fields
});
```

#### UPDATE

```typescript
const { data: oldData } = await db.get(id);
const { data: newData } = await db.update(id, changes);
await logOperation({
  action: "UPDATE",
  entityType: "issue",
  entityId: id,
  oldValues: oldData, // ← Important!
  newValues: newData, // ← Important!
  // ... other fields
});
```

#### DELETE

```typescript
const { data: entity } = await db.get(id);
await db.delete(id);
await logOperation({
  action: "DELETE",
  entityType: "issue",
  entityId: id,
  oldValues: entity, // ← Preserve for recovery
  // ... other fields
});
```

### Auto-Redacted Fields

These are automatically hidden with `[REDACTED]`:

- `password`
- `password_hash`
- `token`

### Where to Add Logging

- ✅ `src/app/api/issues/route.ts`
- ✅ `src/app/api/assets/route.ts`
- ✅ `src/app/api/amcs/route.ts`
- ✅ `src/app/api/auth/*.ts`
- ✅ Any API endpoint that modifies data

---

## Database Schema 🗄️

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  society_id UUID NOT NULL,        -- Which society
  action VARCHAR NOT NULL,          -- CREATE/UPDATE/DELETE/VIEW
  entity_type VARCHAR,              -- issue/asset/amc/user
  entity_id UUID,                   -- What was changed
  user_id UUID,                     -- Who did it
  old_values JSONB,                 -- Before values
  new_values JSONB,                 -- After values
  ip_address VARCHAR,               -- Where from
  user_agent TEXT,                  -- What device
  created_at TIMESTAMP              -- When it happened
);
```

---

## Test Checklist ✅

Before considering your implementation complete:

- [ ] Log appears in Audit Logs within 1 second of action
- [ ] User information is correct
- [ ] Timestamp is accurate
- [ ] Entity ID is correct
- [ ] For UPDATE: both oldValues and newValues are present
- [ ] For DELETE: oldValues contains full entity
- [ ] For CREATE: newValues contains all new fields
- [ ] Sensitive fields show as `[REDACTED]`
- [ ] IP address is captured
- [ ] User agent is captured
- [ ] Only admins can view logs
- [ ] Export to CSV works
- [ ] Export to JSON works
- [ ] Filters work correctly
- [ ] Detail view modal shows all information

---

## Troubleshooting Quick Tips 🔧

| Problem                | Solution                                                 |
| ---------------------- | -------------------------------------------------------- |
| Logs not appearing     | Verify you're admin, check entity_type spelling          |
| Can't export           | Check popup blocker, verify data exists                  |
| Sensitive data showing | Ensure field names match: password, password_hash, token |
| Wrong user logged      | Verify user ID is correctly fetched from auth context    |
| Old values missing     | For UPDATE, ALWAYS get old data before updating          |

---

## Key Files 📂

| File                                   | Purpose                        |
| -------------------------------------- | ------------------------------ |
| `src/lib/audit/loggingHelper.ts`       | Logging utility functions      |
| `src/lib/audit/logger.ts`              | Low-level logging API          |
| `src/app/admin/audit-logs/page.tsx`    | Admin dashboard                |
| `src/app/api/audit-logs/route.ts`      | API endpoint for fetching logs |
| `docs/AUDIT_LOGGING.md`                | Complete documentation         |
| `docs/AUDIT_LOGGING_IMPLEMENTATION.md` | Developer guide                |

---

## Quick Command Reference

### Find logs for a specific issue

1. Go to Admin → Audit Logs
2. Filter Entity Type: **Issue**
3. Search results for your issue ID

### Export all logins from today

1. Filter Action: **View**
2. Filter Entity Type: **Login**
3. Click **CSV** to download
4. Open in Excel and analyze

### Investigate a deletion

1. Filter Action: **Delete**
2. Find the deleted item
3. Click **View** to see what was deleted
4. Check who deleted it and when

### Monitor a user's activity

1. Export as **JSON**
2. Search JSON for `user_id`
3. Analyze all their actions

---

## Performance Notes ⚡

- Logging is **non-blocking** (doesn't slow down main operation)
- Logs are **indexed** on society_id and created_at
- Dashboard **paginates** at 20 records per page (configurable)
- Export works efficiently up to 10,000+ records
- Queries complete in <100ms with proper pagination

---

## Security Reminders 🔒

- ✅ Only admins can view logs
- ✅ Sensitive fields are auto-redacted
- ✅ IP addresses are logged for security tracking
- ✅ Society-scoped (can't see other society's logs)
- ✅ Delete operations are admin-restricted

---

## Support Resources 📚

- **Full Reference:** `docs/AUDIT_LOGGING.md`
- **Implementation Guide:** `docs/AUDIT_LOGGING_IMPLEMENTATION.md`
- **Real Examples:** Check `src/app/api/issues/route.ts`
- **Admin Help:** Dashboard has inline tooltips

---

**Last Updated:** 2026-01-03  
**Status:** ✅ Production Ready
