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

// IMPORTANT: Update this to your Vercel app URL
const PRODUCTION_URL = process.env.VERCEL_URL || 'https://your-app.vercel.app';
const USE_API = true; // Set to false to use static files from /styles/

async function updateToProduction() {
  console.log('🚀 Updating map_configs for production deployment...\n');
  console.log(`📍 Production URL: ${PRODUCTION_URL}\n`);
  
  // Maps that should use production URLs
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
      // Construct the production style URL
      const styleUrl = USE_API 
        ? `${PRODUCTION_URL}/api/styles/${map.styleName}`
        : `${PRODUCTION_URL}/styles/${map.styleName}.json`;
      
      // Get current metadata
      const { data: currentMap } = await supabase
        .from('map_configs')
        .select('metadata')
        .eq('name', map.name)
        .single();
      
      // Update the map configuration
      const updateData = {
        metadata: {
          ...(currentMap?.metadata || {}),
          styleUrl: styleUrl,
          useProduction: true,
          styleName: map.styleName,
          isOverlay: map.isOverlay || false,
          sourceType: USE_API ? 'vercel-api' : 'vercel-static',
          lastUpdated: new Date().toISOString()
        }
      };
      
      const { data, error } = await supabase
        .from('map_configs')
        .update(updateData)
        .eq('name', map.name);
      
      if (error) {
        console.log(`❌ Failed to update ${map.name}: ${error.message}`);
        failed++;
      } else {
        console.log(`✅ Updated ${map.name} → ${styleUrl}`);
        updated++;
      }
      
    } catch (err) {
      console.log(`❌ Error updating ${map.name}: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Update Summary`);
  console.log(`✅ Successfully updated: ${updated} maps`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} maps`);
  }
  
  console.log('\n🎯 Production Setup Complete!');
  console.log('\n📝 Deployment Checklist:');
  console.log('1. ✅ Style files copied to public/styles/');
  console.log('2. ✅ Vercel.json configured with proxy rewrites');
  console.log('3. ✅ API endpoint created at /api/styles/[styleName].js');
  console.log('4. ✅ Database updated with production URLs');
  console.log('\n🚀 Ready to deploy:');
  console.log('   git add .');
  console.log('   git commit -m "Add production style serving"');
  console.log('   git push');
  console.log('   vercel --prod');
  console.log('\n💡 The Vercel deployment will:');
  console.log('   - Serve styles from /api/styles/ or /styles/');
  console.log('   - Proxy tile requests to avoid CORS');
  console.log('   - Automatically resolve style references');
  console.log('   - Cache styles for better performance');
}

// Check if we're updating to production or localhost
const args = process.argv.slice(2);
if (args.includes('--prod') || args.includes('--production')) {
  updateToProduction().catch(console.error);
} else {
  console.log('⚠️  This script updates to PRODUCTION URLs.');
  console.log('\nUsage:');
  console.log('  node scripts/update-to-production.js --prod');
  console.log('\nOr set VERCEL_URL environment variable:');
  console.log('  VERCEL_URL=https://your-app.vercel.app node scripts/update-to-production.js --prod');
  console.log('\nFor local development, use:');
  console.log('  node scripts/update-to-style-server.js');
}