-- Add preview_image_url column to maps table for storing map preview thumbnails
ALTER TABLE maps 
ADD COLUMN IF NOT EXISTS preview_image_url TEXT;

-- Add position fields for saving map view state
ALTER TABLE maps
ADD COLUMN IF NOT EXISTS center NUMERIC[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS zoom NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bearing NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pitch NUMERIC DEFAULT NULL;

-- Add comments to columns
COMMENT ON COLUMN maps.preview_image_url IS 'URL to the stored preview image of the map';
COMMENT ON COLUMN maps.center IS 'Map center coordinates [lng, lat]';
COMMENT ON COLUMN maps.zoom IS 'Map zoom level';
COMMENT ON COLUMN maps.bearing IS 'Map bearing in degrees';
COMMENT ON COLUMN maps.pitch IS 'Map pitch in degrees';

-- Create storage bucket for map preview images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'map-previews',
  'map-previews',
  true, -- Public bucket for easy access
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the storage bucket
CREATE POLICY "Allow public access to map previews"
ON storage.objects FOR SELECT
USING (bucket_id = 'map-previews');

CREATE POLICY "Allow authenticated users to upload map previews"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'map-previews');

CREATE POLICY "Allow authenticated users to update map previews"
ON storage.objects FOR UPDATE
USING (bucket_id = 'map-previews');

CREATE POLICY "Allow authenticated users to delete map previews"
ON storage.objects FOR DELETE
USING (bucket_id = 'map-previews');