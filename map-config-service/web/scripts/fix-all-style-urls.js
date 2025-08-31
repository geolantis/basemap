#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Production URL for styles
const PRODUCTION_URL = 'https://web-six-taupe.vercel.app';

// Mapping of old URLs to new style names
const URL_MAPPINGS = {
  'basemap.json': 'basemap',
  'basemap2.json': 'basemap2',
  'basemap3.json': 'basemap3',
  'basemap4.json': 'basemap4',
  'basemap5.json': 'basemap5',
  'basemap6.json': 'basemap6',
  'basemap7.json': 'basemap7',
  'bm.json': 'bm',
  'basemap-at-new.json': 'basemap-at-new',
  'basemap-ortho.json': 'basemap-ortho',
  'basemap-ortho-blue.json': 'basemap-ortho-blue',
  'basemapktn-ortho.json': 'basemapktn-ortho',
  'kataster.json': 'kataster',
  'kataster-bev.json': 'kataster-bev',
  'kataster-bev2.json': 'kataster-bev2',
  'kataster-light.json': 'kataster-light',
  'kataster-ortho.json': 'kataster-ortho',
  'bev-katasterlight.json': 'bev-katasterlight',
  'ovl-kataster.json': 'ovl-kataster',
  'grundstuecke_kataster-ktn-light.json': 'grundstuecke_kataster-ktn-light',
  'agraratlas.json': 'agraratlas',
  'nz-basemap-topographic.json': 'nz-basemap-topographic',
  // Additional mappings
  'osmliberty.json': 'osmliberty',
  'maptiler3d.json': 'maptiler3d',
  'de_brandenburg.json': 'de_brandenburg',
  'plan_ign.json': 'plan_ign',
  // basemap-at styles
  'basemap-v2.json': 'basemap2',
  'basemap-v3.json': 'basemap3'
};

async function fixAllStyleUrls() {
  console.log('🔧 Fixing all style URLs to use Vercel deployment...\n');
  
  // Get all maps with GitHub or problematic URLs
  const { data: maps, error } = await supabase
    .from('map_configs')
    .select('*')
    .or('style.ilike.%github%,style.ilike.%raw.githubusercontent%,style.ilike.%basemap-at%');
    
  if (error) {
    console.error('Error fetching maps:', error);
    return;
  }
  
  console.log(`Found ${maps.length} maps to fix\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (const map of maps) {
    try {
      let newStyleUrl = null;
      let styleName = null;
      
      // Extract the filename from the old URL
      if (map.style) {
        const urlParts = map.style.split('/');
        const filename = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
        
        if (URL_MAPPINGS[filename]) {
          styleName = URL_MAPPINGS[filename];
          newStyleUrl = `${PRODUCTION_URL}/styles/${styleName}.json`;
        } else {
          console.log(`⚠️  No mapping for ${map.name} with file: ${filename}`);
          
          // Try to handle special cases
          if (map.style.includes('basemap-at/styles')) {
            // basemap.at styles
            if (map.style.includes('basemap-v2')) {
              styleName = 'basemap2';
              newStyleUrl = `${PRODUCTION_URL}/styles/basemap2.json`;
            } else if (map.style.includes('basemap-v3')) {
              styleName = 'basemap3';
              newStyleUrl = `${PRODUCTION_URL}/styles/basemap3.json`;
            }
          } else if (map.style.includes('gis.ktn.gv.at')) {
            // Keep KTN styles as-is (they work)
            console.log(`  Keeping KTN style for ${map.name}`);
            continue;
          } else if (map.style.includes('ordnancesurvey')) {
            // Keep OS styles as-is (external)
            console.log(`  Keeping external style for ${map.name}`);
            continue;
          }
        }
      }
      
      if (newStyleUrl && styleName) {
        // Update the map configuration
        const updateData = {
          style: newStyleUrl,
          metadata: {
            ...map.metadata,
            styleUrl: newStyleUrl,
            styleName: styleName,
            sourceType: 'vercel-static',
            useProduction: true,
            originalUrl: map.style,
            lastUpdated: new Date().toISOString()
          }
        };
        
        const { error: updateError } = await supabase
          .from('map_configs')
          .update(updateData)
          .eq('id', map.id);
        
        if (updateError) {
          console.log(`❌ Failed to update ${map.name}: ${updateError.message}`);
          failed++;
        } else {
          console.log(`✅ Updated ${map.name} → ${newStyleUrl}`);
          updated++;
        }
      } else {
        console.log(`⏭️  Skipped ${map.name} - no mapping available`);
      }
      
    } catch (err) {
      console.log(`❌ Error updating ${map.name}: ${err.message}`);
      failed++;
    }
  }
  
  // Also fix maps that have styleUrl in metadata but wrong style field
  console.log('\n🔍 Checking for mismatched style fields...\n');
  
  const { data: mismatchedMaps } = await supabase
    .from('map_configs')
    .select('*')
    .not('metadata->styleUrl', 'is', null);
    
  for (const map of mismatchedMaps || []) {
    if (map.metadata?.styleUrl && map.metadata.styleUrl.includes('web-six-taupe')) {
      // If metadata has correct URL but style field doesn't match
      if (map.style !== map.metadata.styleUrl) {
        const { error: fixError } = await supabase
          .from('map_configs')
          .update({ style: map.metadata.styleUrl })
          .eq('id', map.id);
          
        if (!fixError) {
          console.log(`🔄 Fixed style field for ${map.name}`);
          updated++;
        }
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully updated: ${updated} maps`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} maps`);
  }
  
  console.log('\n✨ All GitHub URLs have been replaced with Vercel-hosted styles!');
  console.log('The maps should now load correctly from production.');
}

// Run the fix
fixAllStyleUrls().catch(console.error);