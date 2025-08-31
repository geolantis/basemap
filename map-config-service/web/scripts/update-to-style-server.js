#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Your style server URL - change this if deploying
const STYLE_SERVER_URL = 'http://localhost:3001';

async function updateToStyleServer() {
  console.log('Updating map_configs to use style server...\n');
  
  // Maps that should use style server
  const mapsToUpdate = [
    { name: 'Kataster BEV', styleName: 'kataster-bev' },
    { name: 'Kataster BEV2', styleName: 'kataster-bev2' },
    { name: 'BEV DKM Punkte & Symbole', styleName: 'ovl-kataster', isOverlay: true },
    { name: 'Basemap Austria', styleName: 'basemap' },
    { name: 'Basemap Orthophoto', styleName: 'basemap-ortho' },
    { name: 'Basemap Grau', styleName: 'basemap2' },
    { name: 'Basemap Overlay', styleName: 'basemap3' },
    { name: 'Basemap High DPI', styleName: 'basemap4' },
    { name: 'Basemap Gelände', styleName: 'basemap5' },
    { name: 'Basemap Oberfläche', styleName: 'basemap6' }
  ];
  
  let updated = 0;
  let failed = 0;
  
  for (const map of mapsToUpdate) {
    try {
      // Construct the style URL
      const styleUrl = `${STYLE_SERVER_URL}/api/styles/${map.styleName}`;
      
      // Get current metadata first
      const { data: currentMap } = await supabase
        .from('map_configs')
        .select('metadata')
        .eq('name', map.name)
        .single();
      
      // Update the map configuration
      // The style URL is stored in metadata.styleUrl
      const updateData = {
        metadata: {
          ...(currentMap?.metadata || {}),
          styleUrl: styleUrl,
          useStyleServer: true,
          styleName: map.styleName,
          isOverlay: map.isOverlay || false,
          sourceType: 'style-server'
        }
      };
      
      const { data, error } = await supabase
        .from('map_configs')
        .update(updateData)
        .eq('name', map.name);
      
      if (error) {
        console.log(`✗ Failed to update ${map.name}: ${error.message}`);
        failed++;
      } else {
        console.log(`✓ Updated ${map.name} → ${styleUrl}`);
        updated++;
      }
      
    } catch (err) {
      console.log(`✗ Error updating ${map.name}: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n=== Update Summary ===`);
  console.log(`✓ Successfully updated: ${updated} maps`);
  if (failed > 0) {
    console.log(`✗ Failed: ${failed} maps`);
  }
  
  console.log('\n📌 Important Notes:');
  console.log('1. The style server must be running: npm run styles:server');
  console.log('2. Default URL is http://localhost:3001');
  console.log('3. For production, update STYLE_SERVER_URL in this script');
  console.log('4. Style files are served from: /Users/michael/Development/basemap/');
  console.log('\nStyle references (like basemap7 → bm.json) are automatically resolved!');
}

// Run the update
updateToStyleServer().catch(console.error);