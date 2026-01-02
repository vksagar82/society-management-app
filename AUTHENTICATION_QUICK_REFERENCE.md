# Quick Reference Guide - User Authentication

## 🎯 User Roles at a Glance

| Feature               | Admin | Manager | Member |
| --------------------- | :---: | :-----: | :----: |
| **Dashboard Access**  |  ✅   |   ✅    |   ✅   |
| **View AMCs**         |  ✅   |   ✅    |   ✅   |
| **Create AMC**        |  ✅   |   ✅    |   ❌   |
| **Edit AMC**          |  ✅   |   ✅    |   ❌   |
| **Delete AMC**        |  ✅   |   ❌    |   ❌   |
| **View Assets**       |  ✅   |   ✅    |   ✅   |
| **Create Asset**      |  ✅   |   ✅    |   ❌   |
| **Edit Asset**        |  ✅   |   ✅    |   ❌   |
| **Delete Asset**      |  ✅   |   ❌    |   ❌   |
| **View Issues**       |  ✅   |   ✅    |   ✅   |
| **Create Issue**      |  ✅   |   ✅    |   ✅   |
| **Edit Issue**        |  ✅   |   ✅    |   ❌   |
| **Delete Issue**      |  ✅   |   ❌    |   ❌   |
| **View Users**        |  ✅   |   ❌    |   ❌   |
| **Manage User Roles** |  ✅   |   ❌    |   ❌   |
| **View Reports**      |  ✅   |   ✅    |   ❌   |

## 🔐 Authentication Endpoints

```
POST   /api/auth/login        → Login with email & password
POST   /api/auth/signup       → Create new account
GET    /api/auth/me           → Get current user (requires token)
POST   /api/auth/update-role  → Change user role (admin only)
GET    /api/users             → List users (admin only)
```

## 🌐 Public Pages

| URL            | Description  |
| -------------- | ------------ |
| `/auth/login`  | Login page   |
| `/auth/signup` | Sign up page |
| `/`            | Home page    |

## 🔒 Protected Pages

| URL          | Required Role | Description     |
| ------------ | :-----------: | --------------- |
| `/dashboard` |      Any      | Main dashboard  |
| `/profile`   |      Any      | User profile    |
| `/issues`    |      Any      | Issues list     |
| `/amcs`      |      Any      | AMCs list       |
| `/assets`    |      Any      | Assets list     |
| `/users`     |     Admin     | User management |

## 📋 Test Accounts

### Create via Signup (Recommended)

1. Go to http://localhost:3000/auth/signup
2. Fill in form with any data
3. New account created with 'member' role
4. Auto-logged in after signup

### Or Use These Test Accounts

```
Admin:    admin@test.com / admin123
Manager:  manager@test.com / manager123
Member:   member@test.com / member123
```

## 🚀 Quick Start

### 1. First Time Setup

```bash
# 1. Update .env.local with your Supabase credentials
# 2. Set JWT_SECRET (change from default in production)
# 3. Run database migration (add password_hash column)
# 4. Start app: npm run dev
```

### 2. Create First Admin Account

```bash
# Option A: Using signup page
→ Go to /auth/signup
→ Create account (defaults to member role)
→ Use database to update role to admin

# Option B: Using SQL
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 3. Login & Start Using

```bash
→ Go to /auth/login
→ Enter email and password
→ Access /users page (if admin)
→ Manage user roles
```

## 💾 Database Schema

```sql
-- Users table structure
CREATE TABLE users (
  id              UUID PRIMARY KEY
  email           VARCHAR(255) UNIQUE NOT NULL
  phone           VARCHAR(20) UNIQUE NOT NULL
  full_name       VARCHAR(255) NOT NULL
  password_hash   VARCHAR(255) NOT NULL      -- NEW
  role            VARCHAR(50) DEFAULT 'member'
  society_id      UUID
  is_active       BOOLEAN DEFAULT true
  last_login      TIMESTAMP                  -- NEW
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
)
```

## 🔧 API Request Examples

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

### Get Current User

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Change User Role (Admin Only)

```bash
curl -X POST http://localhost:3000/api/auth/update-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "userId": "user-uuid",
    "newRole": "manager"
  }'
