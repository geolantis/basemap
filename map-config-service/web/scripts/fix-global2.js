import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixGlobal2() {
  console.log('Fixing Global 2 map...\n');
  
  // Read the downloaded style
  const stylePath = path.join(__dirname, '..', 'public', 'styles', 'global2.json');
  const styleContent = await fs.readFile(stylePath, 'utf8');
  const style = JSON.parse(styleContent);
  
  console.log('Original sprite URL:', style.sprite);
  
  // Option 1: Remove the sprite (simplest fix)
  // delete style.sprite;
  
  // Option 2: Use a working sprite from another style
  // We can use the basemap sprite which we know works
  style.sprite = "https://mapsneu.wien.gv.at/basemapv/bmapv/3857/resources/sprites/sprite";
  
  console.log('New sprite URL:', style.sprite);
  
  // Save the fixed style
  await fs.writeFile(stylePath, JSON.stringify(style, null, 2));
  console.log('✅ Saved fixed style to public/styles/global2.json');
  
  // Copy to dist if it exists
  try {
    const distPath = path.join(__dirname, '..', 'dist', 'styles', 'global2.json');
    await fs.writeFile(distPath, JSON.stringify(style, null, 2));
    console.log('✅ Copied to dist/styles/global2.json');
  } catch (e) {
    console.log('Note: dist not found (will be created on build)');
  }
  
  // Update database to use local style
  console.log('\nUpdating database...');
  
  const { data, error } = await supabase
    .from('map_configs')
    .update({
      style: 'https://mapconfig.geolantis.com/styles/global2.json',
      metadata: {
        styleUrl: 'https://mapconfig.geolantis.com/styles/global2.json',
        styleName: 'global2',
        originalApi: 'https://maps.clockworkmicro.com/streets/v1/style',
        description: 'Global map style from Clockwork Micro',
        note: 'Using local copy with fixed sprite URL'
      },
      updated_at: new Date().toISOString()
    })
    .eq('name', 'Global2')
    .select()
    .single();
    
  if (error) {
    console.error('❌ Failed to update database:', error.message);
  } else if (!data) {
    console.log('⚠️  No data returned (might be RLS issue)');
  } else {
    console.log('✅ Updated database successfully');
    console.log('New style URL:', data.style);
  }
  
  console.log('\n=== Next Steps ===');
  console.log('1. Deploy to production: npm run build:prod && npx vercel --prod');
  console.log('2. Test the map at: https://mapconfig.geolantis.com/map/0ea03034-041c-4419-b51c-27338df730fc');
}

fixGlobal2().catch(console.error);