/**
 * Run database migration to add map_category column
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wphrytrrikfkwehwahqc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHJ5dHJyaWtma3dlaHdhaHFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTQxOTIzMCwiZXhwIjoyMDUwOTk1MjMwfQ.0qjOZP6sLGMmjsOOdxvmVzQzLvmCbOEB4eJ61jHCE3c';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Running migration to add map_category column...');

    // Add the column if it doesn't exist
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='maps' AND column_name='map_category'
          ) THEN
            ALTER TABLE maps 
            ADD COLUMN map_category TEXT DEFAULT 'background' 
            CHECK (map_category IN ('background', 'overlay'));
          END IF;
        END $$;
      `
    });

    if (alterError) {
      console.log('⚠️ Could not add column via RPC, it may already exist or RPC may not be available');
    } else {
      console.log('✅ Column added successfully');
    }

    // Try to update existing maps based on known patterns
    console.log('🔄 Updating map categories...');
    
    // Get all maps
    const { data: maps, error: fetchError } = await supabase
      .from('maps')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching maps:', fetchError);
      return;
    }

    // Update each map based on its name/properties
    for (const map of maps) {
      let category = 'background';
      
      // Determine if it's an overlay
      if (map.name?.includes('Kataster') || 
          map.name?.includes('Overlay') ||
          map.name?.includes('Spain BTN') ||
          map.layers?.length > 0 ||
          map.metadata?.selectLayer) {
        category = 'overlay';
      }

      // Update the map
      const { error: updateError } = await supabase
        .from('maps')
        .update({ map_category: category })
        .eq('id', map.id);

      if (updateError) {
        console.error(`❌ Error updating ${map.name}:`, updateError);
      } else {
        console.log(`${category === 'overlay' ? '🎨' : '🗺️'} ${map.name} → ${category}`);
      }
    }

    console.log('✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();