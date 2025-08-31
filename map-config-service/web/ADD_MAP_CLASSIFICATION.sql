-- ============================================
-- ADD MAP CLASSIFICATION TO SUPABASE
-- ============================================
-- Run this script in Supabase SQL Editor:
-- 1. Go to https://supabase.com/dashboard/project/wphrytrrikfkwehwahqc/sql
-- 2. Paste this entire script
-- 3. Click "Run"

-- Step 1: Add map_category column if it doesn't exist
ALTER TABLE maps 
ADD COLUMN IF NOT EXISTS map_category TEXT DEFAULT 'background' 
CHECK (map_category IN ('background', 'overlay'));

-- Step 2: Add index for performance
CREATE INDEX IF NOT EXISTS idx_maps_category ON maps(map_category);

-- Step 3: Update existing maps with proper classification
-- These are OVERLAY maps (from original mapconfig.json overlayMaps section)
UPDATE maps 
SET map_category = 'overlay'
WHERE name IN (
  'Kataster',
  'Kataster BEV',
  'Kataster BEV2',
  'Spain BTN Completa',
  'NSWBaseMapOverlay',
  'KatasterBEV',
  'KatasterBEV2',
  'Spain_BTN_Completa'
) 
OR LOWER(name) LIKE '%overlay%'
OR LOWER(name) LIKE '%kataster%'
OR LOWER(name) LIKE '%cadastr%';

-- Step 4: Everything else is a background map
UPDATE maps 
SET map_category = 'background'
WHERE map_category IS NULL;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN maps.map_category IS 'Classification: background (base layer) or overlay (transparent layer on top)';

-- Step 6: Verify the update
SELECT 
  map_category,
  COUNT(*) as count,
  STRING_AGG(name, ', ' ORDER BY name) as map_names
FROM maps
GROUP BY map_category
ORDER BY map_category;