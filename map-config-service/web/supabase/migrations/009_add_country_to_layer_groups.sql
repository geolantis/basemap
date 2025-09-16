-- Migration: Add Country and Flag fields to Layer Groups
-- This migration adds country and country_flag fields to the layer_groups table
-- to support organizing layer groups by country/region

-- ============================================================================
-- Add country and country_flag columns to layer_groups table
-- ============================================================================

-- Add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'layer_groups'
                  AND column_name = 'country') THEN
        ALTER TABLE layer_groups ADD COLUMN country VARCHAR(100) DEFAULT 'Global';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'layer_groups'
                  AND column_name = 'country_flag') THEN
        ALTER TABLE layer_groups ADD COLUMN country_flag VARCHAR(10) DEFAULT '🌍';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN layer_groups.country IS 'Country or region for this layer group (e.g., Austria, Germany, Global)';
COMMENT ON COLUMN layer_groups.country_flag IS 'Flag emoji or icon representing the country/region';

-- ============================================================================
-- Create indexes for country filtering
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_layer_groups_country ON layer_groups(country);
CREATE INDEX IF NOT EXISTS idx_layer_groups_country_active ON layer_groups(country, is_active) WHERE is_active = true;

-- ============================================================================
-- Update existing layer groups with country data based on basemap
-- ============================================================================

-- This query attempts to inherit the country from the basemap if available
UPDATE layer_groups lg
SET
  country = COALESCE(mc.country, 'Global'),
  country_flag = COALESCE(mc.flag, '🌍')
FROM map_configs mc
WHERE lg.basemap_id = mc.id
  AND lg.country = 'Global'  -- Only update if not already set
  AND mc.country IS NOT NULL;

-- ============================================================================
-- Create function to auto-set country from basemap
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_set_layer_group_country()
RETURNS TRIGGER AS $$
BEGIN
  -- If country is not explicitly set, inherit from basemap
  IF (NEW.country IS NULL OR NEW.country = 'Global') AND NEW.basemap_id IS NOT NULL THEN
    SELECT country, flag INTO NEW.country, NEW.country_flag
    FROM map_configs
    WHERE id = NEW.basemap_id
      AND country IS NOT NULL;

    -- Default values if basemap doesn't have country
    IF NEW.country IS NULL THEN
      NEW.country := 'Global';
      NEW.country_flag := '🌍';
    END IF;
  END IF;

  -- Ensure we always have a country and flag
  IF NEW.country IS NULL THEN
    NEW.country := 'Global';
  END IF;

  IF NEW.country_flag IS NULL THEN
    NEW.country_flag := CASE NEW.country
      WHEN 'Austria' THEN '🇦🇹'
      WHEN 'Germany' THEN '🇩🇪'
      WHEN 'Switzerland' THEN '🇨🇭'
      WHEN 'Italy' THEN '🇮🇹'
      WHEN 'France' THEN '🇫🇷'
      WHEN 'Spain' THEN '🇪🇸'
      WHEN 'United Kingdom' THEN '🇬🇧'
      WHEN 'United States' THEN '🇺🇸'
      WHEN 'Canada' THEN '🇨🇦'
      WHEN 'Australia' THEN '🇦🇺'
      WHEN 'Global' THEN '🌍'
      ELSE '🏳️'
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new inserts
DROP TRIGGER IF EXISTS set_layer_group_country ON layer_groups;
CREATE TRIGGER set_layer_group_country
  BEFORE INSERT OR UPDATE OF basemap_id, country ON layer_groups
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_layer_group_country();

-- ============================================================================
-- Create function to get layer groups by country
-- ============================================================================

CREATE OR REPLACE FUNCTION get_layer_groups_by_country(
  country_param VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  description TEXT,
  country VARCHAR(100),
  country_flag VARCHAR(10),
  basemap_name TEXT,
  overlay_count BIGINT,
  is_active BOOLEAN,
  is_featured BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lg.id,
    lg.name,
    lg.description,
    lg.country,
    lg.country_flag,
    mc.label::TEXT AS basemap_name,
    (
      SELECT COUNT(*)
      FROM layer_group_overlays lgo
      WHERE lgo.layer_group_id = lg.id
    ) AS overlay_count,
    lg.is_active,
    lg.is_featured
  FROM layer_groups lg
  LEFT JOIN map_configs mc ON mc.id = lg.basemap_id
  WHERE (country_param IS NULL OR lg.country = country_param)
    AND lg.is_active = true
  ORDER BY lg.display_order, lg.name;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_layer_groups_by_country(VARCHAR) TO PUBLIC;

-- ============================================================================
-- Sample data for different countries (optional - remove if not needed)
-- ============================================================================

-- Example: Set specific layer groups to Austria if they use Austrian basemaps
UPDATE layer_groups lg
SET
  country = 'Austria',
  country_flag = '🇦🇹'
FROM map_configs mc
WHERE lg.basemap_id = mc.id
  AND (
    mc.name ILIKE '%austria%'
    OR mc.name ILIKE '%ktn%'
    OR mc.name ILIKE '%kärnten%'
    OR mc.label ILIKE '%austria%'
    OR mc.label ILIKE '%kärnten%'
  );

-- ============================================================================
-- Update existing layer groups to set default values
-- ============================================================================

-- Ensure all existing layer groups have country and flag set
UPDATE layer_groups
SET
  country = COALESCE(country, 'Global'),
  country_flag = COALESCE(country_flag, '🌍')
WHERE country IS NULL OR country_flag IS NULL;

-- ============================================================================
-- Migration Complete!
-- ============================================================================

-- To rollback this migration, run:
-- ALTER TABLE layer_groups DROP COLUMN IF EXISTS country;
-- ALTER TABLE layer_groups DROP COLUMN IF EXISTS country_flag;
-- DROP FUNCTION IF EXISTS auto_set_layer_group_country() CASCADE;
-- DROP FUNCTION IF EXISTS get_layer_groups_by_country(VARCHAR) CASCADE;
-- DROP INDEX IF EXISTS idx_layer_groups_country;
-- DROP INDEX IF EXISTS idx_layer_groups_country_active;