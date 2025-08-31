#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../map-config-service/web/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Create Supabase client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// List of maps that should be kept (from geolantis API)
const VALID_BACKGROUND_MAPS = [
  'Global',
  'Global2',
  'Landscape',
  'Ocean',
  'Outdoor',
  'Dataviz',
  'OSMLiberty',
  'OSMBright',
  'OSM3D',
  'GlobalSat',
  'Basemap Standard',
  'Basemap Grau',
  'Basemap Ortho',
  'Basemap Ortho KTN',
  'BEVLight',
  'BEVOrtho',
  'Basemap Ortho Blue',
  'Orthofoto',
  'BEV Ortho',
  'Basemap.at',
  'Agrar',
  'basemapcustom2',
  'basemapcustom3',
  'basemapcustom4',
  'BasemapDEGlobal' // Keep this global map
];

// Valid overlay maps
const VALID_OVERLAY_MAPS = [
  'Kataster',
  'Kataster BEV',
  'Kataster BEV2',
  'KatasterKTNLight',
  'Kataster OVL',
  'dkm_bev_symbole',
  'flawi',
  'gefahr',
  'Inspire WMS',
  'BEV DKM GST'
];

async function cleanDatabase() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // 1. Get all current maps from database
    const { data: allMaps, error: fetchError } = await supabase
      .from('map_configs')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching maps:', fetchError);
      return;
    }

    console.log(`📊 Found ${allMaps?.length || 0} maps in database\n`);

    const mapsToDelete: string[] = [];
    const mapsToKeep: string[] = [];
    const overlayMaps: string[] = [];

    // 2. Categorize maps
    allMaps?.forEach(map => {
      if (VALID_BACKGROUND_MAPS.includes(map.name)) {
        mapsToKeep.push(map.name);
      } else if (VALID_OVERLAY_MAPS.includes(map.name)) {
        overlayMaps.push(map.name);
        // Update metadata to mark as overlay
        updateMapAsOverlay(map.id, map.name);
      } else {
        mapsToDelete.push(map.name);
      }
    });

    // 3. Display summary
    console.log('📋 Summary:');
    console.log(`✅ Background maps to keep: ${mapsToKeep.length}`);
    console.log(`🔲 Overlay maps: ${overlayMaps.length}`);
    console.log(`❌ Maps to delete: ${mapsToDelete.length}\n`);

    if (mapsToDelete.length > 0) {
      console.log('🗑️  Maps to be deleted:');
      mapsToDelete.forEach(map => console.log(`  - ${map}`));
      console.log('');

      // 4. Delete unwanted maps
      console.log('🔄 Deleting unwanted maps...');
      
      for (const mapName of mapsToDelete) {
        const { error: deleteError } = await supabase
          .from('map_configs')
          .delete()
          .eq('name', mapName);

        if (deleteError) {
          console.error(`❌ Error deleting ${mapName}:`, deleteError);
        } else {
          console.log(`  ✅ Deleted: ${mapName}`);
        }
      }
    }

    console.log('\n✨ Database cleanup complete!');
    
    // 5. Display final stats
    const { count: finalCount } = await supabase
      .from('map_configs')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Final database stats:`);
    console.log(`  Total maps: ${finalCount}`);
    console.log(`  Background maps: ${mapsToKeep.length}`);
    console.log(`  Overlay maps: ${overlayMaps.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function updateMapAsOverlay(id: string, name: string) {
  // Update the metadata to mark this as an overlay
  const { error } = await supabase
    .from('map_configs')
    .update({
      metadata: {
        isOverlay: true,
        overlayType: name.includes('Kataster') ? 'cadastral' : 
                     name.includes('flawi') ? 'zoning' :
                     name.includes('gefahr') ? 'hazard' :
                     name.includes('dkm') ? 'symbols' : 'other'
      }
    })
    .eq('id', id);

  if (error) {
    console.error(`❌ Error updating ${name} as overlay:`, error);
  }
}

// Run the cleanup
cleanDatabase();