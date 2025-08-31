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

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllBasemaps() {
  // Get all maps with "basemap" in the name and vercel URLs
  const { data: maps, error } = await supabase
    .from('map_configs')
    .select('id, name, style, metadata')
    .like('style', '%vercel.app%')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${maps.length} maps with Vercel URLs:\n`);
  
  for (const map of maps) {
    console.log(`Name: ${map.name}`);
    console.log(`ID: ${map.id}`);
    console.log(`Style: ${map.style}`);
    if (map.metadata?.styleUrl) {
      console.log(`Metadata.styleUrl: ${map.metadata.styleUrl}`);
    }
    console.log('---');
  }

  // Now update ALL of them
  console.log('\n\nUpdating all maps with correct URLs...\n');
  
  let updateCount = 0;
  for (const map of maps) {
    const newStyleUrl = map.style.replace(/https?:\/\/[^\/]*\.vercel\.app\/styles\//g, 'https://mapconfig.geolantis.com/styles/');
    const newMetadata = { ...map.metadata };
    
    if (newMetadata.styleUrl) {
      newMetadata.styleUrl = newMetadata.styleUrl.replace(/https?:\/\/[^\/]*\.vercel\.app\/styles\//g, 'https://mapconfig.geolantis.com/styles/');
    }
    
    console.log(`Updating ${map.name} (${map.id})...`);
    
    const { error: updateError } = await supabase
      .from('map_configs')
      .update({
        style: newStyleUrl,
        metadata: newMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', map.id);

    if (updateError) {
      console.error(`  ❌ Failed: ${updateError.message}`);
    } else {
      console.log(`  ✅ Updated to: ${newStyleUrl}`);
      updateCount++;
    }
  }
  
  console.log(`\n✅ Successfully updated ${updateCount} maps`);
}

listAllBasemaps().catch(console.error);