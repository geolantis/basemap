import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBasemapcustomUrls() {
  console.log('Fixing basemapcustom style URLs in database...\n');

  // Define the correct mappings
  const updates = [
    { name: 'basemapcustom2', style: '/styles/basemap2.json', label: 'Basemap 1' },
    { name: 'basemapcustom3', style: '/styles/basemap3.json', label: 'Basemap 2' },
    { name: 'basemapcustom4', style: '/styles/basemap7.json', label: 'Basemap 3' }
  ];

  for (const update of updates) {
    console.log(`Updating ${update.name} (${update.label})...`);
    
    const { data, error } = await supabase
      .from('map_configs')
      .update({ 
        style: update.style,
        updated_at: new Date().toISOString()
      })
      .eq('name', update.name);

    if (error) {
      console.error(`❌ Error updating ${update.name}:`, error);
    } else {
      console.log(`✅ Updated ${update.name} -> ${update.style}`);
    }
  }

  // Verify the updates
  console.log('\nVerifying updates...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('map_configs')
    .select('name, label, style')
    .in('name', ['basemapcustom2', 'basemapcustom3', 'basemapcustom4']);

  if (verifyData) {
    console.log('\nCurrent database values:');
    verifyData.forEach(item => {
      console.log(`${item.name} (${item.label}): ${item.style}`);
    });
  }

  console.log('\n✅ Database update complete!');
  console.log('The API should now return the correct URLs.');
  process.exit(0);
}

fixBasemapcustomUrls().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});