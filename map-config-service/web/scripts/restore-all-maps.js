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

// All background maps from mapconfig.json
const BACKGROUND_MAPS = [
  // Global maps
  {
    name: 'Global',
    label: 'Global',
    type: 'vtc',
    style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=ldV32HV5eBdmgfE7vZJI',
    country: 'Global',
    flag: '🌐'
  },
  {
    name: 'Global2',
    label: 'Global 2',
    type: 'vtc',
    style: 'https://maps.clockworkmicro.com/streets/v1/style?x-api-key=9G4F5b99xO28esL8tArIO2Bbp8sGhURW5qIieYTy',
    country: 'Global',
    flag: '🌐'
  },
  {
    name: 'Landscape',
    label: 'Landscape',
    type: 'vtc',
    style: 'https://api.maptiler.com/maps/landscape/style.json?key=ldV32HV5eBdmgfE7vZJI',
    country: 'Global',
    flag: '🌐'
  },
  {
    name: 'BasemapDEGlobal',
    label: 'Basemap.de Global',
    type: 'vtc',
    style: 'https://sgx.geodatenzentrum.de/gdz_basemapworld_vektor/styles/bm_web_wld_col.json',
    country: 'Global',
    flag: '🌐'
  },
  {
    name: 'Ocean',
    label: 'Ocean',
    type: 'vtc',
    style: 'https://api.maptiler.com/maps/ocean/style.json?key=ldV32HV5eBdmgfE7vZJI',
    country: 'Global',
    flag: '🌐'
  },
  {
    name: 'Outdoor',
    label: 'Outdoor',
    type: 'vtc',
    style: 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=ldV32HV5eBdmgfE7vZJI',
    country: 'Global',
    flag: '🌐'
  },
  {
    name: 'Dataviz',
    label: 'Dataviz',
    type: 'vtc',
    style: 'https://api.maptiler.com/maps/dataviz/style.json?key=ldV32HV5eBdmgfE7vZJI',
    country: 'Global',
    flag: '🌐'
  },
  {
    name: 'OSMLiberty',
    label: 'OSM Liberty',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/osmliberty.json',
    country: 'Global',
    flag: '🌐'
  },
  {
    name: 'OSMBright',
    label: 'OSM Bright',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/osmliberty.json',
    country: 'Global',
    flag: '🌐'
  },
  {
    name: 'OSM3D',
    label: 'OSM 3D',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/maptiler3d.json',
    country: 'Global',
    flag: '🌐'
  },
  {
    name: 'GlobalSat',
    label: 'Global Satellite',
    type: 'vtc',
    style: 'https://api.maptiler.com/maps/satellite/style.json?key=ldV32HV5eBdmgfE7vZJI',
    country: 'Global',
    flag: '🌐'
  },
  
  // Austrian basemaps
  {
    name: 'Basemap Standard',
    label: 'Basemap Standard',
    type: 'vtc',
    style: 'https://gis.ktn.gv.at/osgdi/styles/basemap_ktn_vektor.json',
    country: 'Austria',
    flag: '🇦🇹'
  },
  {
    name: 'Basemap Grau',
    label: 'Basemap Grau',
    type: 'vtc',
    style: 'https://gis.ktn.gv.at/osgdi/styles/basemap_grau_ktn_vektor.json',
    country: 'Austria',
    flag: '🇦🇹'
  },
  {
    name: 'Basemap Ortho',
    label: 'Basemap Ortho',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap-ortho.json',
    country: 'Austria',
    flag: '🇦🇹'
  },
  {
    name: 'Basemap Ortho KTN',
    label: 'Basemap Ortho KTN',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemapktn-ortho.json',
    country: 'Austria',
    flag: '🇦🇹'
  },
  {
    name: 'BEVLight',
    label: 'BEV Light',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster-light.json',
    country: 'Austria',
    flag: '🇦🇹'
  },
  {
    name: 'BEVOrtho',
    label: 'BEV Ortho',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster-ortho.json',
    country: 'Austria',
    flag: '🇦🇹'
  },
  {
    name: 'Basemap Ortho Blue',
    label: 'Basemap Ortho Blue',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap-ortho-blue.json',
    country: 'Austria',
    flag: '🇦🇹'
  },
  {
    name: 'Orthofoto',
    label: 'Orthofoto',
    type: 'wmts',
    style: null,
    country: 'Austria',
    flag: '🇦🇹',
    metadata: {
      tiles: ['https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg']
    }
  },
  {
    name: 'BEV Ortho',
    label: 'BEV Ortho',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/bev-katasterlight.json',
    country: 'Austria',
    flag: '🇦🇹'
  },
  {
    name: 'Basemap.at',
    label: 'basemap.at',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap-at-new.json',
    country: 'Austria',
    flag: '🇦🇹'
  },
  {
    name: 'Agrar',
    label: 'Agrar Atlas',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/agraratlas.json',
    country: 'Austria',
    flag: '🇦🇹'
  },
  {
    name: 'basemapcustom2',
    label: 'Basemap 1',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap2.json',
    country: 'Austria',
    flag: '🇦🇹'
  },
  {
    name: 'basemapcustom3',
    label: 'Basemap 2',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap3.json',
    country: 'Austria',
    flag: '🇦🇹'
  },
  {
    name: 'basemapcustom4',
    label: 'Basemap 3',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap7.json',
    country: 'Austria',
    flag: '🇦🇹'
  }
];

