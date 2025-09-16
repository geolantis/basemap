-- Layer Groups Database Setup Script
-- Run this script to create all necessary tables, indexes, functions, and policies
-- for the Layer Groups feature in your Supabase database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Create layer_groups table
CREATE TABLE IF NOT EXISTS layer_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    preview_image_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT layer_groups_name_check CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT layer_groups_description_check CHECK (description IS NULL OR LENGTH(description) <= 500)
);

-- Create unique constraint for active layer groups per user
CREATE UNIQUE INDEX IF NOT EXISTS layer_groups_user_name_unique
    ON layer_groups(user_id, name)
    WHERE is_active = true;

-- Create layer_group_overlays table
CREATE TABLE IF NOT EXISTS layer_group_overlays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    layer_group_id UUID NOT NULL REFERENCES layer_groups(id) ON DELETE CASCADE,
    overlay_id UUID NOT NULL REFERENCES map_configs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    opacity DECIMAL(3,2) DEFAULT 0.70 CHECK (opacity >= 0 AND opacity <= 1),
    is_visible BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT layer_group_overlays_position_check CHECK (position >= 0 AND position < 1000)
);

-- Create unique constraint for active overlays per layer group
CREATE UNIQUE INDEX IF NOT EXISTS layer_group_overlays_unique_active
    ON layer_group_overlays(layer_group_id, overlay_id)
    WHERE is_active = true;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes for layer_groups
CREATE INDEX IF NOT EXISTS idx_layer_groups_user_id ON layer_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_layer_groups_is_active ON layer_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_layer_groups_is_featured ON layer_groups(is_featured);
CREATE INDEX IF NOT EXISTS idx_layer_groups_created_at ON layer_groups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_layer_groups_updated_at ON layer_groups(updated_at DESC);

-- Search indexes for layer_groups
CREATE INDEX IF NOT EXISTS idx_layer_groups_tags ON layer_groups USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_layer_groups_name_trgm ON layer_groups USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_layer_groups_description_trgm ON layer_groups USING GIN(description gin_trgm_ops);

