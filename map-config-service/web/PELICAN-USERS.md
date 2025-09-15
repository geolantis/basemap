# Adding Pelican Corp Users to Map Configuration Service

## Overview
This document describes how to add the following Pelican Corp users to the Map Configuration Service authentication system:

1. **Arpine Jenderedjian** - arpine.jenderedjian@pelicancorp.com
2. **Thomas Hohaeuser** - thomas.hohaeuser@pelicancorp.com

## 🚀 Quick Start for Local Development

```bash
# Add Pelican users for local development (uses localhost:5173)
npm run add-users:local --pelican

# Or explicitly specify local environment
npm run add-pelican-users -- --env local
```

For local development, users will receive temporary passwords in the console output instead of emails.

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to: https://app.supabase.com/project/wphrytrrikfkwehwahqc
2. Navigate to **Authentication** → **Users**

### Step 2: Invite Each User
1. Click **"Invite User"** button
2. For **Arpine Jenderedjian**:
   - Email: `arpine.jenderedjian@pelicancorp.com`
   - Full Name: `Arpine Jenderedjian`
   - Send invite email: ✓ Yes
   - Click "Invite"

3. For **Thomas Hohaeuser**:
   - Email: `thomas.hohaeuser@pelicancorp.com`
   - Full Name: `Thomas Hohaeuser`
   - Send invite email: ✓ Yes
   - Click "Invite"

### Step 3: Add Users to Application Database
After creating users in Supabase Auth, note their User IDs and run the SQL script:

1. Go to Supabase Dashboard → **SQL Editor**
2. Open `scripts/add-pelican-users.sql`
3. Replace the placeholder UUIDs with actual user IDs
4. Run the SQL commands to add users to the `users` table with admin role

## Method 2: Using Automated Script

### Prerequisites
- Node.js installed
- Access to `.env.local` file with:
  - `SUPABASE_URL` or `VITE_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (admin key required)

### Environment Detection
The script automatically detects if you're running locally or in production:
- **Local Development**: Uses `http://localhost:5173`
- **Production**: Uses `https://mapconfig.geolantis.com`

### Run the Script
```bash
# From the web directory
cd map-config-service/web

# Run the automated script
npm run add-pelican-users
```

The script will:
1. Create users in Supabase Auth
2. Add them to the users table with admin role
3. Send password reset emails for secure password setup

## Method 3: Manual SQL Commands

If you have direct database access, you can use the SQL script:

```bash
# Navigate to the scripts directory
cd map-config-service/web/scripts

# Review the SQL script
cat add-pelican-users.sql

# Execute in Supabase SQL Editor or via CLI
```

## User Permissions

Both users will be granted **admin** role, which allows:
- ✅ View all map configurations
- ✅ Create new map configurations
- ✅ Edit existing configurations
- ✅ Delete configurations
- ✅ Manage API keys
- ✅ View audit logs
- ✅ Access to all countries' maps

## Post-Setup Instructions

### For the Users
1. Users will receive an email invitation
2. They should click the link to set their password
3. After setting password, login at:
   - **Local Development**: http://localhost:5173
   - **Production**: https://mapconfig.geolantis.com

### For Administrators
1. Verify users were created successfully:
   ```sql
   SELECT id, email, role, created_at 
   FROM users 
   WHERE email IN (
     'arpine.jenderedjian@pelicancorp.com',
     'thomas.hohaeuser@pelicancorp.com'
   );
   ```

2. Check audit logs for user creation:
   ```sql
   SELECT * FROM audit_logs 
   WHERE entity_type = 'users' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

## Troubleshooting

### User Already Exists Error
If a user already exists in Supabase Auth:
1. Find their existing User ID in the Supabase Dashboard
2. Update the `users` table directly with their role

### Password Reset Not Received
Users can manually request a password reset:
1. Go to the login page:
   - **Local**: http://localhost:5173/login
   - **Production**: https://mapconfig.geolantis.com/login
2. Click "Forgot Password"
3. Enter their email address

### Access Issues After Setup
Verify:
1. User exists in Supabase Auth (Authentication → Users)
2. User exists in `users` table with correct role
3. User has confirmed their email address
4. User has set their password

## Security Notes
- Users are created with temporary passwords that must be changed on first login
- All authentication is handled through Supabase's secure authentication system
- User sessions expire after 24 hours of inactivity
- All user actions are logged in the audit trail

## Support
For any issues with user setup, contact the development team or check:
- Supabase Dashboard: https://app.supabase.com/project/wphrytrrikfkwehwahqc
- Application URL: https://mapconfig.geolantis.com
- Audit Logs: Available in the SQL Editor for troubleshooting

---
*Created: December 2024*
*Last Updated: December 2024*