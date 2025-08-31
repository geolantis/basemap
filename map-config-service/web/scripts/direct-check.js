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

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache'
    }
  }
});

async function directCheck() {
  // Force a fresh query
  const { data: maps, error } = await supabase
    .from('map_configs')
    .select('id, name, style, metadata, updated_at')
    .ilike('name', '%basemapcustom3%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Found maps:', maps.length);
  
  for (const map of maps) {
    console.log('\n-------------------');
    console.log('ID:', map.id);
    console.log('Name:', map.name);
    console.log('Style:', map.style);
    console.log('Metadata.styleUrl:', map.metadata?.styleUrl);
    console.log('Updated at:', map.updated_at);
    
    // Test the actual URL
    if (map.style) {
      try {
        console.log('\nTesting URL:', map.style);
        const response = await fetch(map.style);
        const contentType = response.headers.get('content-type');
        console.log('Response Content-Type:', contentType);
        
        if (contentType?.includes('json')) {
          const json = await response.json();
          console.log('✅ Valid JSON style, version:', json.version);
        } else {
          console.log('❌ Not JSON, got:', contentType);
        }
      } catch (e) {
        console.log('❌ Failed to fetch:', e.message);
      }
    }
  }
}

directCheck().catch(console.error);