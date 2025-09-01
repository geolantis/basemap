-- Migration: Add user_styles table for Maputnik integration
-- This table stores custom map styles created by users

-- Create user_styles table
CREATE TABLE IF NOT EXISTS user_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'custom',
    style_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT user_styles_name_check CHECK (length(trim(name)) > 0),
    CONSTRAINT user_styles_category_check CHECK (category IN ('custom', 'basemap', 'satellite', 'terrain', 'street', 'dark', 'light', 'experimental')),
    CONSTRAINT user_styles_version_check CHECK (version > 0)
);

-- Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    style_quota INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT user_profiles_role_check CHECK (role IN ('user', 'admin', 'super_admin')),
    CONSTRAINT user_profiles_style_quota_check CHECK (style_quota >= 0 AND style_quota <= 1000)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_styles_user_id ON user_styles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_styles_is_active ON user_styles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_styles_is_public ON user_styles(is_public);
CREATE INDEX IF NOT EXISTS idx_user_styles_category ON user_styles(category);
CREATE INDEX IF NOT EXISTS idx_user_styles_created_at ON user_styles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_styles_modified_at ON user_styles(modified_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_styles_name_search ON user_styles USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Create composite indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_styles_user_name_unique ON user_styles(user_id, name) WHERE is_active = TRUE;

-- Add RLS (Row Level Security) policies
ALTER TABLE user_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own styles
CREATE POLICY "Users can view own styles" ON user_styles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can view public styles
CREATE POLICY "Anyone can view public styles" ON user_styles
    FOR SELECT USING (is_public = TRUE AND is_active = TRUE);

-- Policy: Users can insert their own styles
CREATE POLICY "Users can create own styles" ON user_styles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own styles
CREATE POLICY "Users can update own styles" ON user_styles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own styles (soft delete by setting is_active = false)
CREATE POLICY "Users can delete own styles" ON user_styles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to automatically update modified_at timestamp
CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update modified_at
CREATE TRIGGER trigger_update_user_styles_modified_at
    BEFORE UPDATE ON user_styles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at();

-- Create function to check style quota
CREATE OR REPLACE FUNCTION check_style_quota()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check quota for active styles and when inserting
    IF NEW.is_active = TRUE AND TG_OP = 'INSERT' THEN
        -- Get user's current style count and quota
        IF (
            SELECT COUNT(*) 
            FROM user_styles 
            WHERE user_id = NEW.user_id AND is_active = TRUE
        ) >= (
            SELECT COALESCE(style_quota, 50) 
            FROM user_profiles 
            WHERE id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Style quota exceeded. Please delete some styles or contact support to increase your quota.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce style quota
CREATE TRIGGER trigger_check_style_quota
    BEFORE INSERT OR UPDATE ON user_styles
    FOR EACH ROW
    EXECUTE FUNCTION check_style_quota();

-- Create function to clean up old style versions (optional)
CREATE OR REPLACE FUNCTION cleanup_old_styles()
RETURNS void AS $$
BEGIN
    -- This function can be called periodically to clean up old inactive styles
    -- For now, we'll just mark very old inactive styles for potential deletion
    UPDATE user_styles 
    SET modified_at = NOW() 
    WHERE is_active = FALSE 
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE user_styles IS 'Stores custom map styles created by users in Maputnik editor';
COMMENT ON COLUMN user_styles.style_data IS 'Complete Mapbox GL style JSON specification';
COMMENT ON COLUMN user_styles.is_public IS 'Whether this style can be viewed by other users';
COMMENT ON COLUMN user_styles.is_active IS 'Soft delete flag - inactive styles are not shown but preserved';
COMMENT ON COLUMN user_styles.tags IS 'User-defined tags for organizing styles';
COMMENT ON COLUMN user_styles.version IS 'Style version number for tracking changes';

COMMENT ON TABLE user_profiles IS 'Extended user profile information';
COMMENT ON COLUMN user_profiles.style_quota IS 'Maximum number of active styles this user can create';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_styles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- Insert some sample categories (if needed)
-- These could be used for dropdowns in the UI
CREATE TABLE IF NOT EXISTS style_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO style_categories (name, display_name, description, sort_order) VALUES
('custom', 'Custom', 'User-created custom styles', 1),
('basemap', 'Base Map', 'Basic map styles for general use', 2),
('satellite', 'Satellite', 'Satellite and aerial imagery styles', 3),
('terrain', 'Terrain', 'Topographic and terrain-focused styles', 4),
('street', 'Street Map', 'Detailed street and navigation styles', 5),
('dark', 'Dark Theme', 'Dark mode and night-friendly styles', 6),
('light', 'Light Theme', 'Light and minimal styles', 7),
('experimental', 'Experimental', 'Testing and experimental styles', 8)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE style_categories IS 'Predefined categories for organizing map styles';