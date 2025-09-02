-- STEP 1: Add missing columns to map_configs table
ALTER TABLE map_configs 
ADD COLUMN IF NOT EXISTS preview_image_url TEXT,
ADD COLUMN IF NOT EXISTS center NUMERIC[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS zoom NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bearing NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pitch NUMERIC DEFAULT NULL;

-- STEP 2: Fix the infinite recursion in users table RLS policies
-- First, disable RLS temporarily to fix policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop problematic policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read access for all users" ON users
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authentication" ON users
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on id" ON users
FOR UPDATE USING (auth.uid()::text = id);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- STEP 3: Fix map_configs table RLS policies
ALTER TABLE map_configs DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON map_configs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON map_configs;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON map_configs;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON map_configs;

-- Create simple policies that work
CREATE POLICY "Anyone can read map configs" ON map_configs
FOR SELECT USING (true);

CREATE POLICY "Anyone can update map configs" ON map_configs
FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert map configs" ON map_configs
FOR INSERT WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE map_configs ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create storage bucket for map previews
-- Note: This needs to be done via Supabase dashboard or API
-- as SQL can't create storage buckets directly
SELECT 'Storage bucket needs to be created manually in Supabase dashboard:
1. Go to Storage section
2. Create bucket named: map-previews
3. Set as PUBLIC bucket
4. Set file size limit: 5MB';

-- STEP 5: Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'map_configs' 
AND column_name IN ('preview_image_url', 'center', 'zoom', 'bearing', 'pitch');