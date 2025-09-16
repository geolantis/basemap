import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMapConfigs() {
  console.log('Testing map_configs table...\n');

  try {
    // Get all data from map_configs
    const { data, error } = await supabase
      .from('map_configs')
      .select('*')
      .limit(10);

    if (error) {
      console.error('Error fetching map_configs:', error);
      return;
    }

    console.log(`Found ${data?.length || 0} map configs\n`);

    if (data && data.length > 0) {
      // Show first record structure
      console.log('Sample record structure:');
      console.log('Fields:', Object.keys(data[0]));
      console.log('\nFirst record:');
      console.log(JSON.stringify(data[0], null, 2));

      // Check map_category values
      console.log('\n\nMap categories breakdown:');
      const categories = {};
      data.forEach(item => {
        const cat = item.map_category || 'null/undefined';
        categories[cat] = (categories[cat] || 0) + 1;
      });
      console.log(categories);

      // Show basemaps (background or null category)
      console.log('\n\nBasemaps (background or null category):');
      const basemaps = data.filter(m => !m.map_category || m.map_category === 'background' || m.map_category === null);
      basemaps.forEach(m => {
        console.log(`- ${m.name} (category: ${m.map_category || 'null'}, type: ${m.type})`);
      });

      // Show overlays
      console.log('\n\nOverlays (overlay category):');
      const overlays = data.filter(m => m.map_category === 'overlay');
      overlays.forEach(m => {
        console.log(`- ${m.name} (type: ${m.type})`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

testMapConfigs();