#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.production') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.production');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBucket() {
  console.log('Setting up Supabase storage bucket for map previews...');
  
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Failed to list buckets:', listError);
      console.log('\nNote: You may need to use a service role key instead of anon key.');
      console.log('The anon key may not have permission to create buckets.');
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'map-previews');
    
    if (bucketExists) {
      console.log('✓ Bucket "map-previews" already exists');
      return;
    }
    
    // Create the bucket
    const { data, error: createError } = await supabase.storage.createBucket('map-previews', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });
    
    if (createError) {
      console.error('Failed to create bucket:', createError);
      console.log('\n📋 Manual Setup Instructions:');
      console.log('1. Go to your Supabase dashboard: ' + supabaseUrl);
      console.log('2. Navigate to Storage section');
      console.log('3. Click "New bucket"');
      console.log('4. Name: map-previews');
      console.log('5. Set as Public bucket');
      console.log('6. File size limit: 5MB');
      console.log('7. Allowed MIME types: image/png, image/jpeg, image/webp');
      return;
    }
    
    console.log('✓ Successfully created bucket "map-previews"');
    
  } catch (error) {
    console.error('Error setting up storage bucket:', error);
    console.log('\n📋 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard: ' + supabaseUrl);
    console.log('2. Navigate to Storage section');
    console.log('3. Click "New bucket"');
    console.log('4. Name: map-previews');
    console.log('5. Set as Public bucket');
    console.log('6. File size limit: 5MB');
    console.log('7. Allowed MIME types: image/png, image/jpeg, image/webp');
  }
}

setupStorageBucket();