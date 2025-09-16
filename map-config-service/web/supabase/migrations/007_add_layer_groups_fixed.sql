-- Migration: Add Layer Groups System (Fixed)
-- This migration creates a comprehensive layer groups system that allows linking
-- basemap layers with compatible overlays for organized map viewing.
--
-- Features:
-- - Layer groups with descriptive names and metadata
-- - One-to-many relationship: one basemap per group, multiple overlays per group
-- - Preview image support for both basemaps and overlays
-- - User ownership and audit tracking
-- - Compatibility metadata storage
-- - Full CRUD operations with RLS policies
-- - Performance indexes

-- ============================================================================
-- CLEANUP: Drop existing tables if they exist (for re-running migration)
-- ============================================================================

DROP TABLE IF EXISTS layer_group_tag_assignments CASCADE;
DROP TABLE IF EXISTS layer_group_tags CASCADE;
DROP TABLE IF EXISTS layer_group_overlays CASCADE;
DROP TABLE IF EXISTS layer_groups CASCADE;

-- ============================================================================
-- PART 1: Create layer_groups table
-- ============================================================================

CREATE TABLE IF NOT EXISTS layer_groups (
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
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES admins(id) ON DELETE SET NULL
);

-- Add table comments
COMMENT ON TABLE layer_groups IS 'Groups that link one basemap with compatible overlays';
COMMENT ON COLUMN layer_groups.name IS 'Display name of the layer group (e.g., "Kärnten Standard")';
COMMENT ON COLUMN layer_groups.description IS 'Optional detailed description of the layer group';
COMMENT ON COLUMN layer_groups.basemap_id IS 'Reference to the basemap (background layer) for this group';
COMMENT ON COLUMN layer_groups.preview_image_url IS 'URL to preview image showing the combined basemap + overlays';
COMMENT ON COLUMN layer_groups.display_order IS 'Sort order for displaying layer groups (lower = higher priority)';
COMMENT ON COLUMN layer_groups.is_active IS 'Whether this layer group is currently available';
COMMENT ON COLUMN layer_groups.is_featured IS 'Whether to highlight this group in the UI';
COMMENT ON COLUMN layer_groups.metadata IS 'Additional metadata (compatibility reasons, UI settings, etc.)';

-- ============================================================================
-- PART 2: Create layer_group_overlays junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS layer_group_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_group_id UUID NOT NULL REFERENCES layer_groups(id) ON DELETE CASCADE,
  overlay_id UUID NOT NULL REFERENCES map_configs(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  opacity NUMERIC(3,2) DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),
  is_visible_by_default BOOLEAN DEFAULT true,
  is_selectable BOOLEAN DEFAULT true,
  compatibility_reason TEXT,
  overlay_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,

  -- Ensure unique overlay per layer group
  UNIQUE(layer_group_id, overlay_id)
);

-- Add table comments
COMMENT ON TABLE layer_group_overlays IS 'Junction table linking layer groups to their compatible overlay maps';
COMMENT ON COLUMN layer_group_overlays.layer_group_id IS 'Reference to the parent layer group';
COMMENT ON COLUMN layer_group_overlays.overlay_id IS 'Reference to the overlay map (must have map_category = overlay)';
COMMENT ON COLUMN layer_group_overlays.display_order IS 'Order of overlay layers (lower = rendered first)';
COMMENT ON COLUMN layer_group_overlays.opacity IS 'Default opacity for this overlay (0.0 = transparent, 1.0 = opaque)';
COMMENT ON COLUMN layer_group_overlays.is_visible_by_default IS 'Whether this overlay is visible when group loads';
COMMENT ON COLUMN layer_group_overlays.is_selectable IS 'Whether users can interact with/select features in this overlay';
COMMENT ON COLUMN layer_group_overlays.compatibility_reason IS 'Human-readable explanation of why this overlay is compatible';
COMMENT ON COLUMN layer_group_overlays.overlay_metadata IS 'Overlay-specific settings (style overrides, filters, etc.)';

-- ============================================================================
-- PART 3: Create layer_group_tags table for categorization
-- ============================================================================

CREATE TABLE IF NOT EXISTS layer_group_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#0066CC', -- Hex color for UI display
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comments
COMMENT ON TABLE layer_group_tags IS 'Tags for categorizing and filtering layer groups';
COMMENT ON COLUMN layer_group_tags.name IS 'Tag name (e.g., "Cadastral", "Planning", "Tourism")';
COMMENT ON COLUMN layer_group_tags.color IS 'Hex color code for displaying the tag in UI';

-- ============================================================================
-- PART 4: Create layer_group_tag_assignments junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS layer_group_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_group_id UUID NOT NULL REFERENCES layer_groups(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES layer_group_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique tag per layer group
  UNIQUE(layer_group_id, tag_id)
);

-- Add table comments
COMMENT ON TABLE layer_group_tag_assignments IS 'Junction table for assigning tags to layer groups';

-- ============================================================================
-- PART 5: Add constraints
-- ============================================================================

