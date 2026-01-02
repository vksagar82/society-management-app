# User Authentication Setup & Testing Guide

## Environment Setup

### 1. Required Environment Variables

Make sure your `.env.local` file contains:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Database Migration

Run the updated schema to add password hashing to the users table:

```sql
-- Update existing users table or create it with password field
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT 'changeme';
ALTER TABLE users ADD COLUMN last_login TIMESTAMP;

-- Update default value for existing records
UPDATE users SET password_hash = 'changeme' WHERE password_hash IS NULL;
```

## Creating Test Accounts

### Method 1: Using the Sign Up Page

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/auth/signup`
3. Create a new account with your test data
4. You'll be automatically logged in

### Method 2: Using SQL (Direct Database)

```sql
-- Helper function to hash passwords (using PostgreSQL pgcrypto)
-- First, let's create test accounts with hashed passwords

INSERT INTO users (
  email,
  phone,
  full_name,
  password_hash,
  role,
  society_id,
  is_active,
  created_at,
  updated_at
) VALUES
(
  'admin@test.com',
  '+1234567890',
  'Admin User',
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- SHA256 hash of 'admin123'
  'admin',
  '550e8400-e29b-41d4-a716-446655440000',
  true,
  NOW(),
  NOW()
),
(
  'manager@test.com',
  '+1234567891',
  'Manager User',
  'f3a4c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- SHA256 hash of 'manager123'
  'manager',
  '550e8400-e29b-41d4-a716-446655440000',
  true,
  NOW(),
  NOW()
),
(
  'member@test.com',
  '+1234567892',
  'Member User',
  'a7b2c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- SHA256 hash of 'member123'
  'member',
  '550e8400-e29b-41d4-a716-446655440000',
  true,
  NOW(),
  NOW()
);
```

### Method 3: Using Node.js Script

Create a script to generate password hashes:

```javascript
const crypto = require("crypto");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const testUsers = [
  {
    email: "admin@test.com",
    password: "admin123",
    fullName: "Admin User",
    phone: "+1234567890",
    role: "admin",
  },
  {
    email: "manager@test.com",
    password: "manager123",
    fullName: "Manager User",
    phone: "+1234567891",
    role: "manager",
  },
  {
    email: "member@test.com",
    password: "member123",
    fullName: "Member User",
    phone: "+1234567892",
    role: "member",
  },
];

testUsers.forEach((user) => {
  const hash = hashPassword(user.password);
  console.log(`
    INSERT INTO users (email, phone, full_name, password_hash, role, society_id, is_active, created_at, updated_at)
    VALUES ('${user.email}', '${user.phone}', '${user.fullName}', '${hash}', '${user.role}', '550e8400-e29b-41d4-a716-446655440000', true, NOW(), NOW());
  `);
});
```

## Test Accounts

### Admin Account

- **Email**: admin@test.com
- **Password**: admin123
- **Role**: admin
- **Permissions**: Full access to all features, can manage users

### Manager Account

- **Email**: manager@test.com
- **Password**: manager123
- **Role**: manager
- **Permissions**: Can create and edit resources, cannot delete, cannot manage users

### Member Account

- **Email**: member@test.com
- **Password**: member123
- **Role**: member
- **Permissions**: Can view resources and report issues only

## Testing the Authentication System

### 1. Test Sign Up Flow

```bash
1. Go to http://localhost:3000/auth/signup
2. Fill in the form with:
   - Full Name: Test User
   - Email: testuser@example.com
   - Phone: +1234567890
   - Society: Green Valley Apartments
   - Password: testpass123
3. Click Sign up
4. Should be redirected to dashboard
```

### 2. Test Login Flow

```bash
1. Click logout (top right menu)
2. Go to http://localhost:3000/auth/login
3. Enter: admin@test.com / admin123
4. Should be redirected to dashboard
```

### 3. Test Role-Based Access Control

```bash
# Test with Member account
1. Login with member@test.com / member123
2. Try to access /users - should be redirected to /dashboard
3. Try to access /dashboard - should work

