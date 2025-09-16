-- Layer Groups System (Ultra-Compact Version)
-- Fixes: Uses 'style' column instead of 'style_url'

-- Cleanup
DROP TABLE IF EXISTS layer_group_tag_assignments CASCADE;
DROP TABLE IF EXISTS layer_group_tags CASCADE;
DROP TABLE IF EXISTS layer_group_overlays CASCADE;
DROP TABLE IF EXISTS layer_groups CASCADE;
DROP FUNCTION IF EXISTS check_basemap_category() CASCADE;
DROP FUNCTION IF EXISTS check_overlay_category() CASCADE;
DROP VIEW IF EXISTS layer_groups_complete CASCADE;
DROP VIEW IF EXISTS layer_group_overlays_detail CASCADE;

-- Core Tables
CREATE TABLE layer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  basemap_id UUID NOT NULL REFERENCES map_configs(id) ON DELETE RESTRICT,
  preview_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE layer_group_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_group_id UUID NOT NULL REFERENCES layer_groups(id) ON DELETE CASCADE,
  overlay_id UUID NOT NULL REFERENCES map_configs(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  opacity NUMERIC(3,2) DEFAULT 0.8 CHECK (opacity >= 0 AND opacity <= 1),
  is_visible_by_default BOOLEAN DEFAULT true,
  compatibility_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(layer_group_id, overlay_id)
);

CREATE TABLE layer_group_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#0066CC'
);

CREATE TABLE layer_group_tag_assignments (
  layer_group_id UUID NOT NULL REFERENCES layer_groups(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES layer_group_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (layer_group_id, tag_id)
);

-- Indexes
CREATE INDEX idx_lg_active ON layer_groups(is_active);
CREATE INDEX idx_lg_featured ON layer_groups(is_featured);
CREATE INDEX idx_lg_basemap ON layer_groups(basemap_id);
CREATE INDEX idx_lgo_group ON layer_group_overlays(layer_group_id);
CREATE INDEX idx_lgo_overlay ON layer_group_overlays(overlay_id);

-- Initial Tags
INSERT INTO layer_group_tags (name, description, color) VALUES
  ('Cadastral', 'Property boundaries', '#8B4513'),
  ('Planning', 'Urban planning', '#4B0082'),
  ('Tourism', 'Tourist maps', '#FF6347'),
  ('Transport', 'Transport networks', '#1E90FF'),
  ('Environment', 'Environmental data', '#228B22')
ON CONFLICT DO NOTHING;

-- Views (using correct column names)
CREATE VIEW layer_groups_complete AS
SELECT
  lg.*,
  mc.name AS basemap_name,
  mc.label AS basemap_label,
  mc.style AS basemap_style,  -- Changed from style_url to style
  (SELECT COUNT(*) FROM layer_group_overlays WHERE layer_group_id = lg.id) AS overlay_count
FROM layer_groups lg
JOIN map_configs mc ON mc.id = lg.basemap_id;

-- Helper function
CREATE OR REPLACE FUNCTION get_layer_group_overlays(group_id UUID)
RETURNS TABLE (
  overlay_id UUID,
  overlay_name TEXT,
  overlay_style TEXT,
  display_order INT,
  opacity NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lgo.overlay_id,
    mc.name::TEXT,
    mc.style::TEXT,  -- Changed from style_url to style
    lgo.display_order,
    lgo.opacity
  FROM layer_group_overlays lgo
  JOIN map_configs mc ON mc.id = lgo.overlay_id
  WHERE lgo.layer_group_id = group_id
  ORDER BY lgo.display_order;
END;
$$ LANGUAGE plpgsql;

-- Permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_layer_group_overlays(UUID) TO PUBLIC;

-- Enable RLS
ALTER TABLE layer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE layer_group_overlays ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "read_all" ON layer_groups FOR SELECT USING (true);
CREATE POLICY "read_all" ON layer_group_overlays FOR SELECT USING (true);