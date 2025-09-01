# Map Preview Storage Setup

## Overview
The map preview feature requires a Supabase Storage bucket to store preview images. If the bucket doesn't exist, the system will fall back to storing images as base64 data in the database.

## Automatic Setup
Run the setup script to create the storage bucket:

```bash
node scripts/setup-storage-bucket.js
```

Note: This requires either:
- A Supabase service role key (recommended)
- Admin permissions on the anon key (not common)

## Manual Setup via Supabase Dashboard

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/wphrytrrikfkwehwahqc
   - Navigate to the **Storage** section

2. **Create a New Bucket**
   - Click "New bucket"
   - **Name:** `map-previews`
   - **Public bucket:** ✅ Yes (Enable this)
   - **File size limit:** 5MB (5242880 bytes)
   - **Allowed MIME types:** 
     - image/png
     - image/jpeg
     - image/webp

3. **Configure RLS Policies** (Optional but recommended)
   
   After creating the bucket, set up these RLS policies:

   **Allow public read access:**
   ```sql
   CREATE POLICY "Allow public access to map previews"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'map-previews');
   ```

   **Allow authenticated users to upload:**
   ```sql
   CREATE POLICY "Allow authenticated users to upload map previews"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'map-previews');
   ```

   **Allow authenticated users to update:**
   ```sql
   CREATE POLICY "Allow authenticated users to update map previews"
   ON storage.objects FOR UPDATE
   USING (bucket_id = 'map-previews');
   ```

   **Allow authenticated users to delete:**
   ```sql
   CREATE POLICY "Allow authenticated users to delete map previews"
   ON storage.objects FOR DELETE
   USING (bucket_id = 'map-previews');
   ```

## Fallback Behavior

If the storage bucket is not available, the system will:
1. Store preview images as base64 data URLs directly in the database
2. Display these base64 images on the dashboard cards
3. This works but may increase database size and loading times

## Troubleshooting

### "Bucket not found" Error
- The storage bucket hasn't been created yet
- Follow the manual setup steps above

### "Permission denied" Error
- The anon key doesn't have permission to create buckets
- Use the Supabase dashboard to create the bucket manually
- Or use a service role key for the setup script

### Images not displaying
- Check that the bucket is set to "public"
- Verify the RLS policies are correctly configured
- Check browser console for CORS errors

## Environment Variables

Ensure these are set in your `.env.production` or Vercel environment:

```env
VITE_SUPABASE_URL=https://wphrytrrikfkwehwahqc.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

For the setup script, you may also need:
```env
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

## Verification

After setup, test the preview feature:
1. Go to any map preview page
2. Click "Save Preview Image"
3. Check for success message
4. Return to dashboard to see the preview image

If successful, the image URL should look like:
```
https://wphrytrrikfkwehwahqc.supabase.co/storage/v1/object/public/map-previews/[mapId]_[timestamp].png
```

If using fallback mode, the image will be a data URL:
```
data:image/png;base64,iVBORw0KGgoAAAANS...
```