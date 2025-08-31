# Authentication Architecture

This application implements a **dual authentication strategy** to serve different needs:

## 1. Public API (Mobile Apps) - No Authentication Required

**Endpoint:** `/api/public/mapconfig`

- **Purpose:** Serves map configurations to mobile apps (iOS/Android)
- **Authentication:** None required
- **Data:** Sanitized configurations without sensitive keys
- **Caching:** CDN-friendly with 1-hour cache headers
- **Rate Limiting:** IP-based (no auth needed)

### Key Features:
- ✅ No authentication needed (apps don't need to manage tokens)
- ✅ Permanent URLs that never change
- ✅ Sanitized data (no API keys or credentials exposed)
- ✅ CDN cacheable for performance
- ✅ Backward compatible with legacy format

### Example Usage:
```javascript
// Mobile app fetching configs
fetch('https://api.yourdomain.com/api/public/mapconfig')
  .then(res => res.json())
  .then(data => {
    // data.configs contains sanitized map configurations
  });

// Legacy format for existing apps
fetch('https://api.yourdomain.com/api/public/mapconfig?format=legacy')
```

## 2. Admin Backend - JWT Authentication

**Endpoints:** `/api/admin/*`

- **Purpose:** Configuration management interface
- **Authentication:** JWT tokens with refresh mechanism
- **Access:** Role-based (admin, super_admin, viewer)
- **Security:** Rate limiting, audit logging, secure sessions

### Key Features:
- 🔐 Secure login with bcrypt password hashing
- 🔑 JWT tokens (2-hour expiry) with refresh tokens (7-day)
- 👥 Role-based access control
- 📝 Full audit logging
- 🛡️ Rate limiting and brute force protection

### Authentication Flow:
1. Admin logs in via `/login` page
2. Server validates credentials and issues JWT
3. Client stores token and includes in API requests
4. Token auto-refreshes before expiry
5. All actions are audit logged

## Security Best Practices Implemented

### For Public API:
- ✅ No sensitive data in responses
- ✅ CDN-compatible caching headers
- ✅ Rate limiting by IP address
- ✅ CORS enabled for mobile apps
- ✅ Optional API usage tracking

### For Admin Portal:
- ✅ Secure password hashing (bcrypt)
- ✅ JWT with short expiry times
- ✅ Refresh token rotation
- ✅ CORS restricted to admin domain
- ✅ Audit logging for all actions
- ✅ Role-based permissions
- ✅ Secure session management

## Database Schema

### Core Tables:
- `map_configs` - Stores all map configurations
- `admins` - Admin user accounts
- `api_keys` - Optional API keys for tracking (not required)
- `auth_logs` - Authentication events
- `config_audit_log` - Configuration change history
- `api_usage` - API usage metrics

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key  # For public reads
SUPABASE_SERVICE_KEY=your-service-key  # For admin operations

# JWT
JWT_SECRET=your-secure-secret-min-32-chars
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# Admin
ADMIN_ORIGIN=https://admin.yourdomain.com
```

## Setup Instructions

1. **Database Setup:**
   ```sql
   -- Run the schema.sql file in your Supabase SQL editor
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Deploy:**
   - Deploy to Vercel
   - Set environment variables in Vercel dashboard
   - Configure custom domain

4. **Create Admin User:**
   ```sql
   INSERT INTO admins (email, password_hash, role) 
   VALUES (
     'your-email@example.com',
     -- Generate hash: bcrypt.hash('your-password', 10)
     '$2a$10$...',
     'super_admin'
   );
   ```

## Testing

### Test Public API:
```bash
# Fetch public configs (no auth needed)
curl https://api.yourdomain.com/api/public/mapconfig

# Legacy format
curl https://api.yourdomain.com/api/public/mapconfig?format=legacy
```

### Test Admin API:
```bash
# Login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Use token for admin endpoints
curl https://api.yourdomain.com/api/admin/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Migration Path

1. **Phase 1:** Deploy public endpoint (no app changes needed)
2. **Phase 2:** Add admin authentication
3. **Phase 3:** Migrate existing configs to database
4. **Phase 4:** Enable audit logging and monitoring

## Monitoring

- API usage tracked in `api_usage` table
- Authentication events in `auth_logs` table
- Configuration changes in `config_audit_log` table
- Rate limiting prevents abuse
- CDN caching reduces server load