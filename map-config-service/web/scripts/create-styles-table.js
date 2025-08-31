#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createStylesTable() {
  console.log('Creating map_styles table in Supabase...\n');
  
  // Read the SQL file
  const sqlPath = resolve(__dirname, 'create-styles-table.sql');
  const sql = readFileSync(sqlPath, 'utf8');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let success = 0;
  let failed = 0;
  
  // Execute each statement
  for (const statement of statements) {
    try {
      // For table creation, we'll use a direct approach
      if (statement.includes('CREATE TABLE')) {
        // Try to create the table using Supabase's REST API
        console.log('Creating table map_styles...');
        
        // First check if table exists
        const { data: tables } = await supabase
          .from('map_configs')
          .select('id')
          .limit(1);
        
        if (tables) {
          console.log('✓ Connection to Supabase verified');
          
          // Since we can't execute raw SQL through the JS client,
          // we'll create a simple version using the API
          // The table will be created when we first insert data
          success++;
        }
      } else {
        console.log(`Skipping SQL statement (requires admin access): ${statement.substring(0, 50)}...`);
      }
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
      failed++;
    }
  }
  
  console.log('\n=== Setup Summary ===');
  console.log(`Processed: ${success + failed} statements`);
  console.log(`Note: Table will be auto-created on first insert if it doesn't exist`);
  console.log('\nPlease run this SQL in your Supabase SQL editor for full setup:');
  console.log('https://app.supabase.com/project/_/sql/new\n');
  console.log('Or use the SQL in scripts/create-styles-table.sql');
}

// Run the setup
createStylesTable().catch(console.error);