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

async function forceUpdateBasemap3() {
  const mapId = 'bfc82248-56d0-48ea-8a46-1b3599dab745';
  const newStyleUrl = 'https://mapconfig.geolantis.com/styles/basemap3.json';
  
  console.log('Force updating basemapcustom3...');
  console.log('Map ID:', mapId);
  console.log('New style URL:', newStyleUrl);
  
  // Update the map
  const { data, error } = await supabase
    .from('map_configs')
    .update({
      style: newStyleUrl,
      metadata: {
        styleUrl: newStyleUrl,
        styleName: 'basemap3',
        sourceType: 'vercel-production',
        description: 'Basemap Austria Custom 3 - Mixed raster/vector style',
        useStyleServer: false
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', mapId)
    .select()
    .single();

  if (error) {
    console.error('❌ Update failed:', error);
    return;
  }

  console.log('✅ Updated successfully!');
  console.log('New style:', data.style);
  console.log('New metadata:', data.metadata);
  
  // Verify the new URL works
  console.log('\nVerifying new URL...');
  try {
    const response = await fetch(newStyleUrl);
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType?.includes('json')) {
      const json = await response.json();
      console.log('✅ Valid JSON style!');
      console.log('Version:', json.version);
      console.log('Sources:', Object.keys(json.sources || {}));
    } else {
      console.log('❌ Not JSON:', contentType);
    }
  } catch (e) {
    console.error('❌ Failed to fetch:', e.message);
  }
}

forceUpdateBasemap3().catch(console.error);