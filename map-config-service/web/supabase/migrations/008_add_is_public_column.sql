-- Add is_public column to layer_groups table
ALTER TABLE layer_groups
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Create index for public queries
CREATE INDEX IF NOT EXISTS idx_lg_public ON layer_groups(is_public);

-- Update RLS policy to consider is_public
DROP POLICY IF EXISTS "read_all" ON layer_groups;
CREATE POLICY "read_public" ON layer_groups
  FOR SELECT
  USING (is_public = true OR auth.uid() IS NOT NULL);