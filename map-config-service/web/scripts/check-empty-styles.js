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

async function checkEmptyStyles() {
  console.log('Checking for configs with empty style URLs...\n');

  // Fetch configurations with NULL or empty style
  const { data: configs, error } = await supabase
    .from('map_configs')
    .select('id, name, style')
    .eq('is_active', true)
    .or('style.is.null,style.eq.')
    .order('name');

  if (error) {
    console.error('Error fetching configs:', error);
    return;
  }

  if (configs && configs.length > 0) {
    console.log(`Found ${configs.length} configurations with empty style URLs:\n`);
    
    const namesToFix = [];
    configs.forEach(config => {
      console.log(`${config.name}:`);
      console.log(`  style: ${config.style || 'NULL'}`);
      
      // The API would generate: /api/styles/{name}.json
      const generatedUrl = `/api/styles/${config.name}.json`;
      console.log(`  API would generate: ${generatedUrl}`);
      
      if (config.name.includes(' ')) {
        console.log(`  ⚠️  Name has spaces - will cause issues!`);
        namesToFix.push(config);
      }
      console.log('');
    });
    
    if (namesToFix.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('FIXING CONFIGS WITH EMPTY STYLES AND SPACES IN NAMES');
      console.log('='.repeat(60) + '\n');
      
      for (const config of namesToFix) {
        // Generate proper URL with encoded spaces
        const properUrl = `/api/styles/${encodeURIComponent(config.name)}.json`;
        
        console.log(`Updating ${config.name}...`);
        console.log(`  Setting style to: ${properUrl}`);
        
        const { error: updateError } = await supabase
          .from('map_configs')
          .update({ 
            style: properUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', config.id);

        if (updateError) {
          console.error(`  ❌ Error:`, updateError);
        } else {
          console.log(`  ✅ Fixed!`);
        }
      }
    }
  } else {
    console.log('All configurations have style URLs set.');
  }
  
  // Now check for names with spaces regardless of style being set
  console.log('\n' + '='.repeat(60));
  console.log('CHECKING ALL CONFIGS FOR NAMES WITH SPACES');
  console.log('='.repeat(60) + '\n');
  
  const { data: allConfigs, error: allError } = await supabase
    .from('map_configs')
    .select('id, name, style')
    .eq('is_active', true)
    .like('name', '% %')
    .order('name');
    
  if (allConfigs && allConfigs.length > 0) {
    console.log(`Found ${allConfigs.length} configurations with spaces in names:\n`);
    
    for (const config of allConfigs.slice(0, 10)) {
      console.log(`${config.name}:`);
      console.log(`  Current style: ${config.style}`);
      
      // Check if the style needs fixing
      if (!config.style || config.style === '') {
        const properUrl = `/api/styles/${encodeURIComponent(config.name)}.json`;
        console.log(`  ⚠️  Empty style - setting to: ${properUrl}`);
        
        const { error: updateError } = await supabase
          .from('map_configs')
          .update({ 
            style: properUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', config.id);

        if (updateError) {
          console.error(`  ❌ Error:`, updateError);
        } else {
          console.log(`  ✅ Fixed!`);
        }
      }
    }
    
    if (allConfigs.length > 10) {
      console.log(`\n... and ${allConfigs.length - 10} more configs with spaces in names`);
    }
  }
}

checkEmptyStyles().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});