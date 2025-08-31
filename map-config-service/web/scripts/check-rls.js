import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
console.log('Key type:', process.env.SUPABASE_SERVICE_KEY ? 'Service Key' : 'Anon Key');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndUpdate() {
  console.log('\n1. Testing SELECT permission...');
  const { data: selectData, error: selectError } = await supabase
    .from('map_configs')
    .select('id, name, style')
    .eq('name', 'Basemap Grau')
    .single();
    
  if (selectError) {
    console.error('❌ SELECT failed:', selectError.message);
  } else {
    console.log('✅ SELECT successful');
    console.log('Current style:', selectData.style);
  }

  console.log('\n2. Testing UPDATE permission...');
  const newUrl = 'https://mapconfig.geolantis.com/styles/basemap2.json';
  
  const { data: updateData, error: updateError } = await supabase
    .from('map_configs')
    .update({ 
      style: newUrl,
      updated_at: new Date().toISOString()
    })
    .eq('name', 'Basemap Grau')
    .select()
    .single();
    
  if (updateError) {
    console.error('❌ UPDATE failed:', updateError.message);
    console.error('Error details:', updateError);
  } else if (!updateData) {
    console.log('⚠️  UPDATE returned no data (might be RLS policy blocking)');
  } else {
    console.log('✅ UPDATE successful');
    console.log('New style:', updateData.style);
  }

  console.log('\n3. Verifying update...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('map_configs')
    .select('style, updated_at')
    .eq('name', 'Basemap Grau')
    .single();
    
  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
  } else {
    console.log('Current style in DB:', verifyData.style);
    console.log('Updated at:', verifyData.updated_at);
    
    if (verifyData.style === newUrl) {
      console.log('✅ Update was successful!');
    } else {
      console.log('❌ Update did not persist');
      console.log('\nThis usually means:');
      console.log('1. RLS policies are blocking the update');
      console.log('2. You need a service key (not anon key) to bypass RLS');
      console.log('3. Or you need to update via Supabase dashboard');
    }
  }
}

checkAndUpdate().catch(console.error);