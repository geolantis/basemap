-- Add map_category column to distinguish between background and overlay maps
ALTER TABLE maps 
ADD COLUMN IF NOT EXISTS map_category TEXT DEFAULT 'background' 
CHECK (map_category IN ('background', 'overlay'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_maps_category ON maps(map_category);

-- Update existing maps based on known overlay patterns
UPDATE maps 
SET map_category = 'overlay'
WHERE name IN (
  'Kataster',
  'Kataster BEV',
  'Kataster BEV2',
  'Spain BTN Completa'
) OR name LIKE '%Kataster%' OR name LIKE '%Overlay%';

-- Add comment to column
COMMENT ON COLUMN maps.map_category IS 'Distinguishes between background maps (base layers) and overlay maps (transparent layers)';