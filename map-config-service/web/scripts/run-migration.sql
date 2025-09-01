-- Add preview_image_url column to map_configs table for storing map preview thumbnails
ALTER TABLE map_configs 
ADD COLUMN IF NOT EXISTS preview_image_url TEXT;

-- Add position fields for saving map view state
ALTER TABLE map_configs
ADD COLUMN IF NOT EXISTS center NUMERIC[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS zoom NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bearing NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pitch NUMERIC DEFAULT NULL;

-- Add comments to columns
COMMENT ON COLUMN map_configs.preview_image_url IS 'URL to the stored preview image of the map';
COMMENT ON COLUMN map_configs.center IS 'Map center coordinates [lng, lat]';
COMMENT ON COLUMN map_configs.zoom IS 'Map zoom level';
COMMENT ON COLUMN map_configs.bearing IS 'Map bearing in degrees';
COMMENT ON COLUMN map_configs.pitch IS 'Map pitch in degrees';