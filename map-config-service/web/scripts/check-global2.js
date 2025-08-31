import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGlobal2() {
  console.log('Checking Global 2 map configuration...\n');
  
  // Fetch Global 2 map
  const { data: maps, error } = await supabase
    .from('map_configs')
    .select('*')
    .ilike('name', '%Global%2%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!maps || maps.length === 0) {
    console.log('No Global 2 map found');
    return;
  }

  for (const map of maps) {
    console.log('Map Name:', map.name);
    console.log('ID:', map.id);
    console.log('Type:', map.type);
    console.log('Style:', map.style);
    console.log('Original Style:', map.original_style);
    console.log('Metadata:', JSON.stringify(map.metadata, null, 2));
    
    // Check if there's a local style file
    if (map.style && map.style.includes('mapconfig.geolantis.com')) {
      console.log('\nChecking style file...');
      try {
        const response = await fetch(map.style);
        if (response.ok) {
          const styleJson = await response.json();
          console.log('✅ Style file exists');
          
          // Check for problematic sources
          if (styleJson.sources) {
            for (const [name, source] of Object.entries(styleJson.sources)) {
              if (source.url) {
                console.log(`  Source "${name}" URL: ${source.url}`);
                
                // Test if the URL is accessible
                try {
                  const testResponse = await fetch(source.url);
                  if (testResponse.ok) {
                    console.log(`    ✅ Accessible`);
                  } else {
                    console.log(`    ❌ Returns ${testResponse.status}`);
                  }
                } catch (e) {
                  console.log(`    ❌ Failed to fetch: ${e.message}`);
                }
              }
            }
          }
        } else {
          console.log('❌ Style file not found (404)');
        }
      } catch (e) {
        console.error('Failed to check style:', e.message);
      }
    }
    
    console.log('\n-------------------\n');
  }
}

checkGlobal2().catch(console.error);