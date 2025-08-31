#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

// Load mapconfig.json
const mapConfigPath = path.join(__dirname, '../../../mapconfig.json');
const mapConfig = JSON.parse(fs.readFileSync(mapConfigPath, 'utf8'));

// Maps that failed due to type constraints
const FAILED_MAPS = [
  'ItalyOrtofoto', 'ItalyIGM', 'SouthTyrolOrtho', 'SouthTyrolTopo',
  'LombardyCTR', 'LombardyOrtho', 'PiedmontBase', 'PiedmontOrtho',
  'TuscanyOrtho', 'TuscanyCTR', 'VenetoOrtho', 'VenetoCTR',
  'EmiliaRomagnaBase', 'EmiliaRomagnaOrtho', 'LiguriaOrtho',
  'SicilyOrtho', 'SardiniaCTR', 'FranceAerial', 'USGSTopo',
  'CanTopo', 'CanadaSentinel2', 'OntarioImagery', 'CanadaNRCanWMTS',
  'USGSImageryOnly', 'VictoriaWMTS', 'NSWImagery', 'QueenslandWMTS',
  'TasmaniaOrtho', 'QLD Aerial WMTS'
];

async function fixMapTypes() {
  console.log('🔧 Fixing map types for failed imports...\n');

  let added = 0;
  let errors = 0;

  const backgroundMaps = mapConfig.backgroundMaps || {};

  for (const mapKey of FAILED_MAPS) {
    const map = backgroundMaps[mapKey];
    if (!map) {
      console.log(`⚠️  Map not found in config: ${mapKey}`);
      continue;
    }

    try {
      // Convert type: "raster" maps should be "wmts" if they have tiles
      // or "wms" if they have a WMS configuration
      let mapType = map.type;
      if (mapType === 'raster') {
        if (map.tiles) {
          mapType = 'wmts';
        } else if (map.url && (map.layers || map.format)) {
          mapType = 'wms';
        } else {
          mapType = 'wmts'; // default to wmts for raster
        }
      }
      
      // Handle "vector-esri" type
      if (mapType === 'vector-esri') {
        mapType = 'vtc'; // treat as vector tile
      }

      const mapData = {
        name: map.name || mapKey,
        label: map.label || mapKey,
        type: mapType,
        style: map.style || null,
        country: map.country || 'Unknown',
        flag: map.flag || '🌐',
        metadata: {
          originalType: map.type, // Store original type
          tiles: map.tiles,
          tileSize: map.tileSize,
          minzoom: map.minzoom,
          maxzoom: map.maxzoom,
          attribution: map.attribution,
          url: map.url,
          layers: map.layers,
          format: map.format,
          version: map.version,
          transparent: map.transparent,
          styleUrl: map.styleUrl
        },
        is_active: true,
        version: 1
      };

      // Clean up metadata - remove undefined values
      Object.keys(mapData.metadata).forEach(key => {
        if (mapData.metadata[key] === undefined) {
          delete mapData.metadata[key];
        }
      });

      // Try to insert the map
      const { error: insertError } = await supabase
        .from('map_configs')
        .insert(mapData);

      if (insertError) {
        console.error(`❌ Error adding ${mapData.name}:`, insertError.message);
        errors++;
      } else {
        console.log(`✅ Added: ${mapData.name} (type: ${mapType})`);
        added++;
      }
    } catch (error) {
      console.error(`❌ Unexpected error with ${mapKey}:`, error);
      errors++;
    }
  }

  // Also fix NSW BaseMap which has a different error
  try {
    const nswMap = backgroundMaps['NSW BaseMap'];
    if (nswMap) {
      const mapData = {
        name: 'NSW BaseMap',
        label: nswMap.label || 'NSW BaseMap',
        type: 'vtc', // vector-esri becomes vtc
        style: nswMap.style || null,
        country: nswMap.country || 'Australia',
        flag: nswMap.flag || '🇦🇺',
        metadata: {
          originalType: 'vector-esri',
          url: nswMap.url,
          styleUrl: nswMap.styleUrl,
          attribution: nswMap.attribution
        },
        is_active: true,
        version: 1
      };

      const { error: insertError } = await supabase
        .from('map_configs')
        .insert(mapData);

      if (insertError) {
        console.error(`❌ Error adding NSW BaseMap:`, insertError.message);
        errors++;
      } else {
        console.log(`✅ Added: NSW BaseMap (type: vtc)`);
        added++;
      }
    }
  } catch (error) {
    console.error(`❌ Unexpected error with NSW BaseMap:`, error);
    errors++;
  }

  // Display summary
  console.log('\n' + '='.repeat(50));
  console.log('✨ Fix complete!\n');
  console.log('📋 Summary:');
  console.log(`  ✅ Maps added: ${added}`);
  console.log(`  ❌ Errors: ${errors}`);

  // Get final counts
  const { count: totalCount } = await supabase
    .from('map_configs')
    .select('*', { count: 'exact', head: true });

  const { count: overlayCount } = await supabase
    .from('map_configs')
    .select('*', { count: 'exact', head: true })
    .eq('metadata->>isOverlay', 'true');

  const basemapCount = totalCount - overlayCount;

  console.log(`\n📊 Final database counts:`);
  console.log(`  Total maps: ${totalCount}`);
  console.log(`  Background maps: ${basemapCount}`);
  console.log(`  Overlay maps: ${overlayCount}`);
}

// Run the fix
fixMapTypes();