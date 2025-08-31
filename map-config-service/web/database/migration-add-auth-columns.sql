-- Migration: Add authentication and security columns to existing tables
-- Run this if you already have a map_configs table

-- Add missing columns to map_configs table if they don't exist
ALTER TABLE map_configs 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS public_style_url TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID,
ADD COLUMN IF NOT EXISTS deleted_by UUID,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update existing records to be public by default
UPDATE map_configs 
SET is_public = true 
WHERE is_public IS NULL;

-- Create Admin Users Table (if not exists)
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'super_admin', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Authentication Logs Table
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES admins(id),
  event_type VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Configuration Audit Log Table
CREATE TABLE IF NOT EXISTS config_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID REFERENCES map_configs(id),
  user_id UUID REFERENCES admins(id),
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  previous_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_map_configs_public ON map_configs(is_active, is_public);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user ON auth_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_config ON config_audit_log(config_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE map_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public configs are viewable by everyone" ON map_configs;
DROP POLICY IF EXISTS "Admins have full access to configs" ON map_configs;

-- Create new RLS policies
CREATE POLICY "Public configs are viewable by everyone" 
  ON map_configs FOR SELECT 
  USING (is_active = true AND is_public = true);

-- For authenticated admin access (using Supabase Auth)
CREATE POLICY "Authenticated users can manage configs" 
  ON map_configs FOR ALL 
  USING (auth.role() = 'authenticated');

-- Insert default admin user (password: ChangeMe123! - MUST CHANGE IN PRODUCTION!)
-- Note: This uses bcrypt hash - generate your own for production
INSERT INTO admins (email, password_hash, role) 
VALUES (
  'admin@example.com',
  '$2a$10$YourHashHere', -- Generate with: bcrypt.hash('YourPassword', 10)
  'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON map_configs TO anon;
GRANT ALL ON map_configs TO authenticated;
GRANT ALL ON admins TO authenticated;
GRANT ALL ON auth_logs TO authenticated;
GRANT ALL ON config_audit_log TO authenticated;