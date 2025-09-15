-- Migration: Remove unique constraint from name field
-- The UUID id field is sufficient as a unique identifier
-- This allows users to rename configurations freely without conflicts

-- Drop the unique constraint on the name column
ALTER TABLE map_configs DROP CONSTRAINT IF EXISTS map_configs_name_key;

-- Add a comment explaining the change
COMMENT ON COLUMN map_configs.name IS 'Configuration name/identifier - not required to be unique as UUID id serves as the unique identifier';

-- Create an index for performance when searching by name (non-unique)
CREATE INDEX IF NOT EXISTS idx_map_configs_name ON map_configs(name);

-- Log the migration
INSERT INTO config_audit_log (action, changes, created_at)
VALUES (
  'MIGRATION',
  jsonb_build_object(
    'description', 'Removed unique constraint from name field',
    'reason', 'Allow flexible naming and renaming of configurations',
    'migration', '004_remove_name_unique_constraint'
  ),
  NOW()
);