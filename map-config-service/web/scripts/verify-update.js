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

// Create a fresh client with no caching
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function verifyUpdate() {
  console.log('Fetching basemapcustom3 with fresh query...\n');
  
  // Use RPC or direct query to bypass any caching
  const { data: result, error } = await supabase
    .rpc('get_map_by_name', { map_name: 'basemapcustom3' });

  if (error) {
    // Try direct query if RPC doesn't exist
    const { data: map, error: queryError } = await supabase
      .from('map_configs')
      .select('*')
      .eq('name', 'basemapcustom3')
      .single();
    
    if (queryError) {
      console.error('Error:', queryError);
      return;
    }
    
    console.log('Map found via direct query:');
    console.log('Name:', map.name);
    console.log('Style:', map.style);
    console.log('Updated at:', map.updated_at);
    
    // Test the URL
    if (map.style) {
      console.log('\nTesting URL:', map.style);
      const response = await fetch(map.style);
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('json')) {
        const json = await response.json();
        console.log('✅ Valid JSON! Version:', json.version);
        console.log('Sources:', Object.keys(json.sources || {}));
      } else {
        console.log('❌ Not JSON. Content-Type:', contentType);
        const text = await response.text();
        console.log('First 100 chars:', text.substring(0, 100));
      }
    }
  } else {
    console.log('RPC result:', result);
  }
}

verifyUpdate().catch(console.error);