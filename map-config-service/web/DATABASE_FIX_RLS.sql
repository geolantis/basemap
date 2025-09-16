-- FIX ROW LEVEL SECURITY FOR LAYER GROUPS
-- Run this in Supabase SQL Editor (https://app.supabase.com/project/wphrytrrikfkwehwahqc/editor/sql)

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "read_all" ON layer_groups;
DROP POLICY IF EXISTS "read_public" ON layer_groups;
DROP POLICY IF EXISTS "insert_all" ON layer_groups;
DROP POLICY IF EXISTS "update_all" ON layer_groups;
DROP POLICY IF EXISTS "delete_all" ON layer_groups;

-- Step 2: Create permissive policies for public access
-- Allow anyone to read public layer groups
CREATE POLICY "Anyone can read public layer groups" ON layer_groups
  FOR SELECT
  USING (is_public = true);

-- Allow anyone to insert layer groups (for demo/public use)
CREATE POLICY "Anyone can create layer groups" ON layer_groups
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update their own layer groups (or all for demo)
CREATE POLICY "Anyone can update layer groups" ON layer_groups
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete layer groups (restrict in production)
CREATE POLICY "Anyone can delete layer groups" ON layer_groups
  FOR DELETE
  USING (true);

-- Step 3: Apply same policies to layer_group_overlays
DROP POLICY IF EXISTS "read_all" ON layer_group_overlays;
DROP POLICY IF EXISTS "insert_all" ON layer_group_overlays;
DROP POLICY IF EXISTS "update_all" ON layer_group_overlays;
DROP POLICY IF EXISTS "delete_all" ON layer_group_overlays;

CREATE POLICY "Anyone can read overlays" ON layer_group_overlays
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create overlays" ON layer_group_overlays
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update overlays" ON layer_group_overlays
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete overlays" ON layer_group_overlays
  FOR DELETE
  USING (true);

-- Step 4: Verify RLS is enabled but with permissive policies
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('layer_groups', 'layer_group_overlays');

-- Step 5: List all policies to confirm
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('layer_groups', 'layer_group_overlays')
ORDER BY tablename, policyname;