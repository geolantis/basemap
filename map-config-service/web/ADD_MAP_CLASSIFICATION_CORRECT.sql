-- ============================================
-- ADD MAP CLASSIFICATION TO SUPABASE (CORRECTED)
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

-- Step 3: First, set ALL maps to background by default
UPDATE maps 
SET map_category = 'background';

-- Step 4: Update the 12 OVERLAY maps from original mapconfig.json
UPDATE maps 
SET map_category = 'overlay'
WHERE name IN (
  -- Original overlay maps from mapconfig.json
  'Kataster',
  'Kataster BEV',
  'Kataster BEV2',
  'KatasterKTNLight',
  'Kataster OVL',
  'dkm_bev_symbole',
  'flawi',
  'gefahr',
  'NZParcels',
  'NSW BaseMap Overlay',
  'Inspire WMS',
  'BEV DKM GST',
  
  -- Also include variations that might exist in the database
  'KatasterBEV',
  'KatasterBEV2',
  'NSWBaseMapOverlay',
  'NSW BaseMap',
  'Spain BTN Completa',
  'Spain_BTN_Completa',
  'BEVDKMGST',
  'InspireWMS'
) 
OR LOWER(name) LIKE '%overlay%'
OR LOWER(name) LIKE '%kataster%'
OR LOWER(name) LIKE '%cadastr%'
OR LOWER(name) LIKE '%dkm%'
OR LOWER(name) LIKE '%flawi%'
OR LOWER(name) LIKE '%gefahr%'
OR LOWER(name) LIKE '%parcel%';

-- Step 5: Add comment for documentation
COMMENT ON COLUMN maps.map_category IS 'Classification: background (base layer) or overlay (transparent layer on top). Based on original mapconfig.json structure.';

-- Step 6: Insert missing overlay maps if they don't exist
-- This ensures all 12 overlay maps from mapconfig.json are in the database
INSERT INTO maps (name, label, type, country, flag, map_category, is_active)
VALUES 
  ('Kataster', 'KTN Kataster', 'vtc', 'Austria', '🇦🇹', 'overlay', true),
  ('Kataster BEV', 'BEV Kataster', 'vtc', 'Austria', '🇦🇹', 'overlay', true),
  ('Kataster BEV2', 'BEV Kataster 2', 'vtc', 'Austria', '🇦🇹', 'overlay', true),
  ('KatasterKTNLight', 'KTN Kataster Light', 'vtc', 'Austria', '🇦🇹', 'overlay', true),
  ('Kataster OVL', 'Kataster Grau Overlay', 'vtc', 'Austria', '🇦🇹', 'overlay', true),
  ('dkm_bev_symbole', 'BEV DKM Punkte & Symbole', 'vtc', 'Austria', '🇦🇹', 'overlay', true),
  ('flawi', 'KTN Flächenwidmung', 'vtc', 'Austria', '🇦🇹', 'overlay', true),
  ('gefahr', 'KTN Gefahrenzonen', 'vtc', 'Austria', '🇦🇹', 'overlay', true),
  ('NZParcels', 'NZ Parcels', 'vtc', 'New Zealand', '🇳🇿', 'overlay', true),
  ('NSW BaseMap Overlay', 'NSW BaseMap', 'vtc', 'Australia', '🇦🇺', 'overlay', true),
  ('Inspire WMS', 'Inspire WMS', 'wms', 'Europe', '🇪🇺', 'overlay', true),
  ('BEV DKM GST', 'BEV DKM GST', 'vtc', 'Austria', '🇦🇹', 'overlay', true)
ON CONFLICT (name) DO UPDATE
SET map_category = 'overlay',
    label = EXCLUDED.label,
    country = EXCLUDED.country,
    flag = EXCLUDED.flag;

-- Step 7: Verify the update
SELECT 
  map_category,
  COUNT(*) as count
FROM maps
GROUP BY map_category
ORDER BY map_category;

-- Step 8: Show all overlay maps for verification
SELECT name, label, country, map_category 
FROM maps 
WHERE map_category = 'overlay'
ORDER BY name;