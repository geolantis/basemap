# Production URLs - mapconfig.geolantis.com

## 🌐 **Production Endpoints**

### **Public API (Mobile Apps)**
```
https://mapconfig.geolantis.com/api/public/mapconfig
```
- ✅ No authentication required
- ✅ Returns map configurations with injected API keys
- ✅ Cached for performance (1 hour)
- ✅ CORS enabled for all origins

### **Admin Portal**
```
https://mapconfig.geolantis.com/login
```
- 🔐 Requires authentication
- 🔐 Protected configuration management
- 🔐 Full CRUD operations

### **API Endpoints**

#### **Public Endpoints (No Auth)**
- `GET /api/public/mapconfig` - Get all public configurations
- `GET /api/public/mapconfig?format=legacy` - Legacy format for existing apps

#### **Admin Endpoints (Auth Required)**
- `POST /api/auth/login` - Admin login
- `GET /api/admin/config` - List all configurations
- `POST /api/admin/config` - Create new configuration
- `PUT /api/admin/config?id={id}` - Update configuration
- `DELETE /api/admin/config?id={id}` - Delete configuration

## 📱 **Mobile App Integration**

### **iOS/Android Apps**
```swift
// Swift example
let configUrl = "https://mapconfig.geolantis.com/api/public/mapconfig"
```

```kotlin
// Kotlin example
val configUrl = "https://mapconfig.geolantis.com/api/public/mapconfig"
```

```javascript
// React Native example
const CONFIG_URL = 'https://mapconfig.geolantis.com/api/public/mapconfig';
```

## 🔐 **Security Features**

1. **API Keys Protected**
   - Never stored in database
   - Injected server-side from environment variables
   - Different keys per environment

2. **Authentication**
   - Supabase Auth for admin access
   - JWT tokens with refresh mechanism
   - Session management

3. **Data Sanitization**
   - Public API returns only safe data
   - No sensitive information exposed
   - API keys injected only for authorized requests

## 🚀 **DNS Configuration**

If you haven't already, add these DNS records for `mapconfig.geolantis.com`:

### **Option 1: CNAME Record (Recommended)**
```
Type: CNAME
Name: mapconfig
Value: cname.vercel-dns.com.
```

### **Option 2: A Records**
```
Type: A
Name: mapconfig
Value: 76.76.21.21
```

## 📊 **Status Check**

Test your endpoints:

```bash
# Test public API
curl https://mapconfig.geolantis.com/api/public/mapconfig

# Test health
curl https://mapconfig.geolantis.com/api/health
```

## 🔄 **Updates**

To deploy updates:
```bash
vercel --prod
```

## 📝 **Environment Variables**

Ensure these are set in Vercel for production:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `MAPTILER_API_KEY`
- `CLOCKWORK_API_KEY`
- `BEV_API_KEY`
- `ADMIN_ORIGIN=https://mapconfig.geolantis.com`