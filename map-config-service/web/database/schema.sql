-- Map Configurations Table
CREATE TABLE IF NOT EXISTS map_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  style_url TEXT, -- Internal URL with potential API keys
  public_style_url TEXT, -- Public CDN URL without keys
  country VARCHAR(100) DEFAULT 'Global',
  flag VARCHAR(10) DEFAULT '🌐',
  layers JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true, -- Whether config is publicly accessible
  version INTEGER DEFAULT 1,
  created_by UUID,
  updated_by UUID,
  deleted_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Admin Users Table
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

-- API Keys Table (for mobile apps - long-lived)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  key VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 100, -- requests per hour
  allowed_origins TEXT[], -- Optional: restrict to specific app bundles
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Optional expiration
);

-- API Usage Tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id),
  endpoint VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  response_time INTEGER, -- milliseconds
  status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authentication Logs
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES admins(id),
  event_type VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuration Audit Log
CREATE TABLE IF NOT EXISTS config_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID REFERENCES map_configs(id),
  user_id UUID REFERENCES admins(id),
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  previous_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_map_configs_active ON map_configs(is_active, is_public);
CREATE INDEX idx_map_configs_country ON map_configs(country);
CREATE INDEX idx_api_usage_created ON api_usage(created_at DESC);
CREATE INDEX idx_auth_logs_user ON auth_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_log_config ON config_audit_log(config_id, created_at DESC);

-- Row Level Security Policies
ALTER TABLE map_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_audit_log ENABLE ROW LEVEL SECURITY;

-- Public read access for active, public configs
CREATE POLICY "Public configs are viewable by everyone" 
  ON map_configs FOR SELECT 
  USING (is_active = true AND is_public = true);

-- Admin full access to configs
CREATE POLICY "Admins have full access to configs" 
  ON map_configs FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- API key read access
CREATE POLICY "API keys can read public configs" 
  ON map_configs FOR SELECT 
  USING (is_active = true AND is_public = true);

-- Sample Data (for development)
-- Insert default admin user (password: admin123 - CHANGE IN PRODUCTION!)
INSERT INTO admins (email, password_hash, role) 
VALUES (
  'admin@example.com',
  '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l4bVeQgDL6VIkxJ9IPJPSxKjmWW', -- bcrypt hash of 'admin123'
  'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample API key for mobile apps
INSERT INTO api_keys (name, key, description, rate_limit) 
VALUES (
  'Mobile App Production',
  'pk_live_' || encode(gen_random_bytes(32), 'hex'),
  'Production API key for iOS and Android apps',
  1000
) ON CONFLICT (key) DO NOTHING;