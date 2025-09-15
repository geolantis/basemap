#!/usr/bin/env node

/**
 * Script to add Pelican Corp users to the Map Configuration Service
 * 
 * Users to add:
 * 1. Arpine Jenderedjian (arpine.jenderedjian@pelicancorp.com)
 * 2. Thomas Hohaeuser (thomas.hohaeuser@pelicancorp.com)
 * 
 * This script requires:
 * - SUPABASE_URL environment variable
 * - SUPABASE_SERVICE_ROLE_KEY environment variable (for admin operations)
 * 
 * Usage:
 * npm run add-pelican-users
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Check required environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Determine if we're in local development or production
const isLocalDev = process.env.NODE_ENV === 'development' || 
                   supabaseUrl?.includes('localhost') ||
                   !process.env.VERCEL_URL;

// Set the appropriate base URL
const baseUrl = isLocalDev ? 'http://localhost:5173' : 'https://mapconfig.geolantis.com';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('  - SUPABASE_URL or VITE_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env.local file');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Users to add
const pelicanUsers = [
  {
    email: 'arpine.jenderedjian@pelicancorp.com',
    name: 'Arpine Jenderedjian',
    company: 'Pelican Corp',
    role: 'admin'
  },
  {
    email: 'thomas.hohaeuser@pelicancorp.com',
    name: 'Thomas Hohaeuser',
    company: 'Pelican Corp',
    role: 'admin'
  }
];

async function addUser(userData) {
  const { email, name, company, role } = userData;
  
  console.log(`\n📧 Processing user: ${email}`);
  
  try {
    // Step 1: Create user in Supabase Auth
    console.log('  Creating user in Supabase Auth...');
    
    // Generate a secure temporary password
    const tempPassword = generateSecurePassword();
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: name,
        company: company,
        role: role
      }
    });

    if (authError) {
      // Check if user already exists
      if (authError.message?.includes('already exists')) {
        console.log('  ⚠️  User already exists in Auth, fetching existing user...');
        
        // Get existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users.find(u => u.email === email);
        if (!existingUser) {
          throw new Error('Could not find existing user');
        }
        
        // Use existing user ID
        await addToUsersTable(existingUser.id, email, role);
        await sendPasswordResetEmail(email);
        return;
      }
      throw authError;
    }

    if (!authUser || !authUser.user) {
      throw new Error('Failed to create user - no user data returned');
    }

    console.log(`  ✅ User created in Auth with ID: ${authUser.user.id}`);
    
    // Step 2: Add user to application users table
    await addToUsersTable(authUser.user.id, email, role);
    
    // Step 3: Send password reset email for user to set their own password
    await sendPasswordResetEmail(email);
    
    console.log(`  ✅ User ${name} successfully added!`);
    console.log(`  📬 Password reset email sent to ${email}`);
    
  } catch (error) {
    console.error(`  ❌ Error adding user ${email}:`, error.message);
    return false;
  }
  
  return true;
}

async function addToUsersTable(userId, email, role) {
  console.log('  Adding user to users table...');
  
  const { error: dbError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: email,
      role: role
    }, {
      onConflict: 'id'
    });

  if (dbError) {
    // If the error is about duplicate key, it means user already exists
    if (dbError.message?.includes('duplicate')) {
      console.log('  ⚠️  User already exists in users table, updating role...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: role, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (updateError) throw updateError;
    } else {
      throw dbError;
    }
  }
  
  console.log('  ✅ User added to users table');
}

async function sendPasswordResetEmail(email) {
  console.log('  Sending password reset email...');
  
  const resetUrl = `${baseUrl}/reset-password`;
  console.log(`  Reset URL: ${resetUrl}`);
  
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: resetUrl,
  });
  
  if (resetError) {
    console.warn('  ⚠️  Could not send password reset email:', resetError.message);
    console.log('  ℹ️  User can request password reset manually at login');
  } else {
    console.log('  ✅ Password reset email sent');
  }
}

function generateSecurePassword() {
  // Generate a secure temporary password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function verifyUsers() {
  console.log('\n🔍 Verifying users in database...\n');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .in('email', pelicanUsers.map(u => u.email));
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  if (users && users.length > 0) {
    console.log('Found users in database:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Created: ${new Date(user.created_at).toLocaleDateString()}`);
    });
  } else {
    console.log('No Pelican users found in database yet.');
  }
}

async function main() {
  console.log('🚀 Map Configuration Service - Add Pelican Users\n');
  console.log('This script will add the following users:');
  pelicanUsers.forEach((user, idx) => {
    console.log(`  ${idx + 1}. ${user.name} (${user.email})`);
  });
  
  console.log('\n⏳ Starting user creation process...');
  
  let successCount = 0;
  for (const user of pelicanUsers) {
    const success = await addUser(user);
    if (success) successCount++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n✨ Process complete! ${successCount}/${pelicanUsers.length} users processed successfully.`);
  
  // Verify users were added
  await verifyUsers();
  
  console.log('\n📝 Next steps:');
  console.log('  1. Users will receive password reset emails');
  console.log('  2. They should click the link to set their passwords');
  console.log('  3. After setting passwords, they can login at:');
  console.log(`     ${baseUrl}/login`);
  console.log('\n📍 Environment:', isLocalDev ? 'Local Development' : 'Production');
  console.log('\n👋 Done!');
}

// Run the script
main().catch(console.error);