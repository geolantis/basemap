import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials (need SERVICE KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAllMapsWithServiceKey() {
  console.log('Fixing ALL maps with Vercel URLs using service key...\n');

  // Fetch ALL maps
  const { data: maps, error: fetchError } = await supabase
    .from('map_configs')
    .select('*')
    .order('name');

  if (fetchError) {
    console.error('Error fetching maps:', fetchError);
    return;
  }

  console.log(`Checking ${maps.length} maps...\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  const updatedMaps = [];

  for (const map of maps) {
    let needsUpdate = false;
    let newStyle = map.style;
    let newMetadata = { ...map.metadata };

    // Check and fix style field
    if (map.style && map.style.includes('vercel.app')) {
      const oldUrl = map.style;
      newStyle = map.style.replace(/https?:\/\/[^\/]*\.vercel\.app\/styles\//g, 'https://mapconfig.geolantis.com/styles/');
      
      if (newStyle !== oldUrl) {
        needsUpdate = true;
      }
    }

    // Check and fix metadata.styleUrl field
    if (map.metadata?.styleUrl && map.metadata.styleUrl.includes('vercel.app')) {
      const oldUrl = map.metadata.styleUrl;
      newMetadata.styleUrl = map.metadata.styleUrl.replace(/https?:\/\/[^\/]*\.vercel\.app\/styles\//g, 'https://mapconfig.geolantis.com/styles/');
      
      if (newMetadata.styleUrl !== oldUrl) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      console.log(`Updating ${map.name}...`);
      console.log(`  Old style: ${map.style}`);
      console.log(`  New style: ${newStyle}`);

      const { data: updateData, error: updateError } = await supabase
        .from('map_configs')
        .update({ 
          style: newStyle,
          metadata: newMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', map.id)
        .select()
        .single();

      if (updateError) {
        console.error(`  ❌ Error: ${updateError.message}`);
      } else if (!updateData) {
        console.error(`  ❌ No data returned (possible RLS issue)`);
      } else {
        console.log(`  ✅ Updated successfully`);
        updatedCount++;
        updatedMaps.push(map.name);
      }
    } else {
      skippedCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`✅ Successfully updated: ${updatedCount} maps`);
  console.log(`⏭️  Skipped (already correct): ${skippedCount} maps`);
  
  if (updatedMaps.length > 0) {
    console.log('\nUpdated maps:');
    updatedMaps.forEach(name => console.log(`  - ${name}`));
  }

  // Verify all maps now have correct URLs
  console.log('\n=== Final Verification ===');
  const { data: verifyMaps, error: verifyError } = await supabase
    .from('map_configs')
    .select('name, style')
    .like('style', '%vercel.app%');

  if (!verifyError && verifyMaps && verifyMaps.length > 0) {
    console.log(`⚠️  Still found ${verifyMaps.length} maps with Vercel URLs:`);
    verifyMaps.forEach(m => console.log(`  - ${m.name}: ${m.style}`));
  } else {
    console.log('✅ All maps now have correct production URLs!');
    
    // Test a few URLs to make sure they work
    console.log('\n=== Testing Sample URLs ===');
    const testMaps = ['Basemap Grau', 'basemapcustom3', 'Kataster BEV'];
    
    for (const testName of testMaps) {
      const { data: testMap } = await supabase
        .from('map_configs')
        .select('name, style')
        .eq('name', testName)
        .single();
        
      if (testMap?.style) {
        try {
          const response = await fetch(testMap.style);
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('json')) {
            console.log(`✅ ${testName}: Valid JSON at ${testMap.style}`);
          } else {
            console.log(`❌ ${testName}: Not JSON (${contentType})`);
          }
        } catch (e) {
          console.log(`❌ ${testName}: Failed to fetch`);
        }
      }
    }
  }
}

fixAllMapsWithServiceKey().catch(console.error);