-- DATABASE FIX FOR LAYER GROUPS
-- Run this in Supabase SQL Editor (https://app.supabase.com/project/wphrytrrikfkwehwahqc/editor/sql)

-- Step 1: Add is_public column to layer_groups table
ALTER TABLE layer_groups
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Step 2: Create index for public queries
CREATE INDEX IF NOT EXISTS idx_lg_public ON layer_groups(is_public);

-- Step 3: Update existing rows to set is_public = true
UPDATE layer_groups SET is_public = true WHERE is_public IS NULL;

-- Step 4: Update RLS policy to consider is_public
DROP POLICY IF EXISTS "read_all" ON layer_groups;
CREATE POLICY "read_public" ON layer_groups
  FOR SELECT
  USING (is_public = true OR auth.uid() IS NOT NULL);

-- Step 5: Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'layer_groups' AND column_name = 'is_public';

-- Expected output: should show the is_public column with type boolean and default true