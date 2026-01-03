# Audit Logging Implementation Guide

## Quick Start for Developers

### Adding Logging to a New API Endpoint

#### Step 1: Import the Logging Helper

```typescript
import { logOperation } from "@/lib/audit/loggingHelper";
```

#### Step 2: Get Authentication Context

```typescript
const { data: authData } = await supabase.auth.getUser();
if (!authData.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const { data: userData } = await supabase
  .from("users")
  .select("society_id")
  .eq("id", authData.user.id)
  .single();
```

#### Step 3: Log the Operation

**For CREATE:**

```typescript
const { data, error } = await supabase
  .from("table_name")
  .insert([validatedData])
  .select()
  .single();

if (userData?.society_id) {
  await logOperation({
    request: req,
    action: "CREATE",
    entityType: "entity_name",
    entityId: data.id,
    societyId: userData.society_id,
    userId: authData.user.id,
    newValues: data,
    description: `Entity created: ${data.name || data.title}`,
  });
}
```

**For UPDATE:**

```typescript
// Get old data first
const { data: oldData } = await supabase
  .from("table_name")
  .select("*")
  .eq("id", entityId)
  .single();

// Update
const { data: newData } = await supabase
  .from("table_name")
  .update(updateData)
  .eq("id", entityId)
  .select()
  .single();

// Log
if (userData?.society_id) {
  await logOperation({
    request: req,
    action: "UPDATE",
    entityType: "entity_name",
    entityId: entityId,
    societyId: userData.society_id,
    userId: authData.user.id,
    oldValues: oldData,
    newValues: newData,
    description: `Entity updated: ${oldData?.name}`,
  });
}
```

**For DELETE:**

```typescript
// Get data before deletion (for logging)
const { data: entityData } = await supabase
  .from("table_name")
  .select("*")
  .eq("id", entityId)
  .single();

// Check admin permission
if (userData?.role !== "admin") {
  return NextResponse.json(
    { error: "Only admins can delete" },
    { status: 403 }
  );
}

// Delete
const { error } = await supabase.from("table_name").delete().eq("id", entityId);

// Log
if (userData?.society_id && entityData) {
  await logOperation({
    request: req,
    action: "DELETE",
    entityType: "entity_name",
    entityId: entityId,
    societyId: userData.society_id,
    userId: authData.user.id,
    oldValues: entityData,
    description: `Entity deleted: ${entityData.name}`,
  });
}
```

## Common Entity Types

Use these consistent entity type strings:

- `user` - User account operations
- `issue` - Issue/complaint management
- `asset` - Asset management
- `amc` - Annual Maintenance Contracts
- `auth_login` - Authentication (login)

## Logging Patterns by Operation Type

### CREATE Operations

- **Always log** new entity creation
- **Always include** newValues with all created fields
- **Action:** "CREATE"
- **Old Values:** null/undefined

### UPDATE Operations

- **Always get old data** before updating
- **Always include** both oldValues and newValues
- **Action:** "UPDATE"
- **Benefit:** Tracks exactly what changed

### DELETE Operations

- **Only allow admins** to delete (add permission check)
- **Always preserve** the deleted entity in oldValues
- **Action:** "DELETE"
- **New Values:** null/undefined
- **Benefit:** Can recover deleted data if needed

### LOGIN Operations

- **Log after successful** authentication
- **Action:** "VIEW" (or could use custom "AUTH")
- **Entity Type:** "auth_login"
- **Include:** email, login_time in newValues

## Sensitive Data Redaction

The `logOperation` function automatically redacts these fields:

- `password`
- `password_hash`
- `token`

You don't need to manually redact them, but be aware they will appear as `[REDACTED]` in logs.

## Error Handling

The logging function **does not throw errors**. If logging fails, it will:

1. Log the error to console
2. Continue execution (non-blocking)
3. Not affect the main operation's success/failure

This is intentional - logging should never break the main functionality.

## Testing Your Logging

### Verify Logs Are Being Created

1. Login as an admin user
2. Perform a test action (create/update/delete)
3. Navigate to Admin → Audit Logs
4. Check if the new log entry appears
5. Click "View" to verify all details are correct

### Example Test Cases

**Test Case 1: Create Issue**

- Create a new issue
- Check audit log for CREATE action
- Verify entity_type = "issue"
- Verify newValues contains issue details

**Test Case 2: Update Asset**

- Update an asset (change status, location, etc.)
- Check audit log for UPDATE action
- Verify oldValues and newValues are different
- Verify only changed fields appear in detail view

**Test Case 3: Delete AMC**

- Try to delete as non-admin → should get error
- Try to delete as admin → should succeed
- Check audit log for DELETE action
- Verify oldValues contain full AMC data

## Real-World Example: Complete API Endpoint

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { z } from "zod";
import { logOperation } from "@/lib/audit/loggingHelper";

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  notes: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = updateSchema.parse(body);

    const supabase = createServerClient();

    // Get current user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's society
    const { data: userData } = await supabase
      .from("users")
      .select("society_id")
      .eq("id", authData.user.id)
      .single();

    // Get old issue data for comparison
    const { data: oldIssue } = await supabase
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    // Update issue
    const { data: updatedIssue, error } = await supabase
      .from("issues")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log the update with old and new values
    if (userData?.society_id) {
      await logOperation({
        request: req,
        action: "UPDATE",
        entityType: "issue",
        entityId: id,
        societyId: userData.society_id,
        userId: authData.user.id,
        oldValues: oldIssue,
        newValues: updatedIssue,
        description: `Issue updated: "${oldIssue?.title}" - status: ${oldIssue?.status} → ${updatedIssue.status}`,
      });
    }

    return NextResponse.json(updatedIssue);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    );
  }
}
```

## Checklist for Implementation

- [ ] Import `logOperation` from "@/lib/audit/loggingHelper"
- [ ] Get authentication context (user and society ID)
- [ ] For CREATE: Log after successful insertion with newValues
- [ ] For UPDATE: Get old data first, then log with both old and new values
- [ ] For DELETE: Check admin permission, preserve entity in oldValues
- [ ] Include meaningful description in the log
- [ ] Test the endpoint and verify logs appear in admin dashboard
- [ ] Verify sensitive fields are redacted in logs
- [ ] Ensure error handling doesn't break if logging fails

## Frequent Questions

**Q: Should I log GET operations?**
A: Generally no. Logs become too large. Only log GET if it's sensitive (e.g., viewing confidential reports).

**Q: What if the user isn't found?**
A: The log will still be created but will have a null user_id. This is fine for tracking admin API calls or system operations.

**Q: Can I customize the action types?**
A: Current supported actions are: CREATE, UPDATE, DELETE, VIEW. Others can be added by updating the `AuditLogParams` interface in `logger.ts`.

**Q: How long are logs retained?**
A: Currently indefinitely. Consider implementing a retention policy (e.g., delete logs older than 1 year) for performance.

**Q: Can I filter logs by date range?**
A: The API supports `startDate` and `endDate` filters in `getAuditLogs()`, but the UI doesn't expose them yet. This could be added as a future enhancement.

---

**Need help?** Check the [main audit logging documentation](./AUDIT_LOGGING.md) or review existing implementations in:

- `src/app/api/issues/route.ts`
- `src/app/api/assets/route.ts`
- `src/app/api/amcs/route.ts`
