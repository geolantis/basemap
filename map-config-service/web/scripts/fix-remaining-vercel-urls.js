import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRemainingVercelUrls() {
  console.log('Fixing remaining Vercel URLs...\n');

  // Fetch ALL maps to check for any Vercel URLs
  const { data: maps, error: fetchError } = await supabase
    .from('map_configs')
    .select('*')
    .order('name');

  if (fetchError) {
    console.error('Error fetching maps:', fetchError);
    return;
  }

  console.log(`Checking ${maps.length} maps for Vercel URLs...\n`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const map of maps) {
    let needsUpdate = false;
    let newStyle = map.style;
    let newMetadata = { ...map.metadata };

    // Check and fix style field
    if (map.style && map.style.includes('vercel.app')) {
      const oldUrl = map.style;
      // Replace ANY vercel.app URL with production domain
      newStyle = map.style.replace(/https?:\/\/[^\/]*\.vercel\.app\/styles\//g, 'https://mapconfig.geolantis.com/styles/');
      
      if (newStyle !== oldUrl) {
        needsUpdate = true;
        console.log(`Updating style for ${map.name}:`);
        console.log(`  Old: ${oldUrl}`);
        console.log(`  New: ${newStyle}`);
      }
    }

    // Check and fix metadata.styleUrl field
    if (map.metadata?.styleUrl && map.metadata.styleUrl.includes('vercel.app')) {
      const oldUrl = map.metadata.styleUrl;
      // Replace ANY vercel.app URL with production domain
      newMetadata.styleUrl = map.metadata.styleUrl.replace(/https?:\/\/[^\/]*\.vercel\.app\/styles\//g, 'https://mapconfig.geolantis.com/styles/');
      
      if (newMetadata.styleUrl !== oldUrl) {
        needsUpdate = true;
        console.log(`Updating metadata.styleUrl for ${map.name}:`);
        console.log(`  Old: ${oldUrl}`);
        console.log(`  New: ${newMetadata.styleUrl}`);
      }
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('map_configs')
        .update({ 
          style: newStyle,
          metadata: newMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', map.id);

      if (updateError) {
        console.error(`  ❌ Error updating: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ Updated successfully`);
        updatedCount++;
      }
      console.log();
    }
  }

  if (updatedCount === 0) {
    console.log('No maps needed updating - all URLs are already correct!');
  }

  console.log('\n=== Summary ===');
  console.log(`✅ Successfully updated: ${updatedCount} maps`);
  if (errorCount > 0) {
    console.log(`❌ Failed to update: ${errorCount} maps`);
  }

  // Verify all maps now have correct URLs
  console.log('\n=== Verification ===');
  const { data: verifyMaps, error: verifyError } = await supabase
    .from('map_configs')
    .select('name, style, metadata')
    .or('style.like.%vercel.app%,metadata->styleUrl.like.%vercel.app%');

  if (!verifyError && verifyMaps && verifyMaps.length > 0) {
    console.log(`⚠️  Still found ${verifyMaps.length} maps with Vercel URLs:`);
    verifyMaps.forEach(m => console.log(`  - ${m.name}`));
  } else {
    console.log('✅ All maps now have correct production URLs!');
  }
}

fixRemainingVercelUrls().catch(console.error);