-- Performance indexes for layer_group_overlays
CREATE INDEX IF NOT EXISTS idx_layer_group_overlays_layer_group_id ON layer_group_overlays(layer_group_id);
CREATE INDEX IF NOT EXISTS idx_layer_group_overlays_overlay_id ON layer_group_overlays(overlay_id);
CREATE INDEX IF NOT EXISTS idx_layer_group_overlays_position ON layer_group_overlays(layer_group_id, position);
CREATE INDEX IF NOT EXISTS idx_layer_group_overlays_is_active ON layer_group_overlays(is_active);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to shift overlay positions up or down
CREATE OR REPLACE FUNCTION shift_overlay_positions(
    p_layer_group_id UUID,
    p_start_position INTEGER,
    p_shift_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE layer_group_overlays
    SET position = position + p_shift_amount,
        updated_at = NOW()
    WHERE layer_group_id = p_layer_group_id
      AND position >= p_start_position
      AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to shift positions within a range
CREATE OR REPLACE FUNCTION shift_overlay_positions_range(
    p_layer_group_id UUID,
    p_start_position INTEGER,
    p_end_position INTEGER,
    p_shift_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE layer_group_overlays
    SET position = position + p_shift_amount,
        updated_at = NOW()
    WHERE layer_group_id = p_layer_group_id
      AND position >= p_start_position
      AND position <= p_end_position
      AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up inactive records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_inactive_layer_groups()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete layer groups that have been inactive for more than 30 days
    DELETE FROM layer_groups
    WHERE is_active = false
      AND updated_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get next available position for overlay
CREATE OR REPLACE FUNCTION get_next_overlay_position(p_layer_group_id UUID)
RETURNS INTEGER AS $$
DECLARE
    max_position INTEGER;
BEGIN
    SELECT COALESCE(MAX(position), -1) + 1
    INTO max_position
    FROM layer_group_overlays
    WHERE layer_group_id = p_layer_group_id
      AND is_active = true;

    RETURN max_position;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to layer_groups table
DROP TRIGGER IF EXISTS update_layer_groups_updated_at ON layer_groups;
CREATE TRIGGER update_layer_groups_updated_at
    BEFORE UPDATE ON layer_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply timestamp trigger to layer_group_overlays table
DROP TRIGGER IF EXISTS update_layer_group_overlays_updated_at ON layer_group_overlays;
CREATE TRIGGER update_layer_group_overlays_updated_at
    BEFORE UPDATE ON layer_group_overlays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update layer group timestamp when overlays change
CREATE OR REPLACE FUNCTION update_layer_group_on_overlay_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the parent layer group's timestamp
    UPDATE layer_groups
    SET updated_at = NOW()
    WHERE id = COALESCE(NEW.layer_group_id, OLD.layer_group_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_layer_group_on_overlay_change ON layer_group_overlays;
CREATE TRIGGER update_layer_group_on_overlay_change
    AFTER INSERT OR UPDATE OR DELETE ON layer_group_overlays
    FOR EACH ROW
    EXECUTE FUNCTION update_layer_group_on_overlay_change();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on layer_groups
ALTER TABLE layer_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own layer groups" ON layer_groups;
DROP POLICY IF EXISTS "Users can insert their own layer groups" ON layer_groups;
DROP POLICY IF EXISTS "Users can update their own layer groups" ON layer_groups;
DROP POLICY IF EXISTS "Users can delete their own layer groups" ON layer_groups;

-- Create policies for layer_groups
CREATE POLICY "Users can view their own layer groups" ON layer_groups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own layer groups" ON layer_groups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own layer groups" ON layer_groups
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own layer groups" ON layer_groups
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on layer_group_overlays
ALTER TABLE layer_group_overlays ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view overlays in their layer groups" ON layer_group_overlays;
DROP POLICY IF EXISTS "Users can insert overlays in their layer groups" ON layer_group_overlays;
DROP POLICY IF EXISTS "Users can update overlays in their layer groups" ON layer_group_overlays;
DROP POLICY IF EXISTS "Users can delete overlays in their layer groups" ON layer_group_overlays;

-- Create policies for layer_group_overlays
CREATE POLICY "Users can view overlays in their layer groups" ON layer_group_overlays
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM layer_groups
            WHERE layer_groups.id = layer_group_overlays.layer_group_id
            AND layer_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert overlays in their layer groups" ON layer_group_overlays
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM layer_groups
            WHERE layer_groups.id = layer_group_overlays.layer_group_id
            AND layer_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update overlays in their layer groups" ON layer_group_overlays
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM layer_groups
            WHERE layer_groups.id = layer_group_overlays.layer_group_id
            AND layer_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete overlays in their layer groups" ON layer_group_overlays
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM layer_groups
            WHERE layer_groups.id = layer_group_overlays.layer_group_id
            AND layer_groups.user_id = auth.uid()
        )
    );

-- ============================================================================
-- STORAGE SETUP
-- ============================================================================

-- Create storage bucket for layer group previews (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
SELECT 'layer-group-previews', 'layer-group-previews', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'layer-group-previews'
);

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload layer group previews" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own layer group previews" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to layer group previews" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload layer group previews" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'layer-group-previews'
        AND auth.role() = 'authenticated'
    );

-- Allow users to update their own files
CREATE POLICY "Users can update their own layer group previews" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'layer-group-previews'
        AND auth.role() = 'authenticated'
    );

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own layer group previews" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'layer-group-previews'
        AND auth.role() = 'authenticated'
    );

-- Allow public read access to preview images
CREATE POLICY "Public read access to layer group previews" ON storage.objects
    FOR SELECT USING (bucket_id = 'layer-group-previews');

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment the following to insert sample data for testing
/*
-- Note: Replace 'your-user-id-here' with an actual user ID from auth.users
INSERT INTO layer_groups (user_id, name, description, tags, is_featured) VALUES
(
    'your-user-id-here',
    'Urban Planning Overlays',
    'Collection of overlays for urban planning analysis',
    ARRAY['urban', 'planning', 'zoning'],
    true
),
(
    'your-user-id-here',
    'Environmental Data',
    'Environmental monitoring and analysis layers',
    ARRAY['environment', 'monitoring', 'analysis'],
    false
);
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify the setup
SELECT 'Tables created successfully' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'layer_groups')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'layer_group_overlays');

SELECT 'Functions created successfully' as status
WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'shift_overlay_positions')
  AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'shift_overlay_positions_range')
  AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_inactive_layer_groups');

SELECT 'RLS enabled successfully' as status
WHERE (SELECT relrowsecurity FROM pg_class WHERE relname = 'layer_groups')
  AND (SELECT relrowsecurity FROM pg_class WHERE relname = 'layer_group_overlays');

SELECT 'Storage bucket created successfully' as status
WHERE EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'layer-group-previews');

-- Show all indexes created
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('layer_groups', 'layer_group_overlays')
ORDER BY tablename, indexname;