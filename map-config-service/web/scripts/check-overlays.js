#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOverlays() {
  console.log('🔍 Checking BEV overlay metadata in database...\n');

  try {
    const { data, error } = await supabase
      .from('map_configs')
      .select('name, label, metadata')
      .ilike('name', 'bev_%');

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log('📋 BEV Overlays in Database:');
    data.forEach(item => {
      console.log(`\n🗺️  ${item.name}`);
      console.log(`   Label: ${item.label}`);
      console.log(`   isOverlay: ${item.metadata?.isOverlay || 'NOT SET'}`);
      console.log(`   overlayType: ${item.metadata?.overlayType || 'NOT SET'}`);
      console.log(`   Metadata:`, JSON.stringify(item.metadata, null, 2));
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
checkOverlays();