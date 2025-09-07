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

async function fixUrlSpaces() {
  console.log('Checking database for URLs with spaces...\n');

  // Fetch ALL configurations to check their URLs
  const { data: configs, error } = await supabase
    .from('map_configs')
    .select('id, name, style')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching configs:', error);
    return;
  }

  const updates = [];
  
  configs.forEach(config => {
    if (config.style && config.style.includes(' ')) {
      // URL-encode spaces
      const fixedUrl = config.style.replace(/ /g, '%20');
      
      updates.push({
        id: config.id,
        name: config.name,
        originalUrl: config.style,
        fixedUrl: fixedUrl
      });
    }
  });

  if (updates.length > 0) {
    console.log(`Found ${updates.length} URLs with spaces that need fixing:\n`);
    
    updates.forEach(u => {
      console.log(`${u.name}:`);
      console.log(`  Before: ${u.originalUrl}`);
      console.log(`  After:  ${u.fixedUrl}\n`);
    });
    
    console.log('Updating database...\n');
    
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('map_configs')
        .update({ 
          style: update.fixedUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id);

      if (updateError) {
        console.error(`❌ Error updating ${update.name}:`, updateError);
      } else {
        console.log(`✅ Fixed ${update.name}`);
      }
    }
    
    console.log(`\n✅ Successfully fixed ${updates.length} URLs in the database!`);
    console.log('The API should now return properly encoded URLs.');
  } else {
    console.log('✅ No URLs with spaces found - database is clean!');
  }
}

fixUrlSpaces().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});