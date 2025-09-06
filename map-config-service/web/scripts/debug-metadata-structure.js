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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugMetadataStructure() {
  console.log('🔬 Debugging metadata structure differences...\n');

  try {
    // Get a few different types of overlays to compare
    const { data: configs, error } = await supabase
      .from('map_configs')
      .select('name, label, metadata')
      .in('name', [
        'bev_kataster_amtlich',  // Rich metadata
        'Kataster BEV',          // Simple overlay
        'flawi',                 // Another overlay
        'dkm_bev_symbole',       // BEV overlay
        'NSW BaseMap Overlay'    // Simple category overlay
      ]);

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log('📊 Metadata Structure Comparison:');
    
    configs.forEach(config => {
      console.log(`\n🗺️  ${config.name}`);
      console.log(`   Label: ${config.label}`);
      
      // Check metadata structure
      if (config.metadata) {
        console.log(`   Metadata Type: ${typeof config.metadata}`);
        console.log(`   Metadata Keys: [${Object.keys(config.metadata).join(', ')}]`);
        console.log(`   metadata.isOverlay: ${config.metadata.isOverlay} (${typeof config.metadata.isOverlay})`);
        console.log(`   metadata.category: ${config.metadata.category || 'UNDEFINED'}`);
        console.log(`   Full Metadata:`, JSON.stringify(config.metadata, null, 4));
      } else {
        console.log(`   Metadata: NULL/UNDEFINED`);
      }

      // Test overlay detection conditions (without map_category since it doesn't exist)
      console.log('\n   🧪 Testing Detection Conditions:');
      
      const condition1 = config.metadata?.isOverlay === true;
      const condition2 = config.metadata?.category === 'overlay';
      
      console.log(`   metadata?.isOverlay === true: ${condition1}`);
      console.log(`   metadata?.category === 'overlay': ${condition2}`);
      
      const shouldBeOverlay = condition1 || condition2;
      console.log(`   🎯 SHOULD BE OVERLAY: ${shouldBeOverlay ? '✅ YES' : '❌ NO'}`);
      
      console.log('   ' + '─'.repeat(50));
    });

    // Check a few known overlays to understand the pattern
    console.log('\n🔍 Checking known overlays for pattern:');
    
    const { data: knownOverlays, error: knownError } = await supabase
      .from('map_configs')
      .select('name, metadata')
      .in('name', ['Kataster BEV', 'flawi', 'gefahr', 'dkm_bev_symbole']);

    if (knownError) {
      console.error('❌ Known overlays query error:', knownError);
    } else {
      knownOverlays.forEach(config => {
        console.log(`   ${config.name}:`);
        console.log(`      metadata.isOverlay: ${config.metadata?.isOverlay}`);
        console.log(`      metadata.category: ${config.metadata?.category}`);
        console.log(`      Has overlayType: ${!!config.metadata?.overlayType}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
debugMetadataStructure();