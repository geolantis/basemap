-- Add Pelican Corp users to the Map Configuration Service
-- Date: December 2024
-- Users to add:
--   1. Arpine Jenderedjian (arpine.jenderedjian@pelicancorp.com)
--   2. Thomas Hohaeuser (thomas.hohaeuser@pelicancorp.com)

-- =====================================================
-- STEP 1: CREATE USERS IN SUPABASE AUTH
-- =====================================================
-- These users need to be created through the Supabase Dashboard
-- Go to: https://app.supabase.com/project/wphrytrrikfkwehwahqc/auth/users
-- 
-- Click "Invite User" for each user:
-- 
-- User 1:
--   Email: arpine.jenderedjian@pelicancorp.com
--   Full Name: Arpine Jenderedjian
--   Password: (User will set on first login)
--   Send invite email: Yes
--
-- User 2:
--   Email: thomas.hohaeuser@pelicancorp.com
--   Full Name: Thomas Hohaeuser
--   Password: (User will set on first login)
--   Send invite email: Yes

-- =====================================================
-- STEP 2: ADD USERS TO APPLICATION USERS TABLE
-- =====================================================
-- After creating users in Supabase Auth, run this SQL to add them to the users table
-- This needs to be run AFTER the users have been created in Supabase Auth
-- and you have their user IDs

-- First, get the user IDs from Supabase Auth (you'll see these after creating the users)
-- Then uncomment and update the UUIDs below:

/*
-- Insert Arpine Jenderedjian
INSERT INTO users (id, email, role)
VALUES (
  'REPLACE_WITH_ARPINE_USER_ID', -- Get this from Supabase Auth after creating the user
  'arpine.jenderedjian@pelicancorp.com',
  'admin' -- Setting as admin role for full access
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin',
    updated_at = NOW();

-- Insert Thomas Hohaeuser
INSERT INTO users (id, email, role)
VALUES (
  'REPLACE_WITH_THOMAS_USER_ID', -- Get this from Supabase Auth after creating the user
  'thomas.hohaeuser@pelicancorp.com',
  'admin' -- Setting as admin role for full access
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin',
    updated_at = NOW();
*/

-- =====================================================
-- STEP 3: VERIFY USER ACCESS
-- =====================================================
-- After adding users, verify they have been created correctly:

-- Check all users with admin role
SELECT id, email, role, created_at, updated_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Check specific Pelican users
SELECT id, email, role, created_at
FROM users
WHERE email IN (
  'arpine.jenderedjian@pelicancorp.com',
  'thomas.hohaeuser@pelicancorp.com'
);

-- =====================================================
-- AUDIT LOG
-- =====================================================
-- The system will automatically log these user creations in the audit_logs table
-- You can view the audit trail with:

SELECT 
  action,
  entity_type,
  new_values->>'email' as user_email,
  new_values->>'role' as user_role,
  created_at
FROM audit_logs
WHERE entity_type = 'users'
  AND new_values->>'email' IN (
    'arpine.jenderedjian@pelicancorp.com',
    'thomas.hohaeuser@pelicancorp.com'
  )
ORDER BY created_at DESC;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Users must be created in Supabase Auth first before adding to the users table
-- 2. The user ID in the users table must match the ID from Supabase Auth
-- 3. Both users are set as 'admin' role for full map configuration access
-- 4. Users will receive email invitations to set their passwords
-- 5. After first login, users can access: https://mapconfig.geolantis.com
-- 6. Admin users can:
--    - View all map configurations
--    - Create new map configurations
--    - Edit existing configurations
--    - Delete configurations
--    - Manage API keys
--    - View audit logs