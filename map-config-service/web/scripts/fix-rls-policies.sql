-- FIX RLS POLICIES - SIMPLE AND WORKING

-- 1. Fix map_configs policies (make them permissive for now)
ALTER TABLE map_configs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON map_configs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON map_configs;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON map_configs;

CREATE POLICY "Public read" ON map_configs FOR SELECT USING (true);
CREATE POLICY "Public update" ON map_configs FOR UPDATE USING (true);
CREATE POLICY "Public insert" ON map_configs FOR INSERT WITH CHECK (true);

ALTER TABLE map_configs ENABLE ROW LEVEL SECURITY;

-- 2. Fix users table (remove recursion)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;