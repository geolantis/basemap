-- Quick Setup: Minimal changes to existing database
-- This script adds only the essential columns needed for the auth system

-- 1. Add is_public column to existing map_configs table (if not exists)
ALTER TABLE map_configs 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 2. Set all existing configs as public
UPDATE map_configs 
SET is_public = true 
WHERE is_public IS NULL;

-- 3. Create a simple admins table for authentication
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE map_configs ENABLE ROW LEVEL SECURITY;

-- 5. Create simple RLS policy - everyone can read public configs
DROP POLICY IF EXISTS "Anyone can view public configs" ON map_configs;
CREATE POLICY "Anyone can view public configs" 
  ON map_configs FOR SELECT 
  USING (is_active = true AND is_public = true);

-- 6. Insert a test admin (password: admin123)
-- IMPORTANT: Change this password immediately in production!
INSERT INTO admins (email, password_hash, role) 
VALUES (
  'admin@example.com',
  '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l4bVeQgDL6VIkxJ9IPJPSxKjmWW',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- That's it! The minimal setup is complete.
-- The public API will work without authentication
-- The admin portal will require login