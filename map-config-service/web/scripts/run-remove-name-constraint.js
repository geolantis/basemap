#!/usr/bin/env node

/**
 * Script to remove the unique constraint from the name field in map_configs table
 * This allows users to rename configurations freely without conflicts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting migration to remove unique constraint from name field...\n');

  try {
    // Read the migration SQL file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '004_remove_name_unique_constraint.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📝 Migration SQL:');
    console.log('─'.repeat(50));
    console.log(migrationSQL);
    console.log('─'.repeat(50));
    console.log();

    // Execute the migration
    console.log('⏳ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If RPC doesn't exist, try a different approach
      console.log('⚠️  RPC method not available, trying alternative approach...');

      // We'll need to execute the SQL statements individually
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX')) {
          console.log(`\n📌 Note: Statement needs to be run directly in Supabase SQL editor:`);
          console.log(`   ${statement.substring(0, 50)}...`);
        }
      }

      console.log('\n📋 Manual Migration Instructions:');
      console.log('─'.repeat(50));
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Create a new query');
      console.log('4. Copy and paste the following SQL:');
      console.log('\n' + migrationSQL);
      console.log('\n5. Click "Run" to execute the migration');
      console.log('─'.repeat(50));

      return;
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Changes made:');
    console.log('  • Removed unique constraint from name field');
    console.log('  • Added non-unique index for performance');
    console.log('  • Added documentation comment');
    console.log('  • Logged migration in audit table');

  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();