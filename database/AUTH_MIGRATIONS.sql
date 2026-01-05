-- SQL Migrations for Authentication System
-- Run these SQL commands in your Supabase SQL editor

-- ============================================
-- 1. ADD AUTHENTICATION FIELDS TO USERS TABLE
-- ============================================

-- Add password_hash field if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT 'changeme';

-- Add last_login field if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- ============================================
-- 2. VERIFY TABLE STRUCTURE
-- ============================================

-- Check users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ============================================
-- 3. CREATE TEST ACCOUNTS (OPTIONAL)
-- ============================================

-- Generate SHA256 hashes in PostgreSQL:
-- Password: developer123 → Hash: 6c3a08576d07c25dba1331bdcd66769adb023ecca3dd7f65bb804cf076d78a54
-- Password: admin123 → Hash: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
-- Password: manager123 → Hash: 866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5
-- Password: member123 → Hash: 5600376e863d2f57a053518f324ad3840b0bc2348b573af281a7b7cbe7a228c6

-- Note: Use this NodeJS to generate real hashes:
-- const crypto = require('crypto');
-- crypto.createHash('sha256').update('password').digest('hex')

-- Create Developer Test User
INSERT INTO users (email, phone, full_name, password_hash, global_role, is_active, created_at, updated_at)
VALUES (
  'developer@test.com',
  '+1234567889',
  'Developer Test User',
  '6c3a08576d07c25dba1331bdcd66769adb023ecca3dd7f65bb804cf076d78a54',
  'developer',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET global_role = 'developer';

-- Create Admin Test User
INSERT INTO users (email, phone, full_name, password_hash, global_role, is_active, created_at, updated_at)
VALUES (
  'admin@test.com',
  '+1234567890',
  'Admin Test User',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET global_role = 'admin';

-- Create Manager Test User
INSERT INTO users (email, phone, full_name, password_hash, global_role, is_active, created_at, updated_at)
VALUES (
  'manager@test.com',
  '+1234567891',
  'Manager Test User',
  '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5',
  'manager',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET global_role = 'manager';

-- Create Member Test User
INSERT INTO users (email, phone, full_name, password_hash, global_role, is_active, created_at, updated_at)
VALUES (
  'member@test.com',
  '+1234567892',
  'Member Test User',
  '5600376e863d2f57a053518f324ad3840b0bc2348b573af281a7b7cbe7a228c6',
  'member',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET global_role = 'member';

-- ============================================
-- 4. VERIFY TEST ACCOUNTS CREATED
-- ============================================

SELECT id, email, full_name, global_role, is_active FROM users 
WHERE email IN ('developer@test.com', 'admin@test.com', 'manager@test.com', 'member@test.com')
ORDER BY email;

-- ============================================
-- 5. UPDATE EXISTING USER ROLES (OPTIONAL)
-- ============================================

-- Make a specific user a developer
-- UPDATE users SET global_role = 'developer' WHERE email = 'your-email@example.com';

-- Make a specific user an admin
-- UPDATE users SET global_role = 'admin' WHERE email = 'your-email@example.com';

-- Make a specific user a manager
-- UPDATE users SET global_role = 'manager' WHERE email = 'your-email@example.com';

-- Make a specific user a member
-- UPDATE users SET global_role = 'member' WHERE email = 'your-email@example.com';

-- ============================================
-- 6. VIEW ALL USERS WITH ROLES
-- ============================================

SELECT 
  id,
  email,
  phone,
  full_name,
  global_role,
  is_active,
  last_login,
  created_at
FROM users
ORDER BY created_at DESC;

-- ============================================
-- 7. COUNT USERS BY ROLE
-- ============================================

SELECT 
  global_role,
  COUNT(*) as count
FROM users
GROUP BY global_role
ORDER BY count DESC;

-- ============================================
-- 8. FIND ACTIVE DEVELOPERS
-- ============================================

SELECT 
  id,
  email,
  full_name,
  created_at
FROM users
WHERE global_role = 'developer' AND is_active = true
ORDER BY created_at DESC;

-- ============================================
-- 9. FIND ACTIVE ADMINS
-- ============================================

SELECT 
  id,
  email,
  full_name,
  created_at
FROM users
WHERE global_role = 'admin' AND is_active = true
ORDER BY created_at DESC;

-- ============================================
-- 10. DEACTIVATE A USER (PREVENT LOGIN)
-- ============================================

-- UPDATE users SET is_active = false WHERE email = 'user@example.com';

-- ============================================
-- 11. VIEW LAST LOGIN HISTORY
-- ============================================

SELECT 
  email,
  full_name,
  last_login,
  CASE 
    WHEN last_login IS NULL THEN 'Never'
    WHEN last_login > NOW() - INTERVAL '1 day' THEN 'Today'
    WHEN last_login > NOW() - INTERVAL '7 days' THEN 'This Week'
    ELSE 'Older'
  END as activity
FROM users
WHERE is_active = true
ORDER BY last_login DESC NULLS LAST;

-- ============================================
-- 12. RESET USER PASSWORD
-- ============================================

-- To reset a user's password, generate a new hash and update:
-- UPDATE users SET password_hash = 'new-hash-here' WHERE email = 'user@example.com';

-- Example: Reset developer test password to 'developer123'
-- UPDATE users SET password_hash = '6c3a08576d07c25dba1331bdcd66769adb023ecca3dd7f65bb804cf076d78a54' 
-- WHERE email = 'developer@test.com';

-- Example: Reset admin test password to 'admin123'
-- UPDATE users SET password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' 
-- WHERE email = 'admin@test.com';

-- ============================================
-- 13. CREATE AUDIT LOG TABLE (OPTIONAL FOR FUTURE)
-- ============================================

-- CREATE TABLE IF NOT EXISTS audit_logs (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   user_id UUID NOT NULL REFERENCES users(id),
--   action VARCHAR(100) NOT NULL,
--   resource_type VARCHAR(100),
--   resource_id UUID,
--   old_value JSONB,
--   new_value JSONB,
--   ip_address INET,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- ============================================
-- 14. CREATE ADMIN FUNCTION (OPTIONAL)
-- ============================================

-- CREATE OR REPLACE FUNCTION promote_to_admin(user_email VARCHAR)
-- RETURNS TABLE(id UUID, email VARCHAR, global_role VARCHAR) AS $$
-- BEGIN
--   UPDATE users SET global_role = 'admin' WHERE email = user_email;
--   RETURN QUERY SELECT users.id, users.email, users.global_role FROM users WHERE users.email = user_email;
-- END;
-- $$ LANGUAGE plpgsql;

-- Usage: SELECT promote_to_admin('user@example.com');

-- ============================================
-- 15. CLEANUP: DELETE TEST DATA (IF NEEDED)
-- ============================================

-- DELETE FROM users WHERE email IN ('developer@test.com', 'admin@test.com', 'manager@test.com', 'member@test.com');

-- ============================================
-- 16. VERIFY FINAL SCHEMA
-- ============================================

-- This query shows the final users table structure
\d users

-- ============================================
-- NOTES:
-- ============================================
-- 1. All passwords are hashed using SHA256
-- 2. Never store plain text passwords
-- 3. Test accounts use simple passwords for demo only
-- 4. Change passwords before production deployment
-- 5. Use proper password hashing in your application
-- 6. Consider adding password complexity requirements
-- 7. Implement password reset functionality for production
-- 8. Track login attempts for security
-- 9. Monitor failed authentication attempts
-- 10. Audit all role changes

-- ============================================
-- GENERATING PASSWORD HASHES
-- ============================================
-- Use Node.js to generate hashes:
--
-- const crypto = require('crypto');
-- function hashPassword(password) {
--   return crypto.createHash('sha256').update(password).digest('hex');
-- }
-- console.log(hashPassword('your-password'));
--
-- Or use PostgreSQL pgcrypto extension:
-- SELECT digest('password', 'sha256') as hash;

-- ============================================
-- END OF MIGRATIONS
-- ============================================
