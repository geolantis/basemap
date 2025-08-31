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

async function importAllMaps() {
  console.log('📥 Importing ALL maps from mapconfig.json to Supabase...\n');

  let basemapsAdded = 0;
  let basemapsUpdated = 0;
  let overlaysAdded = 0;
  let overlaysUpdated = 0;
  let errors = 0;

  // Process background maps
  console.log('📍 Processing background maps...');
  const backgroundMaps = mapConfig.backgroundMaps || {};
  
  for (const [key, map] of Object.entries(backgroundMaps)) {
    try {
      const mapData = {
        name: map.name || key,
        label: map.label || key,
        type: map.type || 'vtc',
        style: map.style || null,
        country: map.country || 'Unknown',
        flag: map.flag || '🌐',
        metadata: {
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
        is_active: true
      };

      // Clean up metadata - remove undefined values
      Object.keys(mapData.metadata).forEach(key => {
        if (mapData.metadata[key] === undefined) {
          delete mapData.metadata[key];
        }
      });

      // Check if map already exists
      const { data: existing } = await supabase
        .from('map_configs')
        .select('id')
        .eq('name', mapData.name)
        .single();

      if (existing) {
        // Update existing map
        const { error: updateError } = await supabase
          .from('map_configs')
          .update({
            ...mapData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`❌ Error updating ${mapData.name}:`, updateError.message);
          errors++;
        } else {
          console.log(`✅ Updated: ${mapData.name}`);
          basemapsUpdated++;
        }
      } else {
        // Add new map
        const { error: insertError } = await supabase
          .from('map_configs')
          .insert({
            ...mapData,
            version: 1
          });

        if (insertError) {
          console.error(`❌ Error adding ${mapData.name}:`, insertError.message);
          errors++;
        } else {
          console.log(`➕ Added: ${mapData.name}`);
          basemapsAdded++;
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error with ${key}:`, error);
      errors++;
    }
  }

  // Process overlay maps
  console.log('\n🔲 Processing overlay maps...');
  const overlayMaps = mapConfig.overlayMaps || {};
  
  for (const [key, overlay] of Object.entries(overlayMaps)) {
    try {
      const overlayData = {
        name: overlay.name || key,
        label: overlay.label || key,
        type: overlay.type || 'vtc',
        style: overlay.style || null,
        country: overlay.country || 'Unknown',
        flag: overlay.flag || '🌐',
        metadata: {
          isOverlay: true,
          overlayType: key.includes('Kataster') || key.includes('kataster') ? 'cadastral' : 
                       key.includes('flawi') ? 'zoning' :
                       key.includes('gefahr') ? 'hazard' :
                       key.includes('dkm') || key.includes('symbole') ? 'symbols' : 
                       overlay.type === 'wms' ? 'wms' : 'other',
          tileset: overlay.tileset,
          extra_sprite: overlay.extra_sprite,
          selectLayer: overlay.selectLayer,
          url: overlay.url,
          layers: overlay.layers,
          format: overlay.format,
          transparent: overlay.transparent,
          version: overlay.version,
          styleUrl: overlay.styleUrl,
          popupLayers: overlay.popupLayers,
          attribution: overlay.attribution
        },
        is_active: true
      };

      // Clean up metadata - remove undefined values
      Object.keys(overlayData.metadata).forEach(key => {
        if (overlayData.metadata[key] === undefined) {
          delete overlayData.metadata[key];
        }
      });

      // Check if map already exists
      const { data: existing } = await supabase
        .from('map_configs')
        .select('id')
        .eq('name', overlayData.name)
        .single();

      if (existing) {
        // Update existing map
        const { error: updateError } = await supabase
          .from('map_configs')
          .update({
            ...overlayData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`❌ Error updating ${overlayData.name}:`, updateError.message);
          errors++;
        } else {
          console.log(`✅ Updated overlay: ${overlayData.name}`);
          overlaysUpdated++;
        }
      } else {
        // Add new map
        const { error: insertError } = await supabase
          .from('map_configs')
          .insert({
            ...overlayData,
            version: 1
          });

        if (insertError) {
          console.error(`❌ Error adding ${overlayData.name}:`, insertError.message);
          errors++;
        } else {
          console.log(`➕ Added overlay: ${overlayData.name}`);
          overlaysAdded++;
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error with ${key}:`, error);
      errors++;
    }
  }

  // Display summary
  console.log('\n' + '='.repeat(50));
  console.log('✨ Import complete!\n');
  console.log('📋 Summary:');
  console.log(`\n📍 Background Maps:`);
  console.log(`  ➕ Added: ${basemapsAdded}`);
  console.log(`  ✅ Updated: ${basemapsUpdated}`);
  console.log(`  📊 Total in config: ${Object.keys(backgroundMaps).length}`);
  console.log(`\n🔲 Overlay Maps:`);
  console.log(`  ➕ Added: ${overlaysAdded}`);
  console.log(`  ✅ Updated: ${overlaysUpdated}`);
  console.log(`  📊 Total in config: ${Object.keys(overlayMaps).length}`);
  console.log(`\n❌ Errors: ${errors}`);

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

// Run the import
importAllMaps();