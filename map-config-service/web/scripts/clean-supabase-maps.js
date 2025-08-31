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
  'BasemapDEGlobal'
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
  'BEV DKM GST',
  'NZParcels',
  'NSW BaseMap Overlay'
];

// Maps to definitely remove (not in geolantis API)
const MAPS_TO_REMOVE = [
  // German maps
  'Basemap DE',
  'DE-Brandenburg',
  'DE-Niedersachen-Classic',
  'DE-Niedersachen-Color',
  'DE-Niedersachen-Grey',
  'DE-Niedersachen-Light',
  'DE-Niedersachen-Night',
  'DE-Niedersachen-OSMCombi',
  'DE-Niedersachen-OSMBW',
  'TopPlusOpen',
  
  // Netherlands
  'NL Topo',
  'NL Luchtfoto',
  
  // Belgium
  'BelgiumOrtho',
  
  // Switzerland
  'Switzerland',
  'SwisstopoLight',
  'Swisstopo',
  'SwisstopoLightWinter',
  'SwisstopoSat',
  
  // UK
  'OSGB',
  'OSGBGrey',
  
  // Luxembourg
  'Luxembourg',
  'LuxembourgRoadmap',
  'LuxembourgTopo',
  'LuxembourgMobiliteit',
  
  // France
  'FranceAerial',
  'France Vector',
  'France Admin Express',
  'France Cadastral Parcels',
  
  // Italy
  'ItalyOrtofoto',
  'ItalyIGM',
  'ItalyCadastre',
  'SouthTyrolOrtho',
  'SouthTyrolTopo',
  'LombardyCTR',
  'LombardyOrtho',
  'PiedmontBase',
  'PiedmontOrtho',
  'TuscanyOrtho',
  'TuscanyCTR',
  'VenetoOrtho',
  'VenetoCTR',
  'EmiliaRomagnaBase',
  'EmiliaRomagnaOrtho',
  'LiguriaOrtho',
  'SicilyOrtho',
  'SardiniaCTR',
  
  // Spain
  'Spain_BTN_Completa',
  'ICGCOrtho',
  'ICGCStandard',
  
  // Other European
  'Bulgaria_Cadastre',
  'Portugal_DGT_2018',
  'Romania_ANCPI',
  'Sweden_Lantmateriet',
  'Slovakia_ZBGIS',
  'Iceland_LMI',
  'Cyprus_DLS_2014',
  'Denmark_Dataforsyningen',
  'Liechtenstein_Geodaten',
  'Slovenia_GURS',
  'Czech_Republic_CUZK',
  'Malta_Planning',
  
  // Finland
  'NLSTaustakartta',
  
  // New Zealand (keep overlays, remove base maps)
  'NZ',
  'NZTopoOrtho',
  'NZOrtho',
  
  // Australia
  'VictoriaWMTS',
  'NSW BaseMap',
  'NSWImagery',
  'QueenslandWMTS',
  'WAImagery',
  'TasmaniaOrtho',
  'QLD Aerial WMTS',
  
  // USA
  'USGSTopo',
  'USGSImageryOnly',
  
  // Canada
  'CanTopo',
  'CanadaSentinel2',
  'BCImagery',
  'OntarioImagery',
  'CanadaNRCanWMTS',
  
  // Google (if present)
  'Google Roadmap',
  'Google Satellite'
];

async function cleanDatabase() {
  console.log('🧹 Starting Supabase database cleanup...\n');

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

    const mapsDeleted = [];
    const mapsKept = [];
    const overlaysMarked = [];

    // 2. Process each map
    for (const map of allMaps || []) {
      // Check if map should be deleted
      if (MAPS_TO_REMOVE.includes(map.name)) {
        const { error: deleteError } = await supabase
          .from('map_configs')
          .delete()
          .eq('id', map.id);

        if (deleteError) {
          console.error(`❌ Error deleting ${map.name}:`, deleteError.message);
        } else {
          console.log(`🗑️  Deleted: ${map.name}`);
          mapsDeleted.push(map.name);
        }
      } 
      // Check if it's a valid overlay
      else if (VALID_OVERLAY_MAPS.includes(map.name)) {
        // Update metadata to mark as overlay
        const currentMetadata = map.metadata || {};
        const { error: updateError } = await supabase
          .from('map_configs')
          .update({
            metadata: {
              ...currentMetadata,
              isOverlay: true,
              overlayType: map.name.includes('Kataster') ? 'cadastral' : 
                          map.name.includes('flawi') ? 'zoning' :
                          map.name.includes('gefahr') ? 'hazard' :
                          map.name.includes('dkm') ? 'symbols' : 
                          map.name.includes('Inspire') ? 'wms' :
                          map.name.includes('BEV DKM') ? 'wms' : 'other'
            }
          })
          .eq('id', map.id);

        if (!updateError) {
          console.log(`🔲 Marked as overlay: ${map.name}`);
          overlaysMarked.push(map.name);
        }
      }
      // Keep valid background maps
      else if (VALID_BACKGROUND_MAPS.includes(map.name)) {
        console.log(`✅ Keeping: ${map.name}`);
        mapsKept.push(map.name);
      }
      // Handle unknown maps
      else {
        console.log(`❓ Unknown map (will delete): ${map.name}`);
        // Delete unknown maps too
        const { error: deleteError } = await supabase
          .from('map_configs')
          .delete()
          .eq('id', map.id);

        if (!deleteError) {
          console.log(`  🗑️  Deleted unknown: ${map.name}`);
          mapsDeleted.push(map.name);
        }
      }
    }

    // 3. Display final summary
    console.log('\n' + '='.repeat(50));
    console.log('✨ Database cleanup complete!\n');
    console.log('📋 Summary:');
    console.log(`  🗑️  Maps deleted: ${mapsDeleted.length}`);
    console.log(`  ✅ Maps kept: ${mapsKept.length}`);
    console.log(`  🔲 Overlays marked: ${overlaysMarked.length}`);
    
    // Get final count
    const { count: finalCount } = await supabase
      .from('map_configs')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Final database count: ${finalCount} maps`);
    
    if (mapsDeleted.length > 0) {
      console.log('\n🗑️  Deleted maps:');
      mapsDeleted.forEach(map => console.log(`  - ${map}`));
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the cleanup
cleanDatabase();