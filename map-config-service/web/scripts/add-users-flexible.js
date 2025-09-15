#!/usr/bin/env node

/**
 * Flexible script to add users to the Map Configuration Service
 * Supports both local development and production environments
 * 
 * Usage:
 * npm run add-users -- --email user@example.com --name "User Name" [--env local|production]
 * npm run add-pelican-users [--env local|production]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { parseArgs } from 'util';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Parse command line arguments
const options = {
  email: {
    type: 'string',
    short: 'e'
  },
  name: {
    type: 'string',
    short: 'n'
  },
  role: {
    type: 'string',
    short: 'r',
    default: 'admin'
  },
  env: {
    type: 'string',
    default: 'auto'
  },
  pelican: {
    type: 'boolean',
    short: 'p',
    default: false
  },
  help: {
    type: 'boolean',
    short: 'h',
    default: false
  }
};

let args;
try {
  const parsed = parseArgs({ options, allowPositionals: true });
  args = parsed.values;
} catch (error) {
  // Fallback for older Node versions
  args = {
    email: process.argv.find(arg => arg.startsWith('--email='))?.split('=')[1],
    name: process.argv.find(arg => arg.startsWith('--name='))?.split('=')[1],
    role: process.argv.find(arg => arg.startsWith('--role='))?.split('=')[1] || 'admin',
    env: process.argv.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'auto',
    pelican: process.argv.includes('--pelican'),
    help: process.argv.includes('--help') || process.argv.includes('-h')
  };
}

// Show help if requested
if (args.help) {
  console.log(`
Map Configuration Service - User Management

Usage:
  node scripts/add-users-flexible.js [OPTIONS]

Options:
  --email, -e <email>     User email address
  --name, -n <name>       User full name
  --role, -r <role>       User role (admin|editor|viewer) [default: admin]
  --env <environment>     Environment (local|production|auto) [default: auto]
  --pelican, -p          Add Pelican Corp users
  --help, -h             Show this help message

Examples:
  # Add a single user
  node scripts/add-users-flexible.js --email user@example.com --name "John Doe"
  
  # Add Pelican users for local development
  node scripts/add-users-flexible.js --pelican --env local
  
  # Add user with specific role
  node scripts/add-users-flexible.js --email viewer@example.com --name "Jane Viewer" --role viewer
`);
  process.exit(0);
}

// Check required environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('  - SUPABASE_URL or VITE_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env.local file');
  process.exit(1);
}

// Determine environment
let environment = args.env;
if (environment === 'auto') {
  environment = process.env.NODE_ENV === 'production' ? 'production' : 'local';
  
  // Additional checks
  if (supabaseUrl.includes('localhost') || process.env.VITE_APP_URL?.includes('localhost')) {
    environment = 'local';
  } else if (process.env.VERCEL_URL || process.env.VITE_APP_URL?.includes('geolantis')) {
    environment = 'production';
  }
}

// Set the appropriate base URL
const baseUrls = {
  local: process.env.VITE_APP_URL || 'http://localhost:5173',
  production: 'https://mapconfig.geolantis.com'
};
const baseUrl = baseUrls[environment] || baseUrls.local;

console.log(`
🔧 Configuration:
  Environment: ${environment}
  Base URL: ${baseUrl}
  Supabase URL: ${supabaseUrl}
`);

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Define Pelican users
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
      email_confirm: true, // Auto-confirm email for local development
      user_metadata: {
        full_name: name,
        company: company || '',
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
        
        // Only send reset email in production
        if (environment === 'production') {
          await sendPasswordResetEmail(email);
        } else {
          console.log('  ℹ️  Local environment - skipping email');
          console.log(`  🔑 Temporary password: ${tempPassword}`);
        }
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
    
    // Step 3: Handle password setup based on environment
    if (environment === 'production') {
      await sendPasswordResetEmail(email);
      console.log(`  📬 Password reset email sent to ${email}`);
    } else {
      console.log('  ℹ️  Local environment - no email sent');
      console.log(`  🔑 Temporary password for local testing: ${tempPassword}`);
      console.log(`  📝 User can login at: ${baseUrl}/login`);
    }
    
    console.log(`  ✅ User ${name} successfully added!`);
    
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
  
  console.log('  ✅ User added to users table with role:', role);
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

async function verifyUsers(emails) {
  console.log('\n🔍 Verifying users in database...\n');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .in('email', emails);
  
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
    console.log('No users found in database yet.');
  }
}

async function main() {
  console.log('🚀 Map Configuration Service - User Management\n');
  
  let usersToAdd = [];
  
  // Determine which users to add
  if (args.pelican) {
    console.log('Adding Pelican Corp users...');
    usersToAdd = pelicanUsers;
  } else if (args.email && args.name) {
    console.log('Adding custom user...');
    usersToAdd = [{
      email: args.email,
      name: args.name,
      company: '',
      role: args.role || 'admin'
    }];
  } else {
    console.error('❌ Please specify either --pelican or both --email and --name');
    console.log('Run with --help for usage information');
    process.exit(1);
  }
  
  console.log('\nUsers to add:');
  usersToAdd.forEach((user, idx) => {
    console.log(`  ${idx + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
  });
  
  console.log('\n⏳ Starting user creation process...');
  
  let successCount = 0;
  for (const user of usersToAdd) {
    const success = await addUser(user);
    if (success) successCount++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n✨ Process complete! ${successCount}/${usersToAdd.length} users processed successfully.`);
  
  // Verify users were added
  await verifyUsers(usersToAdd.map(u => u.email));
  
  console.log('\n📝 Next steps:');
  if (environment === 'production') {
    console.log('  1. Users will receive password reset emails');
    console.log('  2. They should click the link to set their passwords');
  } else {
    console.log('  1. Users can login with the temporary passwords shown above');
    console.log('  2. Recommend changing passwords after first login');
  }
  console.log(`  3. Login URL: ${baseUrl}/login`);
  console.log(`\n📍 Environment: ${environment.toUpperCase()}`);
  console.log('👋 Done!');
}

// Run the script
main().catch(console.error);