// All overlay maps from mapconfig.json
const OVERLAY_MAPS = [
  {
    name: 'Kataster',
    label: 'KTN Kataster',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster.json',
    country: 'Austria',
    flag: '🇦🇹',
    metadata: {
      isOverlay: true,
      overlayType: 'cadastral',
      tileset: 'https://gis.ktn.gv.at/osgdi/tilesets/gst_bev.json',
      selectLayer: 'gst_bev_fill'
    }
  },
  {
    name: 'Kataster BEV',
    label: 'BEV Kataster',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster-bev2.json',
    country: 'Austria',
    flag: '🇦🇹',
    metadata: {
      isOverlay: true,
      overlayType: 'cadastral',
      tileset: 'https://kataster.bev.gv.at/styles/kataster/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite',
      selectLayer: 'Grundstücke - Flächen'
    }
  },
  {
    name: 'Kataster BEV2',
    label: 'BEV Kataster 2',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster-bev.json',
    country: 'Austria',
    flag: '🇦🇹',
    metadata: {
      isOverlay: true,
      overlayType: 'cadastral',
      tileset: 'https://kataster.bev.gv.at/styles/kataster/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite',
      selectLayer: 'Grundstücke - Flächen'
    }
  },
  {
    name: 'KatasterKTNLight',
    label: 'KTN Kataster Light',
    type: 'vtc',
    style: 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/grundstuecke_kataster-ktn-light.json',
    country: 'Austria',
    flag: '🇦🇹',
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
    metadata: {
      isOverlay: true,
      overlayType: 'symbols',
      tileset: 'https://kataster.bev.gv.at/styles/symbole/tiles.json',
      extra_sprite: 'https://kataster.bev.gv.at/styles/sprite'
    }
  },
  {
    name: 'flawi',
    label: 'KTN Flächenwidmung',
    type: 'vtc',
    style: 'https://gis.ktn.gv.at/osgdi/styles//flaewi_ktn.json',
    country: 'Austria',
    flag: '🇦🇹',
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

async function restoreAllMaps() {
  console.log('🔄 Restoring all maps to Supabase database...\n');

  let basemapsAdded = 0;
  let basemapsUpdated = 0;
  let overlaysAdded = 0;
  let overlaysUpdated = 0;
  let errors = 0;

  // Process background maps
  console.log('📍 Processing background maps...');
  for (const map of BACKGROUND_MAPS) {
    try {
      // Check if map already exists
      const { data: existing } = await supabase
        .from('map_configs')
        .select('id')
        .eq('name', map.name)
        .single();

      if (existing) {
        // Update existing map
        const { error: updateError } = await supabase
          .from('map_configs')
          .update({
            label: map.label,
            type: map.type,
            style: map.style,
            country: map.country,
            flag: map.flag,
            metadata: map.metadata || {},
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`❌ Error updating ${map.name}:`, updateError.message);
          errors++;
        } else {
          console.log(`✅ Updated basemap: ${map.name}`);
          basemapsUpdated++;
        }
      } else {
        // Add new map
        const { error: insertError } = await supabase
          .from('map_configs')
          .insert({
            name: map.name,
            label: map.label,
            type: map.type,
            style: map.style,
            country: map.country,
            flag: map.flag,
            metadata: map.metadata || {},
            version: 1,
            is_active: true
          });

        if (insertError) {
          console.error(`❌ Error adding ${map.name}:`, insertError.message);
          errors++;
        } else {
          console.log(`➕ Added basemap: ${map.name}`);
          basemapsAdded++;
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error with ${map.name}:`, error);
      errors++;
    }
  }

  // Process overlay maps
  console.log('\n🔲 Processing overlay maps...');
  for (const overlay of OVERLAY_MAPS) {
    try {
      // Check if map already exists
      const { data: existing } = await supabase
        .from('map_configs')
        .select('id')
        .eq('name', overlay.name)
        .single();

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
            metadata: overlay.metadata,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`❌ Error updating ${overlay.name}:`, updateError.message);
          errors++;
        } else {
          console.log(`✅ Updated overlay: ${overlay.name}`);
          overlaysUpdated++;
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
            metadata: overlay.metadata,
            version: 1,
            is_active: true
          });

        if (insertError) {
          console.error(`❌ Error adding ${overlay.name}:`, insertError.message);
          errors++;
        } else {
          console.log(`➕ Added overlay: ${overlay.name}`);
          overlaysAdded++;
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error with ${overlay.name}:`, error);
      errors++;
    }
  }

  // Display summary
  console.log('\n' + '='.repeat(50));
  console.log('✨ Database restoration complete!\n');
  console.log('📋 Summary:');
  console.log(`\n📍 Background Maps:`);
  console.log(`  ➕ Added: ${basemapsAdded}`);
  console.log(`  ✅ Updated: ${basemapsUpdated}`);
  console.log(`\n🔲 Overlay Maps:`);
  console.log(`  ➕ Added: ${overlaysAdded}`);
  console.log(`  ✅ Updated: ${overlaysUpdated}`);
  console.log(`\n❌ Errors: ${errors}`);

  // Get final counts
  const { count: totalCount } = await supabase
    .from('map_configs')
    .select('*', { count: 'exact', head: true });

  const { count: overlayCount } = await supabase
    .from('map_configs')
    .select('*', { count: 'exact', head: true })
    .not('metadata->isOverlay', 'is', null);

  const basemapCount = totalCount - overlayCount;

  console.log(`\n📊 Final database counts:`);
  console.log(`  Total maps: ${totalCount}`);
  console.log(`  Background maps: ${basemapCount}`);
  console.log(`  Overlay maps: ${overlayCount}`);
}

// Run the restoration
restoreAllMaps();