-- Migration: Add selectLayer field to map_configs table
-- This field specifies the primary selectable layer for overlay maps
-- Useful for applications that need to identify which layer to make interactive

-- Add selectLayer column to map_configs table
ALTER TABLE map_configs
ADD COLUMN IF NOT EXISTS select_layer VARCHAR(255);

-- Add comment to describe the field's purpose
COMMENT ON COLUMN map_configs.select_layer IS 'Primary selectable layer ID for overlay maps (e.g., for feature selection/highlighting)';

-- Update existing overlay configurations with known select layers
-- These are common patterns for cadastral and other overlay layers
UPDATE map_configs
SET select_layer =
  CASE
    WHEN name LIKE '%kataster%' AND name LIKE '%ktn%' THEN 'gst_bev_fill'
    WHEN name LIKE '%kataster%' AND name LIKE '%bev%' THEN 'Grundstücke - Flächen'
    WHEN name LIKE '%overlay%' AND metadata->>'selectLayer' IS NOT NULL THEN metadata->>'selectLayer'
    WHEN metadata->>'selectLayer' IS NOT NULL THEN metadata->>'selectLayer'
    ELSE NULL
  END
WHERE select_layer IS NULL
  AND (name LIKE '%kataster%' OR name LIKE '%overlay%' OR metadata->>'selectLayer' IS NOT NULL);

-- Create index for faster queries on maps with select layers
CREATE INDEX IF NOT EXISTS idx_map_configs_select_layer
ON map_configs(select_layer)
WHERE select_layer IS NOT NULL;

-- Note: Audit log entry removed as config_audit_log table may not exist
-- Migration completed successfully