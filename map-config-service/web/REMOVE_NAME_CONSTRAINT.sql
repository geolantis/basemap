-- ============================================================
-- IMPORTANT: Run this migration to fix the map name edit issue
-- ============================================================
-- This migration removes the unique constraint from the name field
-- allowing users to rename configurations freely without conflicts
-- The UUID id field remains as the unique identifier
-- ============================================================

-- Step 1: Drop the unique constraint on the name column
ALTER TABLE map_configs DROP CONSTRAINT IF EXISTS map_configs_name_key;

-- Step 2: Create a non-unique index for performance when searching by name
CREATE INDEX IF NOT EXISTS idx_map_configs_name ON map_configs(name);

-- Step 3: Add a comment explaining the change
COMMENT ON COLUMN map_configs.name IS 'Configuration name/identifier - not required to be unique as UUID id serves as the unique identifier';

-- Step 4: Verify the change
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE
    tc.table_schema = 'public'
    AND tc.table_name = 'map_configs'
    AND tc.constraint_type = 'UNIQUE';

-- This should return no rows for the 'name' column after the migration