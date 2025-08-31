-- Map Configuration Service Database Setup
-- Run this in your Supabase SQL Editor

-- Step 1: Create all tables and structures
-- ==========================================

-- Create map_configs table
CREATE TABLE IF NOT EXISTS map_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('vtc', 'wmts', 'wms')),
  style TEXT,
  original_style TEXT,
  country VARCHAR(100) DEFAULT 'Global',
  flag VARCHAR(10) DEFAULT '🌐',
  layers TEXT[],
  metadata JSONB,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create api_keys table for secure storage
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(100) NOT NULL,
  key_name VARCHAR(100) NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, key_name)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_map_configs_country ON map_configs(country);
CREATE INDEX IF NOT EXISTS idx_map_configs_type ON map_configs(type);
CREATE INDEX IF NOT EXISTS idx_map_configs_is_active ON map_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_map_configs_updated_at ON map_configs;
CREATE TRIGGER update_map_configs_updated_at
  BEFORE UPDATE ON map_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create audit log trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers to main tables
DROP TRIGGER IF EXISTS audit_map_configs ON map_configs;
CREATE TRIGGER audit_map_configs
  AFTER INSERT OR UPDATE OR DELETE ON map_configs
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Step 2: Enable Row Level Security
-- ==================================

ALTER TABLE map_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Map configs policies
DROP POLICY IF EXISTS "Public can view active map configs" ON map_configs;
CREATE POLICY "Public can view active map configs"
  ON map_configs FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Editors can insert map configs" ON map_configs;
CREATE POLICY "Editors can insert map configs"
  ON map_configs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can update map configs" ON map_configs;
CREATE POLICY "Editors can update map configs"
  ON map_configs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins can delete map configs" ON map_configs;
CREATE POLICY "Admins can delete map configs"
  ON map_configs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- API keys policies (admin only)
DROP POLICY IF EXISTS "Only admins can manage API keys" ON api_keys;
CREATE POLICY "Only admins can manage API keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Audit logs policies (read-only for admins)
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Step 3: Insert initial sample data (5 maps for testing)
-- ========================================================

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE map_configs CASCADE;

-- Insert sample map configurations
INSERT INTO map_configs (name, label, type, style, original_style, country, flag, metadata, is_active) VALUES
  ('basemap_at_standard', 'Basemap AT Standard', 'vtc', 'https://raw.githubusercontent.com/basemap-at/styles/main/styles/basemap-v2.json', 'https://raw.githubusercontent.com/basemap-at/styles/main/styles/basemap-v2.json', 'Austria', '🇦🇹', '{"provider": "basemap.at", "attribution": "© basemap.at"}', true),
  ('basemap_de_color', 'Basemap DE Color', 'vtc', 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json', 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json', 'Germany', '🇩🇪', '{"provider": "BKG", "attribution": "© GeoBasis-DE / BKG"}', true),
  ('osm_liberty', 'OSM Liberty', 'vtc', 'https://api.maptiler.com/maps/streets/style.json', 'https://api.maptiler.com/maps/streets/style.json?key={key}', 'Global', '🌐', '{"provider": "MapTiler", "attribution": "© OpenStreetMap contributors", "requiresKey": true}', true),
  ('swiss_topo', 'Swiss Topo Light', 'wmts', 'tiles', '{"tiles": ["https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg"]}', 'Switzerland', '🇨🇭', '{"provider": "swisstopo", "attribution": "© swisstopo", "tileSize": 256}', true),
  ('clockwork_os', 'OS Maps Light', 'vtc', 'https://raw.githubusercontent.com/OrdnanceSurvey/OS-Vector-Tile-API-Stylesheets/master/OS_VTS_3857_Light.json', 'https://raw.githubusercontent.com/OrdnanceSurvey/OS-Vector-Tile-API-Stylesheets/master/OS_VTS_3857_Light.json', 'United Kingdom', '🇬🇧', '{"provider": "Ordnance Survey", "attribution": "© Crown copyright and database rights OS"}', true)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Verify setup
-- ====================

-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('map_configs', 'users', 'api_keys', 'audit_logs');

-- Check row count
SELECT 'map_configs' as table_name, COUNT(*) as row_count FROM map_configs
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'api_keys', COUNT(*) FROM api_keys
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('map_configs', 'users', 'api_keys', 'audit_logs');

-- Success message
SELECT 'Database setup complete! Tables created, RLS enabled, and sample data inserted.' as status;