-- Check if map_category column exists before adding constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'map_configs'
    AND column_name = 'map_category'
  ) THEN
    -- Ensure basemap_id only references background category maps
    ALTER TABLE layer_groups
    ADD CONSTRAINT check_basemap_category
    CHECK ((SELECT map_category FROM map_configs WHERE id = basemap_id) = 'background');

    -- Ensure overlay_id only references overlay category maps
    ALTER TABLE layer_group_overlays
    ADD CONSTRAINT check_overlay_category
    CHECK ((SELECT map_category FROM map_configs WHERE id = overlay_id) = 'overlay');
  ELSE
    RAISE NOTICE 'map_category column does not exist, skipping category constraints';
  END IF;
END $$;

-- ============================================================================
-- PART 6: Create indexes for performance
-- ============================================================================

-- Layer groups indexes
CREATE INDEX idx_layer_groups_active ON layer_groups(is_active) WHERE is_active = true;
CREATE INDEX idx_layer_groups_featured ON layer_groups(is_featured) WHERE is_featured = true;
CREATE INDEX idx_layer_groups_display_order ON layer_groups(display_order);
CREATE INDEX idx_layer_groups_basemap_id ON layer_groups(basemap_id);
CREATE INDEX idx_layer_groups_created_by ON layer_groups(created_by);
CREATE INDEX idx_layer_groups_name_search ON layer_groups USING gin(to_tsvector('english', name));

-- Layer group overlays indexes
CREATE INDEX idx_layer_group_overlays_group_id ON layer_group_overlays(layer_group_id);
CREATE INDEX idx_layer_group_overlays_overlay_id ON layer_group_overlays(overlay_id);
CREATE INDEX idx_layer_group_overlays_order ON layer_group_overlays(layer_group_id, display_order);
CREATE INDEX idx_layer_group_overlays_visible ON layer_group_overlays(layer_group_id, is_visible_by_default);

-- Tag assignments indexes
CREATE INDEX idx_layer_group_tag_assignments_group ON layer_group_tag_assignments(layer_group_id);
CREATE INDEX idx_layer_group_tag_assignments_tag ON layer_group_tag_assignments(tag_id);

-- Composite indexes for common queries
CREATE INDEX idx_layer_groups_active_featured ON layer_groups(is_active, is_featured, display_order);
CREATE INDEX idx_layer_group_overlays_composite ON layer_group_overlays(layer_group_id, display_order, is_visible_by_default);

-- ============================================================================
-- PART 7: Create updated_at triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for layer_groups
CREATE TRIGGER update_layer_groups_updated_at
  BEFORE UPDATE ON layer_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for layer_group_overlays
CREATE TRIGGER update_layer_group_overlays_updated_at
  BEFORE UPDATE ON layer_group_overlays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 8: Row Level Security (RLS) policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE layer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE layer_group_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE layer_group_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE layer_group_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Layer groups policies
-- Public read access for active layer groups
CREATE POLICY "Public can view active layer groups"
  ON layer_groups FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all layer groups
CREATE POLICY "Authenticated users can view all layer groups"
  ON layer_groups FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert layer groups
CREATE POLICY "Admins can create layer groups"
  ON layer_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid()
      AND is_active = true
    )
  );

-- Admins can update layer groups
CREATE POLICY "Admins can update layer groups"
  ON layer_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid()
      AND is_active = true
    )
  );

-- Admins can delete layer groups
CREATE POLICY "Admins can delete layer groups"
  ON layer_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid()
      AND is_active = true
    )
  );

-- Layer group overlays policies
-- Public read access
CREATE POLICY "Public can view layer group overlays"
  ON layer_group_overlays FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM layer_groups
      WHERE id = layer_group_id
      AND is_active = true
    )
  );

-- Admins can manage overlays
CREATE POLICY "Admins can manage layer group overlays"
  ON layer_group_overlays FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid()
      AND is_active = true
    )
  );

-- Layer group tags policies
-- Public read access
CREATE POLICY "Public can view tags"
  ON layer_group_tags FOR SELECT
  USING (true);

-- Admins can manage tags
CREATE POLICY "Admins can manage tags"
  ON layer_group_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid()
      AND is_active = true
    )
  );

-- Tag assignments policies
-- Public read access
CREATE POLICY "Public can view tag assignments"
  ON layer_group_tag_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM layer_groups
      WHERE id = layer_group_id
      AND is_active = true
    )
  );

-- Admins can manage tag assignments
CREATE POLICY "Admins can manage tag assignments"
  ON layer_group_tag_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid()
      AND is_active = true
    )
  );

-- ============================================================================
-- PART 9: Insert initial tags
-- ============================================================================

INSERT INTO layer_group_tags (name, description, color) VALUES
  ('Cadastral', 'Cadastral and property boundaries', '#8B4513'),
  ('Planning', 'Urban and regional planning', '#4B0082'),
  ('Tourism', 'Tourism and recreation', '#FF6347'),
  ('Transportation', 'Roads, railways, and transit', '#1E90FF'),
  ('Environmental', 'Environmental and ecological data', '#228B22'),
  ('Administrative', 'Administrative boundaries', '#FF8C00'),
  ('Utilities', 'Infrastructure and utilities', '#708090'),
  ('Emergency', 'Emergency services and safety', '#DC143C')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PART 10: Create useful views
