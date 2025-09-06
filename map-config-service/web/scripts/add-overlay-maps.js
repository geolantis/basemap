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

// Overlay maps to add/update
const OVERLAY_MAPS = [
  // Official BEV Layers
  {
    name: 'bev_kataster_amtlich',
    label: 'BEV Kataster amtlich (Vermessungsverordnung)',
    type: 'vtc', 
    style: 'https://kataster.bev.gv.at/styles/kataster/style_vermv.json',
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/bev-kataster-amtlich',
    metadata: {
      isOverlay: true,
      overlayType: 'cadastral',
      description: 'Official cadastral map according to Austrian surveying regulations',
      tileset: 'https://kataster.bev.gv.at/styles/kataster/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite',
      selectLayer: 'Grundstücke - Flächen',
      provider: 'BEV Austria',
      officialStyle: true
    }
  },
  {
    name: 'bev_symbole_amtlich', 
    label: 'BEV Symbole amtlich (Vermessungsverordnung)',
    type: 'vtc',
    style: 'https://kataster.bev.gv.at/styles/symbole/style_vermv.json',
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/bev-symbole-amtlich',
    metadata: {
      isOverlay: true,
      overlayType: 'symbols',
      description: 'Official cadastral symbols according to Austrian surveying regulations',
      tileset: 'https://kataster.bev.gv.at/styles/symbole/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite',
      provider: 'BEV Austria',
      officialStyle: true
    }
  },
  {
    name: 'bev_kataster_orthophoto',
    label: 'BEV Kataster + Orthophoto optimiert',
    type: 'vtc',
    style: 'https://kataster.bev.gv.at/styles/kataster/style_ortho.json',
    country: 'Austria', 
    flag: '🇦🇹',
    preview_image_url: '/api/preview/bev-kataster-orthophoto',
    metadata: {
      isOverlay: true,
      overlayType: 'cadastral',
      description: 'Cadastral overlay optimized for combination with orthophotos',
      tileset: 'https://kataster.bev.gv.at/styles/kataster/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite',
      selectLayer: 'Grundstücke - Flächen',
      provider: 'BEV Austria',
      optimizedFor: 'orthophoto',
      officialStyle: true
    }
  },
  {
    name: 'bev_symbole_orthophoto',
    label: 'BEV Symbole + Orthophoto optimiert',
    type: 'vtc',
    style: 'https://kataster.bev.gv.at/styles/symbole/style_ortho.json',
    country: 'Austria',
    flag: '🇦🇹', 
    preview_image_url: '/api/preview/bev-symbole-orthophoto',
    metadata: {
      isOverlay: true,
      overlayType: 'symbols',
      description: 'Cadastral symbols optimized for combination with orthophotos',
      tileset: 'https://kataster.bev.gv.at/styles/symbole/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite',
      provider: 'BEV Austria',
      optimizedFor: 'orthophoto',
      officialStyle: true
    }
  },
  {
    name: 'bev_kataster_light',
    label: 'BEV Kataster light (Pastelltöne)',
    type: 'vtc',
    style: 'https://kataster.bev.gv.at/styles/kataster/style_basic.json',
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/bev-kataster-light',
    metadata: {
      isOverlay: true,
      overlayType: 'cadastral',
      description: 'Simple cadastral display with pastel colors and highlighted border cadastre properties',
      tileset: 'https://kataster.bev.gv.at/styles/kataster/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite',
      selectLayer: 'Grundstücke - Flächen',
      provider: 'BEV Austria',
      style: 'light',
      officialStyle: true
    }
  },
  {
    name: 'bev_kataster_gis',
    label: 'BEV Kataster BEV (GIS-Färbung)',
    type: 'vtc', 
    style: 'https://kataster.bev.gv.at/styles/kataster/style_gis.json',
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/bev-kataster-gis',
    metadata: {
      isOverlay: true,
      overlayType: 'cadastral',
      description: 'Cadastral map with BEV-GIS usage area coloring according to surveying regulations',
      tileset: 'https://kataster.bev.gv.at/styles/kataster/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite',
      selectLayer: 'Grundstücke - Flächen',
      provider: 'BEV Austria',
      coloring: 'gis',
      officialStyle: true
    }
  },
  {
    name: 'bev_symbole_gis',
    label: 'BEV Symbole BEV (GIS-Färbung)',
    type: 'vtc',
    style: 'https://kataster.bev.gv.at/styles/symbole/style_gis.json',
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/bev-symbole-gis',
    metadata: {
      isOverlay: true,
      overlayType: 'symbols',
      description: 'Cadastral symbols with BEV-GIS coloring according to surveying regulations',
      tileset: 'https://kataster.bev.gv.at/styles/symbole/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite',
      provider: 'BEV Austria',
      coloring: 'gis',
      officialStyle: true
    }
  },
  // Legacy/Existing overlays (keeping for compatibility)
  {
    name: 'Kataster BEV',
    label: 'BEV Kataster (Legacy)',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster-bev2.json',
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/kataster-bev',
    metadata: {
      isOverlay: true,
      overlayType: 'cadastral',
      tileset: 'https://kataster.bev.gv.at/styles/kataster/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite',
      selectLayer: 'Grundstücke - Flächen',
      legacy: true
    }
  },
  {
    name: 'Kataster BEV2',
    label: 'BEV Kataster 2',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster-bev.json',
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/kataster-bev2',
    metadata: {
      isOverlay: true,
      overlayType: 'cadastral',
      tileset: 'https://kataster.bev.gv.at/styles/kataster/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite',
      selectLayer: 'Grundstücke - Flächen'
    }
  },
  {
    name: 'dkm_bev_symbole',
    label: 'BEV DKM Punkte & Symbole',
    type: 'vtc',
    style: 'https://gis.ktn.gv.at/osgdi/styles/BEV_kataster_symbole.json',
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/dkm-bev-symbole',
    metadata: {
      isOverlay: true,
      overlayType: 'symbols',
      tileset: 'https://kataster.bev.gv.at/styles/symbole/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite'
    }
  },
  {
    name: 'KatasterKTNLight',
    label: 'KTN Kataster Light',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/grundstuecke_kataster-ktn-light.json',
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/kataster-ktn-light',
    metadata: {
      isOverlay: true,
      overlayType: 'cadastral',
      tileset: 'https://gis.ktn.gv.at/osgdi/tilesets/gst_bev.json',
      selectLayer: 'gst_bev_fill'
    }
  },
  {
    name: 'Kataster OVL',
    label: 'Kataster Grau Overlay',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/ovl-kataster.json',
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/kataster-ovl',
    metadata: {
      isOverlay: true,
      overlayType: 'cadastral',
      tileset: 'https://kataster.bev.gv.at/styles/kataster/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite',
      selectLayer: 'Grundstücke - Flächen'
    }
  },
  {
    name: 'flawi',
    label: 'KTN Flächenwidmung',
    type: 'vtc',
    style: 'https://gis.ktn.gv.at/osgdi/styles//flaewi_ktn.json',
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/flawi',
    metadata: {
      isOverlay: true,
      overlayType: 'zoning',
      tileset: 'https://gis.ktn.gv.at/osgdi/tilesets/flawi.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite'
    }
  },
  {
    name: 'gefahr',
    label: 'KTN Gefahrenzonen',
    type: 'vtc',
    style: 'https://gis.ktn.gv.at/osgdi/styles/overlaystyle_wasser_schutz.json',
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/gefahr',
    metadata: {
      isOverlay: true,
      overlayType: 'hazard',
      tileset: 'https://gis.ktn.gv.at/osgdi/tilesets/overlay_wasser.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite'
    }
  },
  {
    name: 'Inspire WMS',
    label: 'Inspire WMS',
    type: 'wms',
    style: null,
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/inspire-wms',
    metadata: {
      isOverlay: true,
      overlayType: 'wms',
      url: 'http://wsa.bev.gv.at/GeoServer/Interceptor/Wms/CP/INSPIRE_KUNDEN-2375336d-49b8-4e62-8640-6d6668ba100a',
      layers: ['CP.CadastralParcel_Parcel'],
      format: 'image/png',
      transparent: true,
      version: '1.3.0'
    }
  },
  {
    name: 'BEV DKM GST',
    label: 'BEV DKM GST',
    type: 'wms',
    style: null,
    country: 'Austria',
    flag: '🇦🇹',
    preview_image_url: '/api/preview/bev-dkm-gst',
    metadata: {
      isOverlay: true,
      overlayType: 'wms',
      url: 'https://data.bev.gv.at/geoserver/BEVdataKAT/wms',
      layers: ['KAT_DKM_GST'],
      format: 'image/png',
      transparent: true,
      version: '1.3.0'
    }
  }
];

