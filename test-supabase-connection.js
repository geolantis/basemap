import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with the same credentials
const supabaseUrl = 'https://wphrytrrikfkwehwahqc.supabase.co';
// Updated to use the current valid anon key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHJ5dHJyaWtma3dlaHdhaHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTI5NzUsImV4cCI6MjA3MjEyODk3NX0.8E7_6gTc4guWSB2lI-hFQfGSEs6ziLmIT3P8xPbmz_k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...\n');
  
  // Test 1: Check if map_configs table exists
  console.log('1. Checking map_configs table...');
  const { data: mapConfigs, error: mapConfigsError } = await supabase
    .from('map_configs')
    .select('count')
    .limit(1);
  
  if (mapConfigsError) {
    console.log('   ❌ map_configs table error:', mapConfigsError.message);
  } else {
    console.log('   ✅ map_configs table exists');
  }
  
  // Test 2: Check if maps table exists
  console.log('\n2. Checking maps table...');
  const { data: maps, error: mapsError } = await supabase
    .from('maps')
    .select('count')
    .limit(1);
  
  if (mapsError) {
    console.log('   ❌ maps table error:', mapsError.message);
  } else {
    console.log('   ✅ maps table exists');
  }
  
  // Test 3: Check map_configs table schema
  console.log('\n3. Fetching map_configs columns...');
  const { data: configSample, error: configSampleError } = await supabase
    .from('map_configs')
    .select('*')
    .limit(1);
  
  if (configSampleError) {
    console.log('   ❌ Cannot fetch from map_configs:', configSampleError.message);
  } else if (configSample && configSample.length > 0) {
    console.log('   ✅ map_configs columns:', Object.keys(configSample[0]));
  } else {
    console.log('   ⚠️ map_configs table is empty');
  }
  
  // Test 4: Check maps table schema
  console.log('\n4. Fetching maps columns...');
  const { data: mapsSample, error: mapsSampleError } = await supabase
    .from('maps')
    .select('*')
    .limit(1);
  
  if (mapsSampleError) {
    console.log('   ❌ Cannot fetch from maps:', mapsSampleError.message);
  } else if (mapsSample && mapsSample.length > 0) {
    console.log('   ✅ maps columns:', Object.keys(mapsSample[0]));
  } else {
    console.log('   ⚠️ maps table is empty');
  }
  
  // Test 5: Try a test insert
  console.log('\n5. Testing insert capability...');
  const testConfig = {
    name: `test-style-${Date.now()}`,
    label: 'Test Style',
    type: 'vtc',
    style: '/test/style.json',
    country: 'Global',
    flag: '🌍',
    metadata: { test: true },
    is_active: true,
    version: 1
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('map_configs')
    .insert([testConfig])
    .select()
    .single();
  
  if (insertError) {
    console.log('   ❌ Insert to map_configs failed:', insertError.message);
    
    // Try maps table with adjusted fields
    const testMapConfig = {
      ...testConfig,
      active: testConfig.is_active // Use 'active' instead of 'is_active'
    };
    delete testMapConfig.is_active;
    
    const { data: mapsInsert, error: mapsInsertError } = await supabase
      .from('maps')
      .insert([testMapConfig])
      .select()
      .single();
      
    if (mapsInsertError) {
      console.log('   ❌ Insert to maps also failed:', mapsInsertError.message);
    } else {
      console.log('   ✅ Successfully inserted to maps table with ID:', mapsInsert.id);
      
      // Clean up test data
      await supabase.from('maps').delete().eq('id', mapsInsert.id);
      console.log('   🧹 Test data cleaned up');
    }
  } else {
    console.log('   ✅ Successfully inserted to map_configs with ID:', insertData.id);
    
    // Clean up test data
    await supabase.from('map_configs').delete().eq('id', insertData.id);
    console.log('   🧹 Test data cleaned up');
  }
  
  console.log('\n✨ Connection test complete!');
}

testConnection().catch(console.error);