```

## 🎨 UI Components

### NavBar

- Shows current user
- User menu dropdown
- Login/Signup links for guests
- "Users" menu item for admins only

### Protected Layout

- Wraps protected pages
- Redirects to login if not authenticated
- Shows loading spinner during auth check

## 📁 File Structure

```
src/
├── lib/auth/
│   ├── context.tsx         # Auth provider & hook
│   ├── permissions.ts      # Permission definitions
│   └── utils.ts            # Password hashing & JWT
│
├── app/
│   ├── auth/
│   │   ├── login/page.tsx  # Login page
│   │   └── signup/page.tsx # Signup page
│   │
│   ├── profile/page.tsx    # User profile
│   ├── users/page.tsx      # Admin user management
│   │
│   ├── api/auth/
│   │   ├── login/route.ts
│   │   ├── signup/route.ts
│   │   ├── me/route.ts
│   │   └── update-role/route.ts
│   │
│   └── api/users/route.ts
│
└── components/
    ├── NavBar.tsx         # Navigation with auth
    └── ProtectedLayout.tsx # Auth wrapper
```

## ⚙️ Configuration

### Change JWT Expiration

Edit `src/lib/auth/utils.ts` - `generateToken()` function:

```typescript
exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
// Change to:
exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 1 day
```

### Change Password Requirements

Edit `src/app/api/auth/signup/route.ts`:

```typescript
if (password.length < 6) {  // Change 6 to desired length
  return NextResponse.json(...);
}
```

### Adjust Role Permissions

Edit `src/lib/auth/permissions.ts` - `rolePermissions` object

## 🐛 Debugging

### Check Login Status

```javascript
// In browser console
const token = localStorage.getItem("auth_token");
console.log("Token exists:", !!token);
```

### Check Current User

```javascript
// In browser console
const token = localStorage.getItem("auth_token");
fetch("/api/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
})
  .then((r) => r.json())
  .then(console.log);
```

### Check Database Users

```sql
SELECT email, full_name, role, is_active FROM users;
```

## 🔍 Common Issues & Fixes

| Issue                       | Fix                                       |
| --------------------------- | ----------------------------------------- |
| "Invalid email or password" | Check user exists and password is correct |
| "Only admins can..."        | Verify user role is 'admin' in database   |
| Token not persisting        | Check localStorage is enabled in browser  |
| Can't access /users         | Must be logged in as admin                |
| Redirect loop               | Clear localStorage and refresh            |

## 📚 Documentation Files

| File                               | Purpose                       |
| ---------------------------------- | ----------------------------- |
| `AUTHENTICATION.md`                | Complete system documentation |
| `AUTHENTICATION_SETUP.md`          | Setup & testing guide         |
| `AUTHENTICATION_IMPLEMENTATION.md` | Implementation summary        |

## 🎓 Learning Path

1. **Understand Roles** → Read "User Roles at a Glance" above
2. **Setup System** → Follow `AUTHENTICATION_SETUP.md`
3. **Test Functionality** → Create test accounts and try features
4. **API Integration** → Reference API examples above
5. **Production** → Read AUTHENTICATION.md for security

## 🚨 Important Security Notes

⚠️ **Before Production:**

- Change `JWT_SECRET` to a secure random value
- Enable HTTPS on all connections
- Implement password reset functionality
- Add rate limiting to auth endpoints
- Enable email verification
- Consider adding 2FA

## 📞 Support

For detailed information, see:

- Complete docs: `AUTHENTICATION.md`
- Setup guide: `AUTHENTICATION_SETUP.md`
- Implementation: `AUTHENTICATION_IMPLEMENTATION.md`

---

**Last Updated**: January 2, 2026 | **Version**: 1.0
