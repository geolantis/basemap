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

async function checkBasemap3() {
  // Fetch the problematic map - force fresh data
  const { data: map, error } = await supabase
    .from('map_configs')
    .select('*')
    .ilike('name', '%basemap%3%')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Map Name:', map.name);
  console.log('Type:', map.type);
  console.log('Style:', map.style);
  console.log('Metadata:', JSON.stringify(map.metadata, null, 2));
  
  // Test if the style URL is accessible
  if (map.style) {
    console.log('\nTesting style URL...');
    try {
      const response = await fetch(map.style);
      const contentType = response.headers.get('content-type');
      console.log('Response status:', response.status);
      console.log('Content-Type:', contentType);
      
      if (contentType && contentType.includes('json')) {
        const json = await response.json();
        console.log('Style version:', json.version);
        console.log('Sources:', Object.keys(json.sources || {}));
        console.log('Layers count:', json.layers?.length || 0);
      } else {
        const text = await response.text();
        console.log('Response (first 200 chars):', text.substring(0, 200));
      }
    } catch (e) {
      console.error('Failed to fetch style:', e.message);
    }
  }
}

checkBasemap3().catch(console.error);