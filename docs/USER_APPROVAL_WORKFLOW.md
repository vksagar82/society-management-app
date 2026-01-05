# User Approval Workflow

This document explains the multi-society approval workflow implemented in the society management system.

## Overview

Users can now:

- Select multiple societies during signup
- Wait for admin approval for each society
- Access the system only after at least one society approves them
- Be approved or rejected by society administrators

## Features

### For Users

1. **Multi-Society Signup**

   - Users can select multiple societies during registration
   - Each society selection creates a pending approval request
   - Users receive confirmation email after signup

2. **Pending Approval Page**

   - Users see a list of their pending, approved, and rejected requests
   - Page auto-refreshes every 30 seconds to check for updates
   - Redirects to dashboard once at least one society approves

3. **Access Control**
   - Users cannot access the main application until approved
   - Only the pending approval page is accessible while waiting
   - Developers bypass approval workflow

### For Admins

1. **Pending Approvals Management**

   - Admin menu includes "Pending Approvals" option
   - View all users waiting for approval for their society
   - See user details: name, email, phone, request date

2. **Approval Actions**
   - Approve: Grant user access to the society
   - Reject: Deny access with optional rejection reason
   - Actions are logged in audit trail

## Database Changes

### New Fields in `user_societies` Table

```sql
approval_status VARCHAR(50) DEFAULT 'pending'  -- 'pending', 'approved', 'rejected'
approved_by UUID REFERENCES users(id)          -- Admin who approved/rejected
approved_at TIMESTAMP                          -- When the decision was made
rejection_reason TEXT                          -- Optional reason for rejection
```

### Migration

Run this migration to add approval workflow to existing databases:

```sql
ALTER TABLE user_societies
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_user_societies_approval_status ON user_societies(approval_status);
CREATE INDEX IF NOT EXISTS idx_user_societies_society_approval ON user_societies(society_id, approval_status);

-- Existing users are automatically approved
UPDATE user_societies
SET approval_status = 'approved',
    approved_at = created_at
WHERE approval_status IS NULL OR approval_status = 'pending';
```

## User Flow

### Signup Process

1. User visits `/auth/signup`
2. Selects one or more societies (checkbox interface)
3. Submits registration form
4. System creates:
   - User account with `global_role='member'`
   - `user_societies` records with `approval_status='pending'`
5. User redirected to `/auth/pending-approval`

### Approval Waiting

1. User sees pending approval page
2. Page lists all societies:
   - **Pending**: Yellow badge, waiting for admin
   - **Rejected**: Red badge, request denied
   - **Approved**: User automatically redirected to dashboard
3. User can:
   - Refresh status manually
   - Logout and come back later
   - Wait for automatic refresh (every 30 seconds)

### Admin Approval

1. Admin logs in to their society dashboard
2. Clicks "Pending Approvals" in sidebar
3. Sees list of users waiting for approval
4. For each user:
   - Click "Approve" to grant access
   - Click "Reject" to deny access
5. Decision is logged in audit trail
6. User's status updated immediately

### Post-Approval

1. User's next page refresh detects approval
2. Automatically redirected to dashboard
3. Can access all features for approved societies
4. Developer role can switch between societies
5. Regular users auto-assigned to their approved society

## API Endpoints

### POST `/api/auth/signup`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "societyIds": ["uuid1", "uuid2"]
}
```

**Response:**

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "pending_approval": true
  }
}
```

### GET `/api/auth/approval-status`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "societies": [
    {
      "society_id": "uuid",
      "society_name": "Green Valley Apartments",
      "approval_status": "pending",
      "created_at": "2026-01-05T10:00:00Z"
    }
  ]
}
```

### GET `/api/admin/pending-approvals?society_id=<uuid>`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
[
  {
    "id": "user-society-uuid",
    "user_id": "user-uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "created_at": "2026-01-05T10:00:00Z",
    "approval_status": "pending"
  }
]
```

### POST `/api/admin/approve-user`

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "userSocietyId": "user-society-uuid",
  "approve": true,
  "rejectionReason": "Optional reason if rejecting"
}
```

**Response:**

```json
{
  "message": "User approved successfully"
}
```

## Security

1. **Authorization**

   - Only admins can approve/reject users
   - Admins can only manage their own society's approvals
   - Developers have full access to all societies

2. **Approval Status**

   - Checked on every protected route
   - Users without approved societies cannot access main app
   - Developers bypass approval workflow

3. **Audit Logging**
   - All approval/rejection actions are logged
   - Includes: who approved, when, and for which society
   - Tracked in audit_logs table

## UI Components

### Files Created/Modified

1. **Signup Page** (`src/app/auth/signup/page.tsx`)

   - Multi-select checkbox interface for societies
   - Shows society name with city/state
   - Counter for selected societies

2. **Pending Approval Page** (`src/app/auth/pending-approval/page.tsx`)

   - Status cards for each society request
   - Auto-refresh every 30 seconds
   - Manual refresh button
   - Logout option

3. **Admin Pending Approvals** (`src/app/admin/pending-approvals/page.tsx`)

   - Table view of pending users
   - Approve/Reject buttons
   - Society filter (uses selected society from dropdown)

4. **Sidebar** (`src/components/Sidebar.tsx`)

   - Added "Pending Approvals" menu item (admin-only)
   - Uses ClockIcon for visual indicator

5. **Protected Layout** (`src/components/ProtectedLayout.tsx`)
   - Checks `has_approved_society` flag
   - Redirects to pending page if no approvals
   - Allows access to pending, profile, and auth pages

## Testing

### Test Multi-Society Signup

1. Navigate to signup page
2. Select 2-3 societies
3. Complete registration
4. Verify redirect to pending approval page
5. Check all selected societies appear as "Pending"

### Test Admin Approval

1. Login as admin of Society A
2. Navigate to "Pending Approvals"
3. Verify new user appears in list
4. Click "Approve"
5. Verify user disappears from pending list

### Test User Access After Approval

1. As pending user, refresh pending approval page
2. Verify auto-redirect to dashboard
3. Confirm access to all features
4. Check selected society is the approved one

## Future Enhancements

- Email notifications when approved/rejected
- Flat number and wing assignment during approval
- Bulk approval for multiple users
- Approval expiration (auto-reject after X days)
- Admin notes/comments on approvals
- User ability to request approval for additional societies
- Society admin dashboard showing approval statistics
