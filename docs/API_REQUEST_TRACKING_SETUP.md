# API Request Tracking Setup

## Overview

The API calls metric was showing 0 because audit logs only track specific business actions (CREATE, UPDATE, DELETE), not all HTTP requests. This solution implements proper API request tracking.

## What Was Created

### 1. Database Table

**File:** `database/API_REQUESTS_MIGRATION.sql`

Run this migration to create the `api_requests` table:

```bash
# Connect to your Supabase database and run:
psql -U your_user -d your_database -f database/API_REQUESTS_MIGRATION.sql
```

Or execute directly in Supabase SQL Editor:

```sql
-- Copy and paste the contents of API_REQUESTS_MIGRATION.sql
```

### 2. API Logger Library

**Files:**

- `src/lib/middleware/apiLogger.ts` - Core logging functions
- `src/lib/middleware/withApiLogging.ts` - Wrapper for easy integration

### 3. API Endpoint

**File:** `src/app/api/system/api-requests/route.ts`

- New endpoint to fetch API request statistics
- Endpoint: `GET /api/system/api-requests?society_id=xxx&startDate=xxx&endDate=xxx`

### 4. Updated Developer Page

**File:** `src/app/developer/page.tsx`

- Now fetches from `/api/system/api-requests` instead of `/api/audit-logs`
- Correctly shows today's API request count

## Next Steps

### IMPORTANT: Run the Database Migration

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Using SQL Editor in Supabase Dashboard
# Copy the contents of database/API_REQUESTS_MIGRATION.sql and execute
```

### Adding Logging to Existing API Routes

You have two options:

#### Option A: Automatic Logging (Recommended for all routes)

Add logging to each API route file. Example for `/api/users/route.ts`:

```typescript
import { withApiLogging } from "@/lib/middleware/withApiLogging";
import { verifyToken } from "@/lib/auth/utils";

export async function GET(req: NextRequest) {
  // Extract userId and societyId early
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.slice(7);
  const decoded = token ? verifyToken(token) : null;

  return withApiLogging(
    req,
    async () => {
      // Your existing API logic here
      // ... (rest of the code)
      return NextResponse.json(data);
    },
    societyId, // Pass if available
    decoded?.userId || null // Pass userId if available
  );
}
```

#### Option B: Middleware Approach (Future Enhancement)

Create a Next.js middleware file that automatically logs all API requests.

### Testing

1. **Run the migration** to create the `api_requests` table
2. **Restart your development server**
3. **Make some API calls** by navigating through your app
4. **Check the Developer Dashboard** - it should now show the count of API calls made today

### Verification Query

To verify data is being logged:

```sql
SELECT COUNT(*) FROM api_requests WHERE created_at >= CURRENT_DATE;
```

## Troubleshooting

**If count is still 0:**

1. Verify the `api_requests` table exists
2. Check that API routes are updated with logging (see Option A above)
3. Check browser console and server logs for errors
4. Verify the societyId is being passed correctly

**Database connection issues:**

- Ensure Supabase service role key is configured
- Check that the table has proper permissions
