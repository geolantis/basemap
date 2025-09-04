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

// Map of basemap names to their preview image URLs
// These match the basemap names shown in your screenshot
const BASEMAP_PREVIEWS = {
  // Austrian basemaps
  'Agrar Atlas': 'https://mapconfig.geolantis.com/images/basemaps/agrar-atlas.png',
  'Austria Isolines': 'https://mapconfig.geolantis.com/images/basemaps/austria-isolines.png',
  'Basemap 1': 'https://mapconfig.geolantis.com/images/basemaps/basemap-1.png',
  'Basemap 2': 'https://mapconfig.geolantis.com/images/basemaps/basemap-2.png',
  'Basemap 3': 'https://mapconfig.geolantis.com/images/basemaps/basemap-3.png',
  'Basemap Grau': 'https://mapconfig.geolantis.com/images/basemaps/basemap-grau.png',
  'Basemap Ortho': 'https://mapconfig.geolantis.com/images/basemaps/basemap-ortho.png',
  'Basemap Ortho Blue': 'https://mapconfig.geolantis.com/images/basemaps/basemap-ortho-blue.png',
  'Basemap Ortho KTN': 'https://mapconfig.geolantis.com/images/basemaps/basemap-ortho-ktn.png',
  'Basemap Standard': 'https://mapconfig.geolantis.com/images/basemaps/basemap-standard.png',
  'basemap.at': 'https://mapconfig.geolantis.com/images/basemaps/basemap-at.png',
  'basemap.at Gelände': 'https://mapconfig.geolantis.com/images/basemaps/basemap-at-gelaende.png',
  'basemap.at Oberfläche': 'https://mapconfig.geolantis.com/images/basemaps/basemap-at-oberflaeche.png',
  'basemap.at Orthofoto': 'https://mapconfig.geolantis.com/images/basemaps/basemap-at-orthofoto.png',
  'basemap.at Overlay': 'https://mapconfig.geolantis.com/images/basemaps/basemap-at-overlay.png',
  
  // Global basemaps (MapTiler, Clockwork, etc.)
  'MapTiler Streets': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-streets.png',
  'MapTiler Streets v2': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-streets-v2.png',
  'MapTiler Satellite': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-satellite.png',
  'MapTiler Hybrid': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-hybrid.png',
  'MapTiler Basic': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-basic.png',
  'MapTiler Basic v2': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-basic-v2.png',
  'MapTiler Bright': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-bright.png',
  'MapTiler Bright v2': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-bright-v2.png',
  'MapTiler Topo': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-topo.png',
  'MapTiler Topo v2': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-topo-v2.png',
  'MapTiler Winter': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-winter.png',
  'MapTiler Winter v2': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-winter-v2.png',
  'MapTiler Outdoor': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-outdoor.png',
  'MapTiler Outdoor v2': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-outdoor-v2.png',
  'MapTiler Ocean': 'https://mapconfig.geolantis.com/images/basemaps/maptiler-ocean.png',
  
  // OpenStreetMap variants
  'OSM Standard': 'https://mapconfig.geolantis.com/images/basemaps/osm-standard.png',
  'OSM Humanitarian': 'https://mapconfig.geolantis.com/images/basemaps/osm-humanitarian.png',
  'OSM Cycle': 'https://mapconfig.geolantis.com/images/basemaps/osm-cycle.png',
  'OSM Transport': 'https://mapconfig.geolantis.com/images/basemaps/osm-transport.png',
  
  // Clockwork Micro
  'Clockwork Classic': 'https://mapconfig.geolantis.com/images/basemaps/clockwork-classic.png',
  'Clockwork Dark': 'https://mapconfig.geolantis.com/images/basemaps/clockwork-dark.png',
  'Clockwork Light': 'https://mapconfig.geolantis.com/images/basemaps/clockwork-light.png',
  'Clockwork Vintage': 'https://mapconfig.geolantis.com/images/basemaps/clockwork-vintage.png',
  
  // Carto
  'Carto Light': 'https://mapconfig.geolantis.com/images/basemaps/carto-light.png',
  'Carto Dark': 'https://mapconfig.geolantis.com/images/basemaps/carto-dark.png',
  'Carto Voyager': 'https://mapconfig.geolantis.com/images/basemaps/carto-voyager.png',
  'Carto Positron': 'https://mapconfig.geolantis.com/images/basemaps/carto-positron.png',
  
  // Stadia Maps
  'Stadia Alidade Smooth': 'https://mapconfig.geolantis.com/images/basemaps/stadia-alidade-smooth.png',
  'Stadia Alidade Dark': 'https://mapconfig.geolantis.com/images/basemaps/stadia-alidade-dark.png',
  'Stadia Outdoors': 'https://mapconfig.geolantis.com/images/basemaps/stadia-outdoors.png',
  'Stadia OSM Bright': 'https://mapconfig.geolantis.com/images/basemaps/stadia-osm-bright.png',
  
  // Stamen
  'Stamen Toner': 'https://mapconfig.geolantis.com/images/basemaps/stamen-toner.png',
  'Stamen Terrain': 'https://mapconfig.geolantis.com/images/basemaps/stamen-terrain.png',
  'Stamen Watercolor': 'https://mapconfig.geolantis.com/images/basemaps/stamen-watercolor.png',
};

/**
 * Generate a preview URL from the map name
 */
function generatePreviewUrl(mapName, mapLabel) {
  // First check if we have a direct mapping
  if (BASEMAP_PREVIEWS[mapLabel]) {
    return BASEMAP_PREVIEWS[mapLabel];
  }
  
  // Try to match by name
  if (BASEMAP_PREVIEWS[mapName]) {
    return BASEMAP_PREVIEWS[mapName];
  }
  
  // Generate URL from name
  const slug = mapName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `https://mapconfig.geolantis.com/images/basemaps/${slug}.png`;
}

async function addBasemapPreviews() {
  console.log('🖼️  Adding preview image URLs to basemaps...\n');

  try {
    // Fetch all basemaps (non-overlay maps)
    const { data: basemaps, error: fetchError } = await supabase
      .from('map_configs')
      .select('id, name, label, preview_image_url')
      .is('metadata->isOverlay', null)
      .order('label');

    if (fetchError) {
      console.error('❌ Error fetching basemaps:', fetchError.message);
      return;
    }

    if (!basemaps || basemaps.length === 0) {
      console.log('No basemaps found in database.');
      return;
    }

    console.log(`Found ${basemaps.length} basemaps to process.\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const basemap of basemaps) {
      // Skip if already has a preview URL
      if (basemap.preview_image_url) {
        console.log(`⏭️  Skipping: ${basemap.label} (already has preview)`);
        skipped++;
        continue;
      }

      // Generate preview URL
      const previewUrl = generatePreviewUrl(basemap.name, basemap.label);
      
      // Update the basemap with preview URL
      const { error: updateError } = await supabase
        .from('map_configs')
        .update({
          preview_image_url: previewUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', basemap.id);

      if (updateError) {
        console.error(`❌ Error updating ${basemap.label}:`, updateError.message);
        errors++;
      } else {
        console.log(`✅ Updated: ${basemap.label}`);
        console.log(`   Preview: ${previewUrl}`);
        updated++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ Basemap preview update complete!\n');
    console.log('📋 Summary:');
    console.log(`  ✅ Maps updated: ${updated}`);
    console.log(`  ⏭️  Maps skipped: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log(`  📊 Total basemaps: ${basemaps.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
addBasemapPreviews();