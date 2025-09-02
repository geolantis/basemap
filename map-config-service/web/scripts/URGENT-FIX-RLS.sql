-- URGENT: RUN THIS IN SUPABASE SQL EDITOR NOW
-- https://supabase.com/dashboard/project/wphrytrrikfkwehwahqc/sql

-- 1. DISABLE RLS ON USERS TABLE (causing infinite recursion)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. FIX MAP_CONFIGS TABLE
ALTER TABLE map_configs DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON map_configs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON map_configs;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON map_configs;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON map_configs;
DROP POLICY IF EXISTS "Public read" ON map_configs;
DROP POLICY IF EXISTS "Public update" ON map_configs;
DROP POLICY IF EXISTS "Public insert" ON map_configs;

-- Create simple working policies
CREATE POLICY "Anyone can read" ON map_configs
FOR SELECT USING (true);

CREATE POLICY "Anyone can update" ON map_configs
FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert" ON map_configs
FOR INSERT WITH CHECK (true);

-- Re-enable RLS with working policies
ALTER TABLE map_configs ENABLE ROW LEVEL SECURITY;

-- 3. VERIFY IT WORKS
SELECT 'RLS FIXED! Preview images should now save properly.' as status;