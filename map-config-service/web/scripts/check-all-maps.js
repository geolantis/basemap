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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllMaps() {
  console.log('Checking all map_configs...\n');

  try {
    // Get ALL data from map_configs
    const { data, error } = await supabase
      .from('map_configs')
      .select('id, name, label, type, map_category, metadata')
      .order('name');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`Total maps: ${data?.length || 0}\n`);

    // Categorize maps
    const byCategory = {};
    const shouldBeOverlay = [];
    const shouldBeBackground = [];

    data?.forEach(map => {
      const cat = map.map_category || 'null';
      byCategory[cat] = (byCategory[cat] || 0) + 1;

      // Check metadata for intended category
      if (map.metadata?.map_category) {
        if (map.metadata.map_category !== map.map_category) {
          console.log(`MISMATCH: ${map.name}`);
          console.log(`  DB category: ${map.map_category}`);
          console.log(`  Metadata category: ${map.metadata.map_category}\n`);
        }
      }

      // Heuristic: Names containing certain keywords
      const name = map.name.toLowerCase();
      const label = (map.label || '').toLowerCase();

      if (name.includes('kataster') || name.includes('cadastr') ||
          name.includes('overlay') || name.includes('parcels') ||
          label.includes('kataster') || label.includes('cadastr')) {
        shouldBeOverlay.push(map);
      } else if (name.includes('basemap') || name.includes('base') ||
                 name.includes('topo') || name.includes('ortho') ||
                 name.includes('satellite') || name.includes('street')) {
        shouldBeBackground.push(map);
      }
    });

    console.log('Categories count:', byCategory);

    console.log('\n\nMaps that might be OVERLAYS (based on name):');
    shouldBeOverlay.forEach(m => {
      console.log(`- ${m.name} (current: ${m.map_category}, metadata: ${m.metadata?.map_category})`);
    });

    console.log('\n\nMaps that are likely BASEMAPS:');
    shouldBeBackground.forEach(m => {
      console.log(`- ${m.name} (current: ${m.map_category})`);
    });

    // Show all maps grouped
    console.log('\n\n=== ALL MAPS BY CATEGORY ===\n');

    const backgrounds = data?.filter(m => m.map_category === 'background') || [];
    const overlays = data?.filter(m => m.map_category === 'overlay') || [];
    const nullCat = data?.filter(m => !m.map_category) || [];

    console.log(`BACKGROUNDS (${backgrounds.length}):`);
    backgrounds.forEach(m => console.log(`  - ${m.name}`));

    console.log(`\nOVERLAYS (${overlays.length}):`);
    overlays.forEach(m => console.log(`  - ${m.name}`));

    console.log(`\nNO CATEGORY (${nullCat.length}):`);
    nullCat.forEach(m => console.log(`  - ${m.name}`));

  } catch (err) {
    console.error('Error:', err);
  }
}

checkAllMaps();