-- ============================================================================

-- View combining layer groups with basemap info
CREATE OR REPLACE VIEW layer_groups_complete AS
SELECT
  lg.id,
  lg.name,
  lg.description,
  lg.basemap_id,
  mc.name AS basemap_name,
  mc.label AS basemap_label,
  mc.style_url AS basemap_style,
  lg.preview_image_url,
  lg.display_order,
  lg.is_active,
  lg.is_featured,
  lg.metadata,
  lg.created_at,
  lg.updated_at,
  lg.created_by,
  lg.updated_by,
  (
    SELECT COUNT(*)
    FROM layer_group_overlays
    WHERE layer_group_id = lg.id
  ) AS overlay_count,
  (
    SELECT array_agg(
      json_build_object(
        'id', t.id,
        'name', t.name,
        'color', t.color
      )
    )
    FROM layer_group_tags t
    JOIN layer_group_tag_assignments ta ON ta.tag_id = t.id
    WHERE ta.layer_group_id = lg.id
  ) AS tags
FROM layer_groups lg
JOIN map_configs mc ON mc.id = lg.basemap_id
ORDER BY lg.display_order, lg.name;

-- View for layer group overlays with full details
CREATE OR REPLACE VIEW layer_group_overlays_detail AS
SELECT
  lgo.id,
  lgo.layer_group_id,
  lg.name AS layer_group_name,
  lgo.overlay_id,
  mc.name AS overlay_name,
  mc.label AS overlay_label,
  mc.style_url AS overlay_style,
  lgo.display_order,
  lgo.opacity,
  lgo.is_visible_by_default,
  lgo.is_selectable,
  lgo.compatibility_reason,
  lgo.overlay_metadata,
  lgo.created_at,
  lgo.updated_at
FROM layer_group_overlays lgo
JOIN layer_groups lg ON lg.id = lgo.layer_group_id
JOIN map_configs mc ON mc.id = lgo.overlay_id
ORDER BY lgo.layer_group_id, lgo.display_order;

-- ============================================================================
-- PART 11: Create helper functions
-- ============================================================================

-- Function to get all overlays for a layer group
CREATE OR REPLACE FUNCTION get_layer_group_overlays(group_id UUID)
RETURNS TABLE (
  overlay_id UUID,
  overlay_name TEXT,
  overlay_label TEXT,
  overlay_style TEXT,
  display_order INTEGER,
  opacity NUMERIC,
  is_visible_by_default BOOLEAN,
  is_selectable BOOLEAN,
  compatibility_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lgo.overlay_id,
    mc.name::TEXT AS overlay_name,
    mc.label::TEXT AS overlay_label,
    mc.style_url::TEXT AS overlay_style,
    lgo.display_order,
    lgo.opacity,
    lgo.is_visible_by_default,
    lgo.is_selectable,
    lgo.compatibility_reason
  FROM layer_group_overlays lgo
  JOIN map_configs mc ON mc.id = lgo.overlay_id
  WHERE lgo.layer_group_id = group_id
  ORDER BY lgo.display_order;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a basemap and overlay are compatible
CREATE OR REPLACE FUNCTION check_layer_compatibility(
  basemap_id_param UUID,
  overlay_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  compatibility_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM layer_groups lg
    JOIN layer_group_overlays lgo ON lg.id = lgo.layer_group_id
    WHERE lg.basemap_id = basemap_id_param
    AND lgo.overlay_id = overlay_id_param
  ) INTO compatibility_exists;

  RETURN compatibility_exists;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 12: Create storage bucket for preview images (if using Supabase Storage)
-- ============================================================================

-- Note: This needs to be executed via Supabase dashboard or client library
-- as it requires storage API access

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('layer-group-previews', 'layer-group-previews', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 13: Grant permissions
-- ============================================================================

-- Grant usage on all tables to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant read access to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON layer_groups TO anon;
GRANT SELECT ON layer_group_overlays TO anon;
GRANT SELECT ON layer_group_tags TO anon;
GRANT SELECT ON layer_group_tag_assignments TO anon;
GRANT SELECT ON layer_groups_complete TO anon;
GRANT SELECT ON layer_group_overlays_detail TO anon;

-- ============================================================================
-- Migration Complete!
-- ============================================================================

-- To rollback this migration, run:
-- DROP TABLE layer_group_tag_assignments CASCADE;
-- DROP TABLE layer_group_tags CASCADE;
-- DROP TABLE layer_group_overlays CASCADE;
-- DROP TABLE layer_groups CASCADE;
-- DROP VIEW IF EXISTS layer_groups_complete;
-- DROP VIEW IF EXISTS layer_group_overlays_detail;
-- DROP FUNCTION IF EXISTS get_layer_group_overlays(UUID);
-- DROP FUNCTION IF EXISTS check_layer_compatibility(UUID, UUID);