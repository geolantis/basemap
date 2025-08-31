-- Create an admin user in Supabase Auth
-- Run this in the Supabase SQL Editor

-- Option 1: Use Supabase Dashboard
-- Go to: Authentication > Users > Invite User
-- Email: admin@example.com
-- Password: Set your own secure password

-- Option 2: Create user via SQL (if you have the auth schema access)
-- Note: This requires the service_role key or dashboard access

-- First, ensure the is_public column exists
ALTER TABLE map_configs 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Set all existing configs as public
UPDATE map_configs 
SET is_public = true 
WHERE is_public IS NULL;

-- Enable RLS
ALTER TABLE map_configs ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
DROP POLICY IF EXISTS "Public configs are viewable by everyone" ON map_configs;
CREATE POLICY "Public configs are viewable by everyone" 
  ON map_configs FOR SELECT 
  USING (is_active = true AND (is_public = true OR is_public IS NULL));

-- Create policy for authenticated users to manage configs
DROP POLICY IF EXISTS "Authenticated users can manage configs" ON map_configs;
CREATE POLICY "Authenticated users can manage configs" 
  ON map_configs FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON map_configs TO authenticated;
GRANT SELECT ON map_configs TO anon;