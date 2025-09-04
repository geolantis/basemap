/**
 * Sync mapconfig.json to Supabase with proper background/overlay classification
 * 
 * This script reads the original mapconfig.json and updates Supabase with:
 * - Correct background/overlay classification
 * - Proxy URLs for secure API key handling
 * - All map metadata
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://wphrytrrikfkwehwahqc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHJ5dHJyaWtma3dlaHdhaHFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU1Mjk3NSwiZXhwIjoyMDcyMTI4OTc1fQ.gqZvkZAhCP9jk-6m6YDys2vjGuY_ZElu752gsF-n-bg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Map proxy configurations
const PROXY_MAPS = {
  'Global': 'maptiler-streets-v2',
  'Global2': 'clockwork-streets',
  'Landscape': 'maptiler-landscape',
  'Ocean': 'maptiler-ocean',
  'Outdoor': 'maptiler-outdoor-v2',
  'Dataviz': 'maptiler-dataviz',
  'Kataster BEV': 'bev-kataster',
  'Kataster BEV Light': 'bev-kataster-light',
  'BasemapDEGlobal': 'basemap-de-global'
};

async function syncMaps() {
  try {
    // Read the mapconfig-full.json from the web/src/data directory
    const configPath = path.join(__dirname, '../src/data/mapconfig-full.json');
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);

    console.log('📚 Reading mapconfig.json...');
    console.log(`  - Background maps: ${Object.keys(config.backgroundMaps).length}`);
    console.log(`  - Overlay maps: ${Object.keys(config.overlayMaps).length}`);

    // Process background maps
    console.log('\n🗺️ Processing background maps...');
    for (const [key, mapData] of Object.entries(config.backgroundMaps)) {
      await upsertMap(key, mapData, 'background');
    }

    // Process overlay maps
    console.log('\n🎨 Processing overlay maps...');
    for (const [key, mapData] of Object.entries(config.overlayMaps)) {
      await upsertMap(key, mapData, 'overlay');
    }

    console.log('\n✅ Sync complete!');

  } catch (error) {
    console.error('❌ Error syncing maps:', error);
    process.exit(1);
  }
}

async function upsertMap(key, mapData, category) {
  try {
    // Prepare the map object
    const map = {
      name: mapData.name || key,
      label: mapData.label || mapData.name || key,
      type: mapData.type || 'vtc',
      country: mapData.country || 'Unknown',
      flag: mapData.flag || '🏳️',
      map_category: category,
      is_active: true,
      metadata: {}
    };

    // Handle style URL - use proxy for known providers
    if (PROXY_MAPS[key]) {
      map.style = `https://mapconfig.geolantis.com/api/proxy/style/${PROXY_MAPS[key]}`;
    } else if (mapData.style) {
      // For other styles, keep the original or create a local style endpoint
      if (mapData.style.includes('api.maptiler.com') || 
          mapData.style.includes('clockworkmicro.com') ||
          mapData.style.includes('kataster.bev.gv.at')) {
        // These should use proxy but aren't configured yet
        map.style = mapData.style.replace(/[?&]key=[^&]+/g, ''); // Remove API keys
      } else {
        map.style = mapData.style;
      }
    }

    // Handle raster tiles (WMTS/XYZ)
    if (mapData.tiles) {
      map.tiles = mapData.tiles;
      map.type = mapData.type || 'wmts';
    }

    // Handle tilesets (for overlays)
    if (mapData.tileset) {
      map.metadata.tileset = mapData.tileset;
    }

    // Handle additional overlay properties
    if (mapData.selectLayer) {
      map.metadata.selectLayer = mapData.selectLayer;
    }
    if (mapData.extra_sprite) {
      map.metadata.extra_sprite = mapData.extra_sprite;
    }

    // Handle zoom limits
    if (mapData.minzoom !== undefined) {
      map.min_zoom = mapData.minzoom;
    }
    if (mapData.maxzoom !== undefined) {
      map.max_zoom = mapData.maxzoom;
    }

    // Handle attribution
    if (mapData.attribution) {
      map.attribution = mapData.attribution;
    }

    // Handle layers (for overlays)
    if (mapData.layers) {
      map.layers = mapData.layers;
    }

    console.log(`  ${category === 'background' ? '🗺️' : '🎨'} ${map.name} (${map.country})`);

    // Upsert to Supabase
    const { data, error } = await supabase
      .from('maps')
      .upsert(map, {
        onConflict: 'name',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`    ❌ Error: ${error.message}`);
    } else {
      console.log(`    ✅ Synced`);
    }

  } catch (error) {
    console.error(`  ❌ Failed to process ${key}:`, error.message);
  }
}

// Run the sync
syncMaps();