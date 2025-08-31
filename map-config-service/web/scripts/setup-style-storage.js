#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
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

// Style files to import (from the basemap repository)
const STYLE_FILES = [
  // Core basemap styles
  { file: 'basemap.json', name: 'basemap', description: 'Basemap Austria Standard' },
  { file: 'basemap2.json', name: 'basemap2', description: 'Basemap Austria v2' },
  { file: 'basemap3.json', name: 'basemap3', description: 'Basemap Austria v3' },
  { file: 'basemap4.json', name: 'basemap4', description: 'Basemap Austria v4' },
  { file: 'basemap5.json', name: 'basemap5', description: 'Basemap Austria v5' },
  { file: 'basemap6.json', name: 'basemap6', description: 'Basemap Austria v6' },
  { file: 'basemap7.json', name: 'basemap7', description: 'Basemap Austria v7' },
  { file: 'bm.json', name: 'bm', description: 'Basemap Austria Minimal' },
  
  // Basemap variants
  { file: 'basemap-at-new.json', name: 'basemap-at-new', description: 'Basemap Austria New' },
  { file: 'basemap-ortho.json', name: 'basemap-ortho', description: 'Basemap Orthophoto' },
  { file: 'basemap-ortho-blue.json', name: 'basemap-ortho-blue', description: 'Basemap Orthophoto Blue' },
  { file: 'basemapktn-ortho.json', name: 'basemapktn-ortho', description: 'Basemap KTN Orthophoto' },
  
  // Kataster styles
  { file: 'kataster.json', name: 'kataster', description: 'Kataster Standard' },
  { file: 'kataster-bev.json', name: 'kataster-bev', description: 'Kataster BEV' },
  { file: 'kataster-bev2.json', name: 'kataster-bev2', description: 'Kataster BEV v2' },
  { file: 'kataster-light.json', name: 'kataster-light', description: 'Kataster Light' },
  { file: 'kataster-ortho.json', name: 'kataster-ortho', description: 'Kataster Orthophoto' },
  { file: 'bev-katasterlight.json', name: 'bev-katasterlight', description: 'BEV Kataster Light' },
  { file: 'ovl-kataster.json', name: 'ovl-kataster', description: 'Overlay Kataster', isOverlay: true },
  
  // Regional styles
  { file: 'grundstuecke_kataster-ktn-light.json', name: 'grundstuecke-kataster-ktn-light', description: 'Grundstücke Kataster KTN Light' },
  { file: 'agraratlas.json', name: 'agraratlas', description: 'Agrar Atlas' },
  
  // International styles
  { file: 'nz-basemap-topographic.json', name: 'nz-basemap-topographic', description: 'New Zealand Basemap Topographic' }
];

async function setupStyleStorage() {
  console.log('Setting up style storage in Supabase...\n');
  
  // First, create the table if it doesn't exist
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS map_styles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      style_json JSONB NOT NULL,
      is_overlay BOOLEAN DEFAULT false,
      dependencies TEXT[], -- List of other style names this style depends on
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_map_styles_name ON map_styles(name);
    CREATE INDEX IF NOT EXISTS idx_map_styles_overlay ON map_styles(is_overlay);
  `;
  
  // Execute the SQL to create table
  const { error: createError } = await supabase.rpc('exec_sql', { 
    sql: createTableSQL 
  }).single();
  
  if (createError && !createError.message?.includes('already exists')) {
    console.log('Note: Table might already exist or exec_sql function not available');
    console.log('Proceeding to import styles...\n');
  } else {
    console.log('✓ Table map_styles created/verified\n');
  }
  
  // Import each style file
  const basemapPath = '/Users/michael/Development/basemap';
  let imported = 0;
  let failed = 0;
  
  for (const styleConfig of STYLE_FILES) {
    const filePath = resolve(basemapPath, styleConfig.file);
    
    if (!existsSync(filePath)) {
      console.log(`✗ File not found: ${styleConfig.file}`);
      failed++;
      continue;
    }
    
    try {
      // Read and parse the style JSON
      const styleContent = readFileSync(filePath, 'utf8');
      const styleJson = JSON.parse(styleContent);
      
      // Check for dependencies (references to other styles)
      const dependencies = [];
      
      // Check if this style imports or references another style
      if (styleJson.metadata?.import) {
        dependencies.push(styleJson.metadata.import);
      }
      
      // Check sources for references to other styles
      if (styleJson.sources) {
        Object.values(styleJson.sources).forEach(source => {
          if (source.url && source.url.includes('.json')) {
            const refName = basename(source.url, '.json');
            if (refName !== styleConfig.name) {
              dependencies.push(refName);
            }
          }
        });
      }
      
      // Prepare the record
      const record = {
        name: styleConfig.name,
        description: styleConfig.description,
        style_json: styleJson,
        is_overlay: styleConfig.isOverlay || false,
        dependencies: dependencies.length > 0 ? dependencies : null,
        updated_at: new Date().toISOString()
      };
      
      // Upsert the style (insert or update)
      const { data, error } = await supabase
        .from('map_styles')
        .upsert(record, { 
          onConflict: 'name',
          returning: 'minimal' 
        });
      
      if (error) {
        console.log(`✗ Failed to import ${styleConfig.name}: ${error.message}`);
        failed++;
      } else {
        console.log(`✓ Imported ${styleConfig.name}${dependencies.length > 0 ? ` (deps: ${dependencies.join(', ')})` : ''}`);
        imported++;
      }
      
    } catch (err) {
      console.log(`✗ Error processing ${styleConfig.file}: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n=== Import Summary ===`);
  console.log(`✓ Successfully imported: ${imported} styles`);
  if (failed > 0) {
    console.log(`✗ Failed: ${failed} styles`);
  }
  
  // Now update map_configs to reference these styles
  console.log('\n=== Updating map_configs to use stored styles ===\n');
  
  const mapsToUpdate = [
    { name: 'Kataster BEV', style_name: 'kataster-bev' },
    { name: 'Kataster BEV2', style_name: 'kataster-bev2' },
    { name: 'Basemap Austria', style_name: 'basemap' },
    { name: 'Basemap Orthophoto', style_name: 'basemap-ortho' }
  ];
  
  for (const mapUpdate of mapsToUpdate) {
    const { error } = await supabase
      .from('map_configs')
      .update({ 
        style_url: null,
        style_name: mapUpdate.style_name,
        metadata: supabase.rpc('jsonb_set', {
          target_jsonb: 'metadata',
          path: ['useStoredStyle'],
          new_value: true
        })
      })
      .eq('name', mapUpdate.name);
    
    if (!error) {
      console.log(`✓ Updated ${mapUpdate.name} to use stored style: ${mapUpdate.style_name}`);
    }
  }
  
  console.log('\n✅ Style storage setup complete!');
  console.log('\nYou can now serve styles through your API endpoint.');
  console.log('Example: /api/styles/:styleName');
}

// Run the setup
setupStyleStorage().catch(console.error);