# Map Preview Image Feature - Setup Guide

## ⚠️ IMPORTANT: Database Migration Required

The preview image feature requires database schema updates that haven't been applied to your production database yet.

## Quick Fix - Run This SQL in Supabase

1. **Go to Supabase SQL Editor**
   - Open: https://supabase.com/dashboard/project/wphrytrrikfkwehwahqc/sql
   - Click "New query"

2. **Run this SQL migration:**

```sql
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
```

3. **Click "Run" to execute the migration**

## Optional: Create Storage Bucket

While the system can work with base64 images stored in the database, for better performance, create a storage bucket:

### Via Supabase Dashboard:
1. Go to **Storage** section: https://supabase.com/dashboard/project/wphrytrrikfkwehwahqc/storage/buckets
2. Click **"New bucket"**
3. Configure:
   - **Name:** `map-previews`
   - **Public bucket:** ✅ Enable
   - **File size limit:** 5242880 (5MB)
   - **Allowed MIME types:** image/png, image/jpeg, image/webp

### Set up RLS Policies (Optional):
After creating the bucket, go to the Policies tab and add:

```sql
-- Allow public read access
CREATE POLICY "Allow public access to map previews"
ON storage.objects FOR SELECT
USING (bucket_id = 'map-previews');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload map previews"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'map-previews');

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update map previews"
ON storage.objects FOR UPDATE
USING (bucket_id = 'map-previews');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete map previews"
ON storage.objects FOR DELETE
USING (bucket_id = 'map-previews');
```

## How It Works

### With Storage Bucket (Recommended):
1. Map preview is captured as PNG
2. Image is uploaded to Supabase Storage
3. URL is saved in `preview_image_url` column
4. Dashboard displays image from URL

### Without Storage Bucket (Fallback):
1. Map preview is captured as PNG
2. Image is converted to base64 data URL
3. Base64 string is saved in `preview_image_url` column
4. Dashboard displays base64 image directly

## Verification

After running the migration:
1. Refresh the application
2. Go to any map preview
3. Click "Save Preview Image"
4. Should see "Preview image saved" message
5. Return to dashboard to see the preview

## Troubleshooting

### Error: "Could not find the 'preview_image_url' column"
- The database migration hasn't been run
- Run the SQL migration above

### Error: "Bucket not found"
- Storage bucket doesn't exist
- System will use base64 fallback (this is fine)
- Optionally create the bucket for better performance

### Images not showing on dashboard
- Check browser console for errors
- Verify the migration was successful
- Try saving a new preview image

### Error: "new row violates row-level security policy"
- RLS policies are too restrictive
- Either disable RLS temporarily or update policies
- The base64 fallback should work regardless

## Current Status

Based on your logs:
- ✅ Preview image capture is working
- ✅ Base64 fallback is working (image saved as data:image/jpeg;base64,...)
- ❌ Database column `preview_image_url` is missing
- ❌ Storage bucket doesn't exist (but fallback works)

**Action Required:** Run the SQL migration above to enable the feature!