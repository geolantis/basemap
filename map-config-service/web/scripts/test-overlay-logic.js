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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOverlayLogic() {
  console.log('🧪 Testing overlay detection logic...\n');

  try {
    // Get BEV configs from database
    const { data: configs, error } = await supabase
      .from('map_configs')
      .select('*')
      .ilike('name', 'bev_%')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    // Test the overlay detection logic
    const OVERLAY_MAPS = [
      'Kataster', 'Kataster BEV', 'Kataster BEV2', 'KatasterKTNLight',
      'Kataster OVL', 'dkm_bev_symbole', 'flawi', 'gefahr',
      'NZParcels', 'NSW BaseMap Overlay', 'Inspire WMS', 'BEV DKM GST',
      // New official BEV overlays
      'bev_kataster_amtlich', 'bev_symbole_amtlich', 'bev_kataster_orthophoto',
      'bev_symbole_orthophoto', 'bev_kataster_light', 'bev_kataster_gis', 'bev_symbole_gis'
    ];

    console.log('📊 Testing Overlay Detection Logic:');
    configs.forEach(config => {
      console.log(`\n🗺️  ${config.name}`);
      
      // Test each condition
      const isOverlayFromMetadata = config.metadata?.isOverlay === true;
      const isOverlayFromCategory = config.map_category === 'overlay';
      const isOverlayFromList = OVERLAY_MAPS.some(name => name.toLowerCase() === config.name?.toLowerCase());
      
      const finalIsOverlay = isOverlayFromMetadata || isOverlayFromCategory || isOverlayFromList;
      
      console.log(`   Metadata isOverlay: ${config.metadata?.isOverlay} → ${isOverlayFromMetadata}`);
      console.log(`   Map category: ${config.map_category} → ${isOverlayFromCategory}`);
      console.log(`   In overlay list: ${isOverlayFromList}`);
      console.log(`   🎯 FINAL RESULT: ${finalIsOverlay ? '✅ OVERLAY' : '❌ BASEMAP'}`);
    });

    console.log('\n📋 Summary:');
    const overlayCount = configs.filter(config => {
      const isOverlay = config.metadata?.isOverlay === true ||
        config.map_category === 'overlay' ||
        OVERLAY_MAPS.some(name => name.toLowerCase() === config.name?.toLowerCase());
      return isOverlay;
    }).length;
    
    console.log(`Total BEV configs: ${configs.length}`);
    console.log(`Should be overlays: ${overlayCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
testOverlayLogic();