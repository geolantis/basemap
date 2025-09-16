-- QUICK FIX: TEMPORARILY DISABLE RLS FOR LAYER GROUPS
-- Run this in Supabase SQL Editor (https://app.supabase.com/project/wphrytrrikfkwehwahqc/editor/sql)

-- Option 1: Temporarily disable RLS (QUICK FIX - for testing only)
ALTER TABLE layer_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE layer_group_overlays DISABLE ROW LEVEL SECURITY;

-- This will allow all operations without any restrictions
-- Use this to test if the save functionality works

-- After testing, you can re-enable RLS with proper policies:
-- ALTER TABLE layer_groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE layer_group_overlays ENABLE ROW LEVEL SECURITY;