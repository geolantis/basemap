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

async function updateToProductionUrls() {
  console.log('Updating all style URLs to production domain...\n');

  // Fetch all maps with style URLs
  const { data: maps, error: fetchError } = await supabase
    .from('map_configs')
    .select('*')
    .or('style.like.%localhost%,style.like.%127.0.0.1%,style.like.%vercel.app%')
    .order('name');

  if (fetchError) {
    console.error('Error fetching maps:', fetchError);
    return;
  }

  console.log(`Found ${maps.length} maps with non-production URLs to update\n`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const map of maps) {
    const oldUrl = map.style;
    let newUrl = oldUrl;

    // Replace various non-production domains with production domain
    newUrl = newUrl.replace(/http:\/\/localhost:\d+\/api\/styles\//g, 'https://mapconfig.geolantis.com/styles/');
    newUrl = newUrl.replace(/http:\/\/127\.0\.0\.1:\d+\/api\/styles\//g, 'https://mapconfig.geolantis.com/styles/');
    newUrl = newUrl.replace(/https?:\/\/[^\/]*vercel\.app\/styles\//g, 'https://mapconfig.geolantis.com/styles/');

    if (newUrl !== oldUrl) {
      console.log(`Updating ${map.name}:`);
      console.log(`  Old: ${oldUrl}`);
      console.log(`  New: ${newUrl}`);

      const { error: updateError } = await supabase
        .from('map_configs')
        .update({ 
          style: newUrl,
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

  // Also update metadata.styleUrl if present
  const { data: metadataMaps, error: metadataFetchError } = await supabase
    .from('map_configs')
    .select('*')
    .or('metadata->styleUrl.like.%localhost%,metadata->styleUrl.like.%127.0.0.1%,metadata->styleUrl.like.%vercel.app%')
    .order('name');

  if (!metadataFetchError && metadataMaps && metadataMaps.length > 0) {
    console.log(`\nFound ${metadataMaps.length} maps with metadata.styleUrl to update\n`);

    for (const map of metadataMaps) {
      if (map.metadata?.styleUrl) {
        const oldUrl = map.metadata.styleUrl;
        let newUrl = oldUrl;

        // Replace various non-production domains with production domain
        newUrl = newUrl.replace(/http:\/\/localhost:\d+\/api\/styles\//g, 'https://mapconfig.geolantis.com/styles/');
        newUrl = newUrl.replace(/http:\/\/127\.0\.0\.1:\d+\/api\/styles\//g, 'https://mapconfig.geolantis.com/styles/');
        newUrl = newUrl.replace(/https?:\/\/[^\/]*vercel\.app\/styles\//g, 'https://mapconfig.geolantis.com/styles/');

        if (newUrl !== oldUrl) {
          console.log(`Updating metadata for ${map.name}:`);
          console.log(`  Old: ${oldUrl}`);
          console.log(`  New: ${newUrl}`);

          const updatedMetadata = {
            ...map.metadata,
            styleUrl: newUrl
          };

          const { error: updateError } = await supabase
            .from('map_configs')
            .update({ 
              metadata: updatedMetadata,
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
    }
  }

  console.log('\n=== Summary ===');
  console.log(`✅ Successfully updated: ${updatedCount} maps`);
  if (errorCount > 0) {
    console.log(`❌ Failed to update: ${errorCount} maps`);
  }
}

updateToProductionUrls().catch(console.error);