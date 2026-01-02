# Authentication & User Management System

## Overview

This document describes the complete user authentication and role-based access control (RBAC) system implemented in the Society Management App.

## Features

### 1. User Authentication

- **Sign Up**: New users can create accounts with email, password, and basic information
- **Login**: Authenticated login with JWT tokens
- **Session Management**: Token-based session management with 7-day expiration
- **Logout**: Secure logout functionality

### 2. Role-Based Access Control (RBAC)

The system supports three user roles with different permission levels:

#### Admin

- Full access to all features
- Can manage all users and assign roles
- Can create, edit, and delete all resources
- Access: Dashboard, Issues, AMCs, Assets, Users management page

**Permissions:**

- View, Create, Edit, Delete all resources
- Manage user roles
- Full access to reports

#### Manager

- Can manage most resources but cannot delete them
- Cannot manage user roles
- Limited to creating and editing only

**Permissions:**

- View: All resources
- Create: AMCs, Assets, Issues, Alerts, Reports
- Edit: All created resources
- Delete: None
- Manage Users: No

#### Member

- Can only view public data and report issues
- Read-only access to most features

**Permissions:**

- View: AMCs, Assets, Issues, Alerts
- Create: Issues only
- Edit: None
- Delete: None
- Manage Users: No

## File Structure

### Authentication Context & Utilities

```
src/lib/auth/
├── context.tsx          # AuthProvider and useAuth hook
├── permissions.ts       # Role-based permission definitions
└── utils.ts             # JWT token generation and verification
```

### Authentication Pages

```
src/app/auth/
├── login/page.tsx       # Login page
└── signup/page.tsx      # Sign up page
```

### User Management

```
src/app/
├── users/page.tsx       # Admin user management page
└── profile/page.tsx     # User profile page
```

### Authentication API Routes

```
src/app/api/auth/
├── login/route.ts       # Login endpoint
├── signup/route.ts      # Sign up endpoint
├── me/route.ts          # Get current user
└── update-role/route.ts # Update user role (admin only)

src/app/api/
└── users/route.ts       # List users (admin only)
```

### Components

```
src/components/
├── NavBar.tsx           # Navigation bar with auth status
└── ProtectedLayout.tsx  # Wrapper for protected pages
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'manager', 'member'
  flat_no VARCHAR(50),
  wing VARCHAR(50),
  society_id UUID,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## How to Use

### 1. Sign Up

1. Navigate to `/auth/signup`
2. Fill in the registration form:
   - Full Name
   - Email
   - Phone Number
   - Select Society
   - Password (min 6 characters)
3. Click "Sign up"
4. You'll be logged in automatically and redirected to dashboard

**Default Role**: New users are created with the 'member' role

### 2. Login

1. Navigate to `/auth/login`
2. Enter your email and password
3. Click "Sign in"
4. You'll be redirected to the dashboard

### 3. Change User Password

Users can change their password through the profile page (feature to be added).

### 4. Admin: Manage User Roles

1. Login as an admin user
2. Click on "Users" in the navigation menu
3. You'll see a list of all society members
4. Click "Change Role" on any user
5. Select the new role from the dropdown
6. Click "Update Role"

The user's role will be updated immediately.

## Security Considerations

### Password Security

- Passwords are hashed using SHA256 algorithm
- Never stored in plain text
- Minimum 6 characters required

### Token Security

- JWT tokens are used for session management
- Tokens expire after 7 days
- Tokens are stored in localStorage
- Token verification uses HMAC-SHA256

### API Security

- All protected endpoints verify JWT tokens
- Admin-only endpoints check user role before allowing access
- Token is sent via Authorization header

### Best Practices Implemented

- Session validation on app load
- Automatic logout on token expiration
- Protected routes redirect to login
- Password verification on every login attempt
- Account status (is_active) is checked before allowing login

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`

Login with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "role": "member",
    "society_id": "uuid",
    "is_active": true
  }
}
```

#### POST `/api/auth/signup`

Create a new user account.

**Request:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "societyId": "uuid"
}
```

**Response (201):**

```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "role": "member",
    "society_id": "uuid",
    "is_active": true
  }
}
```

#### GET `/api/auth/me`

Get current logged-in user information.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": "member",
  "society_id": "uuid",
  "is_active": true
}
```

#### POST `/api/auth/update-role`

Update a user's role (admin only).

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request:**

```json
{
  "userId": "uuid",
  "newRole": "manager"
}
```

**Response (200):**

```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "manager"
  }
}
```

#### GET `/api/users`

List all users in a society (admin only).

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

- `society_id`: Filter users by society ID

**Response (200):**

```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "role": "member",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Email and password are required"
}
```

### 401 Unauthorized

```json
{
  "error": "Invalid email or password"
}
```

### 403 Forbidden

```json
{
  "error": "Only admins can update user roles"
}
```

### 404 Not Found

```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "An error occurred during login"
}
```

## Using the Authentication Context

### In React Components

```tsx
"use client";

import { useAuth } from "@/lib/auth/context";

export function MyComponent() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.full_name}</p>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Checking Permissions

```tsx
import { canAccess, isAdmin } from "@/lib/auth/permissions";

if (isAdmin(user)) {
  // Show admin panel
}

if (canAccess(user, "amcs", "delete")) {
  // Show delete button
}
```

## Future Enhancements

1. **Password Reset**: Implement forgot password functionality
2. **Two-Factor Authentication (2FA)**: Add optional 2FA for added security
3. **OAuth Integration**: Support Google, Microsoft login
4. **Session History**: Track login history per user
5. **Account Lockout**: Lock accounts after multiple failed login attempts
6. **Audit Logging**: Log all role changes and sensitive operations
7. **Bulk User Import**: Import users from CSV file
8. **Email Verification**: Verify user email before account activation

## Testing

### Test Account Credentials

Create test accounts with different roles:

1. **Admin Account**

   - Email: admin@example.com
   - Password: admin123
   - Role: admin

2. **Manager Account**

   - Email: manager@example.com
   - Password: manager123
   - Role: manager

3. **Member Account**
   - Email: member@example.com
   - Password: member123
   - Role: member

## Troubleshooting

### "Invalid email or password" error

- Check that the email exists in the database
- Verify password is correct
- Ensure account is active (is_active = true)

### "Only admins can..." error

- Ensure you're logged in with an admin account
- Check user role in the users table

### Token expired error

- User needs to log in again
- Clear localStorage and refresh the page

### Redirect loop

- Check if ProtectedLayout is properly wrapped
- Verify token is being saved correctly
- Check browser console for errors