async function addOverlayMaps() {
  console.log('🔲 Adding/updating overlay maps in Supabase...\n');

  let added = 0;
  let updated = 0;
  let errors = 0;

  for (const overlay of OVERLAY_MAPS) {
    try {
      // Check if map already exists
      const { data: existing, error: checkError } = await supabase
        .from('map_configs')
        .select('id')
        .eq('name', overlay.name)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // Error other than "not found"
        console.error(`❌ Error checking ${overlay.name}:`, checkError.message);
        errors++;
        continue;
      }

      if (existing) {
        // Update existing map
        const { error: updateError } = await supabase
          .from('map_configs')
          .update({
            label: overlay.label,
            type: overlay.type,
            style: overlay.style,
            country: overlay.country,
            flag: overlay.flag,
            preview_image_url: overlay.preview_image_url,
            metadata: overlay.metadata,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`❌ Error updating ${overlay.name}:`, updateError.message);
          errors++;
        } else {
          console.log(`✅ Updated: ${overlay.name}`);
          updated++;
        }
      } else {
        // Add new map
        const { error: insertError } = await supabase
          .from('map_configs')
          .insert({
            name: overlay.name,
            label: overlay.label,
            type: overlay.type,
            style: overlay.style,
            country: overlay.country,
            flag: overlay.flag,
            preview_image_url: overlay.preview_image_url,
            metadata: overlay.metadata,
            version: 1,
            is_active: true
          });

        if (insertError) {
          console.error(`❌ Error adding ${overlay.name}:`, insertError.message);
          errors++;
        } else {
          console.log(`➕ Added: ${overlay.name}`);
          added++;
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error with ${overlay.name}:`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✨ Overlay maps update complete!\n');
  console.log('📋 Summary:');
  console.log(`  ➕ Maps added: ${added}`);
  console.log(`  ✅ Maps updated: ${updated}`);
  console.log(`  ❌ Errors: ${errors}`);

  // Get final overlay count
  const { count: overlayCount } = await supabase
    .from('map_configs')
    .select('*', { count: 'exact', head: true })
    .not('metadata->isOverlay', 'is', null);

  console.log(`\n📊 Total overlay maps in database: ${overlayCount}`);
}

// Run the script
addOverlayMaps();