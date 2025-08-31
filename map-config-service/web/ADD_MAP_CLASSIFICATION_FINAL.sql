-- ============================================
-- FINAL MAP CLASSIFICATION - EXACT FROM mapconfig.json
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

-- Step 3: Set ALL maps to background first (106 maps)
UPDATE maps 
SET map_category = 'background';

-- Step 4: Set ONLY these 12 maps as overlay (from mapconfig.json overlayMaps section)
-- NO OTHER LOGIC - JUST THESE EXACT 12 MAPS!
UPDATE maps 
SET map_category = 'overlay'
WHERE LOWER(name) IN (
  lower('Kataster'),
  lower('Kataster BEV'),
  lower('Kataster BEV2'),
  lower('KatasterKTNLight'),
  lower('Kataster OVL'),
  lower('dkm_bev_symbole'),
  lower('flawi'),
  lower('gefahr'),
  lower('NZParcels'),
  lower('NSW BaseMap Overlay'),
  lower('Inspire WMS'),
  lower('BEV DKM GST')
);

-- Step 5: Verify the counts
SELECT 
  map_category,
  COUNT(*) as count
FROM maps
GROUP BY map_category
ORDER BY map_category;

-- Expected result:
-- background: 106 maps
-- overlay: 12 maps

-- Step 6: Show all overlay maps for verification
SELECT name, label, country, map_category 
FROM maps 
WHERE map_category = 'overlay'
ORDER BY name;

-- Should show EXACTLY these 12:
-- 1. BEV DKM GST
-- 2. dkm_bev_symbole  
-- 3. flawi
-- 4. gefahr
-- 5. Inspire WMS
-- 6. Kataster
-- 7. Kataster BEV
-- 8. Kataster BEV2
-- 9. Kataster OVL
-- 10. KatasterKTNLight
-- 11. NSW BaseMap Overlay
-- 12. NZParcels