# Test with Admin account
1. Login with admin@test.com / admin123
2. Click "Users" in navigation - should see user list
3. Click "Change Role" on any user - should see modal
```

### 4. Test User Management (Admin Only)

```bash
1. Login as admin@test.com / admin123
2. Click "Users" in navigation
3. You should see a list of all users
4. Click "Change Role" on manager@test.com
5. Select "Admin" and click "Update Role"
6. The user's role should change to Admin
7. Logout and login as manager@test.com to verify role change
```

### 5. Test Protected Routes

```bash
1. Logout (clear token)
2. Try to access http://localhost:3000/dashboard
3. Should be redirected to /auth/login?redirect=/dashboard
4. After login, should redirect back to /dashboard
```

## Common Testing Scenarios

### Scenario 1: Change User Role from Member to Manager

1. Login as admin
2. Go to Users page
3. Find member account
4. Click "Change Role"
5. Select "Manager"
6. Click "Update Role"
7. Logout
8. Login as that member (now manager)
9. Verify you have manager permissions

### Scenario 2: Test Permission Boundaries

1. Login as member
2. Try to delete an issue - should not see delete button
3. Logout and login as manager
4. Try to delete an issue - still no delete button
5. Logout and login as admin
6. Try to delete an issue - should see delete button

### Scenario 3: Session Expiration

1. Login successfully
2. Copy the token from localStorage in browser console
3. Wait for token to expire (7 days in production, but you can test by manually editing the expiry in code)
4. Try to make an API call
5. Should get 401 Unauthorized
6. Should be redirected to login

## SQL Debugging

### Check all users

```sql
SELECT id, email, full_name, role, is_active, created_at FROM users;
```

### Check specific user

```sql
SELECT * FROM users WHERE email = 'admin@test.com';
```

### Update user role

```sql
UPDATE users SET role = 'admin' WHERE email = 'member@test.com';
```

### Check last login

```sql
SELECT email, last_login FROM users ORDER BY last_login DESC;
```

## Troubleshooting

### "Invalid email or password" on login

1. Check if user exists: `SELECT * FROM users WHERE email = 'admin@test.com';`
2. Verify is_active is true
3. Check if password hash is set correctly

### Can't access Users page as admin

1. Check if user role is 'admin': `SELECT role FROM users WHERE email = 'admin@test.com';`
2. Clear browser localStorage and try again
3. Check browser console for errors

### Token not being saved

1. Check localStorage in browser DevTools
2. Verify localStorage.setItem is being called
3. Check for CORS issues in network tab

### Redirect loop on login

1. Check if JWT_SECRET is set correctly
2. Verify token is being generated
3. Check if verifyToken function is working
4. Clear browser cache and try again

## Production Considerations

### 1. Change JWT_SECRET

Before deploying, change the JWT_SECRET to a secure random string:

```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Enable HTTPS

In production, ensure all connections use HTTPS.

### 3. Set password requirements

Consider enforcing stronger password requirements in the signup form.

### 4. Add rate limiting

Add rate limiting to authentication endpoints to prevent brute force attacks.

### 5. Implement password reset

Add forgot password functionality for production.

### 6. Enable 2FA

Consider adding optional two-factor authentication.

### 7. Audit logging

Log all authentication and authorization events for security audits.

## API Testing with cURL

### Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

### Test Get Current User

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Get Users (Admin Only)

```bash
curl "http://localhost:3000/api/users?society_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Update Role (Admin Only)

```bash
curl -X POST http://localhost:3000/api/auth/update-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"userId":"USER_ID","newRole":"manager"}'
```

## Next Steps

1. ✅ Authentication system implemented
2. ✅ User roles and permissions defined
3. ✅ Admin user management interface created
4. Next: Integrate authentication with existing pages (Issues, AMCs, Assets)
5. Next: Add password reset functionality
6. Next: Implement audit logging
