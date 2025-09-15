-- Migration: Add map_category and select_layer columns to map_configs table
-- This migration:
-- 1. Adds map_category column to properly classify maps (background vs overlay)
-- 2. Adds select_layer column for overlay maps to specify the primary selectable layer
-- 3. Migrates existing data from metadata JSON to proper columns

-- ============================================================================
-- PART 1: Add map_category column
-- ============================================================================

-- Add map_category column with check constraint
ALTER TABLE public.map_configs
ADD COLUMN IF NOT EXISTS map_category VARCHAR(20) DEFAULT 'background'
CHECK (map_category IN ('background', 'overlay'));

-- Add comment to describe the field's purpose
COMMENT ON COLUMN public.map_configs.map_category IS 'Map classification: background (base layer) or overlay (transparent layer on top)';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_map_configs_category
ON public.map_configs(map_category);

-- ============================================================================
-- PART 2: Add select_layer column
-- ============================================================================

-- Add select_layer column for overlay maps
ALTER TABLE public.map_configs
ADD COLUMN IF NOT EXISTS select_layer VARCHAR(255);

-- Add comment to describe the field's purpose
COMMENT ON COLUMN public.map_configs.select_layer IS 'Primary selectable layer ID for overlay maps (e.g., for feature selection/highlighting)';

-- Create index for faster queries on overlay maps with select layers
CREATE INDEX IF NOT EXISTS idx_map_configs_select_layer
ON public.map_configs(select_layer)
WHERE select_layer IS NOT NULL;

-- ============================================================================
-- PART 3: Migrate existing data from metadata
-- ============================================================================

-- Update map_category from metadata->category
UPDATE public.map_configs
SET map_category =
  CASE
    WHEN metadata->>'category' = 'overlay' THEN 'overlay'
    WHEN metadata->>'category' = 'background' THEN 'background'
    WHEN metadata->>'isOverlay' = 'true' THEN 'overlay'
    WHEN name ILIKE '%overlay%' THEN 'overlay'
    WHEN name ILIKE '%kataster%' THEN 'overlay'
    WHEN name ILIKE '%cadastr%' THEN 'overlay'
    WHEN name ILIKE '%parcel%' THEN 'overlay'
    WHEN name ILIKE '%flawi%' THEN 'overlay'
    WHEN name ILIKE '%dkm%' THEN 'overlay'
    WHEN name ILIKE '%gst%' THEN 'overlay'
    ELSE 'background'
  END
WHERE map_category IS NULL OR map_category = 'background';

-- Update select_layer from metadata or use known patterns
UPDATE public.map_configs
SET select_layer =
  CASE
    -- First check if selectLayer exists in metadata
    WHEN metadata->>'selectLayer' IS NOT NULL THEN metadata->>'selectLayer'
    -- Known Austrian cadastral patterns
    WHEN name ILIKE '%kataster%' AND name ILIKE '%ktn%' THEN 'gst_bev_fill'
    WHEN name ILIKE '%kataster%' AND name ILIKE '%bev%' AND name NOT ILIKE '%ktn%' THEN 'Grundstücke - Flächen'
    WHEN name = 'Kataster' THEN 'gst_bev_fill'
    WHEN name = 'Kataster BEV' THEN 'Grundstücke - Flächen'
    -- Other known overlay patterns
    WHEN name ILIKE '%parcel%' THEN 'parcels'
    WHEN name ILIKE '%flawi%' THEN 'flawi_layer'
    ELSE NULL
  END
WHERE map_category = 'overlay'
  AND select_layer IS NULL;

-- ============================================================================
-- PART 4: Clean up metadata JSON (optional - remove migrated fields)
-- ============================================================================

-- Remove 'category' from metadata since we now have a proper column
UPDATE public.map_configs
SET metadata = metadata - 'category'
WHERE metadata ? 'category';

-- Remove 'isOverlay' from metadata since we now use map_category
UPDATE public.map_configs
SET metadata = metadata - 'isOverlay'
WHERE metadata ? 'isOverlay';

-- Remove 'selectLayer' from metadata since we now have a proper column
UPDATE public.map_configs
SET metadata = metadata - 'selectLayer'
WHERE metadata ? 'selectLayer';

-- ============================================================================
-- PART 5: Set specific overlay maps based on known configurations
-- ============================================================================

-- Update known overlay maps from the original mapconfig.json
UPDATE public.map_configs
SET map_category = 'overlay'
WHERE name IN (
  'Kataster',
  'Kataster BEV',
  'BEV Flur DKM',
  'BEV Flur GST',
  'BEV GST',
  'BEV Symbole DKM',
  'BEV Symbole GST',
  'BEV DKM Flur',
  'BEV DKM GST',
  'Kärnten Kataster DKM',
  'Kärnten Kataster GST',
  'Kärnten Bezirke',
  'Austria Districts',
  'FLAWI',
  'Geoland Kataster',
  'Kataster Test Mercator'
);

-- ============================================================================
-- PART 6: Migration Complete
-- ============================================================================

-- Migration completed successfully
-- Both map_category and select_layer columns have been added
-- Existing data has been migrated from metadata JSON

-- ============================================================================
-- PART 7: Sample queries to verify the migration
-- ============================================================================

-- View all overlay maps with their select layers
-- SELECT name, label, map_category, select_layer
-- FROM public.map_configs
-- WHERE map_category = 'overlay'
-- ORDER BY name;

-- Check for any remaining category data in metadata
-- SELECT name, metadata
-- FROM public.map_configs
-- WHERE metadata ? 'category'
--    OR metadata ? 'isOverlay'
--    OR metadata ? 'selectLayer';