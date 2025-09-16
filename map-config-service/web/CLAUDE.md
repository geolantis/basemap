# Map Configuration Service - CLAUDE Documentation

## 🎯 Primary Purpose

The **Map Configuration Service** (mapconfig.geolantis.com) is a centralized configuration portal for managing basemaps and overlay layers across all Geolantis360 map-based applications. It serves as a unified control center for:

1. **Map Layer Management**: Configure and manage both background basemaps and transparent overlay layers
2. **API Key Protection**: Securely proxy commercial map services to protect API keys from client exposure
3. **Unified Configuration**: Provide consistent map configurations across multiple Geolantis360 applications
4. **Service Abstraction**: Abstract map service complexity behind simple, standardized endpoints

## 🏗️ Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Geolantis360 Applications                 │
│         (Various map-based apps consuming map configs)       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Map Configuration Service Portal                │
│                 (mapconfig.geolantis.com)                   │
├─────────────────────────────────────────────────────────────┤
│  • Web UI for configuration management                       │
│  • API endpoints for map service delivery                   │
│  • Proxy layer for commercial services                      │
│  • Style file hosting and management                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┬─────────────────┐
        ▼                           ▼                 ▼
┌──────────────┐          ┌──────────────┐   ┌──────────────┐
│   Supabase   │          │ Secure Proxy │   │ Style Files  │
│   Database   │          │   Services   │   │   Storage    │
│              │          │              │   │              │
│ • Map configs│          │ • MapTiler   │   │ • VTC styles │
│ • Metadata   │          │ • Clockwork  │   │ • Sprites    │
│ • User prefs │          │ • BEV        │   │ • Glyphs     │
└──────────────┘          └──────────────┘   └──────────────┘
```

## 🔐 API Key Protection Strategy

The service implements a multi-layered approach to protect commercial API keys:

### 1. **Server-Side Proxy**
- All requests to commercial map providers go through the proxy layer
- API keys are stored securely in environment variables
- Client applications never receive or see the actual API keys

### 2. **Endpoint Abstraction**
```javascript
// Client request (no API key exposed)
GET /api/proxy/style/maptiler-streets-v2

// Server handles (with API key injection)
→ https://api.maptiler.com/maps/streets-v2/style.json?key=SECURE_KEY
```

### 3. **Supported Protected Services**
- **MapTiler**: Global basemaps and styles
- **Clockwork Micro**: Alternative global maps
- **BEV (Austria)**: Austrian cadastral data
- **Mapbox**: Geocoding services
- **Google Maps**: Roadmap and satellite imagery

## 🗺️ Map Categories

### Background Maps (Basemaps)
- Full opaque map layers that serve as the primary map display
- Examples: Street maps, satellite imagery, topographic maps
- One active at a time per view

### Overlay Maps
- Transparent layers that display on top of basemaps
- Examples: Cadastral boundaries, contour lines, administrative borders
- Multiple overlays can be active simultaneously

## 📡 Service Endpoints

### Configuration API
```
GET /api/maps                    # List all available maps
GET /api/maps/{id}              # Get specific map configuration
POST /api/maps                  # Create new map configuration (admin)
PUT /api/maps/{id}              # Update map configuration (admin)
DELETE /api/maps/{id}           # Remove map configuration (admin)
```

### Proxy Endpoints
```
GET /api/proxy/style/{provider} # Get proxied style JSON
GET /api/proxy/tiles/{provider} # Proxy tile requests
GET /api/proxy/sprite/{provider} # Proxy sprite sheets
GET /api/proxy/glyphs/{provider} # Proxy font glyphs
```

### Style Management
```
GET /styles/{style}.json        # Serve hosted style files
POST /api/upload/style          # Upload new style file
GET /api/styles/validate        # Validate style JSON
```

## 🔧 Key Features

### 1. **Multi-Application Support**
- Single source of truth for map configurations
- Consistent map experiences across Geolantis360 apps
- Centralized updates propagate to all applications

### 2. **Dynamic Configuration**
- Hot-reload map configurations without app updates
- A/B testing different map providers
- Region-specific map optimizations

### 3. **Security Features**
- Row-level security in Supabase
- JWT authentication for admin operations
- CORS configuration for trusted domains
- Rate limiting on proxy endpoints

### 4. **Performance Optimization**
- CDN integration for style files
- Tile caching strategies
- Lazy loading of map resources
- Preview image generation for quick browsing

## 🌍 Geolantis360 Integration

### Consuming Applications
Applications integrate with the service through:

1. **Direct API Integration**
```javascript
// Fetch available maps
const response = await fetch('https://mapconfig.geolantis.com/api/maps');
const maps = await response.json();

// Use proxied style
maplibregl.Map({
  style: 'https://mapconfig.geolantis.com/api/proxy/style/maptiler-streets-v2'
});
```

2. **SDK Integration** (planned)
```javascript
import { GeolantisMapConfig } from '@geolantis/map-config';

const mapConfig = new GeolantisMapConfig({
  apiUrl: 'https://mapconfig.geolantis.com'
});

const maps = await mapConfig.getMaps();
const style = await mapConfig.getStyle('austria-basemap');
```

## 🚀 Deployment

### Production Environment
- **URL**: https://mapconfig.geolantis.com
- **Hosting**: Vercel (automatic deployments)
- **Database**: Supabase (PostgreSQL)
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics

### Development Workflow
```bash
# Local development
npm run dev                    # Start development server
npm run build                 # Build for production
npm run preview              # Preview production build

# Database management
npm run db:migrate           # Run migrations
npm run db:seed             # Seed sample data
npm run db:sync            # Sync with production
```

## 📊 Usage Patterns

### Typical Application Flow
1. Application requests available maps from the service
2. User selects desired basemap and overlays
3. Application requests proxied style/tiles through service endpoints
4. Service handles API key injection and returns map data
5. Application renders maps without exposed API keys

### Multi-Tenant Scenarios
- Different Geolantis360 apps can have filtered map lists
- Custom branding per application
- Usage tracking per application
- Differentiated access levels

## 🔒 Security Considerations

### API Key Management
- **Never** commit API keys to repository
- Use environment variables for all keys
- Rotate keys regularly
- Monitor usage for anomalies

### Access Control
- Public read access for map configurations
- Authenticated write access for administrators
- Rate limiting on proxy endpoints
- IP whitelisting for sensitive operations

## 🎯 Benefits for Geolantis360

1. **Centralized Control**: Manage all map configurations from one place
2. **Cost Optimization**: Share API quotas across applications
3. **Consistency**: Uniform map experience across products
4. **Security**: Protected API keys and controlled access
5. **Flexibility**: Easy provider switching without app updates
6. **Scalability**: Add new maps without touching application code
7. **Analytics**: Track map usage across all applications

## 📝 Best Practices

### For Administrators
- Regularly audit map configurations
- Monitor API usage and costs
- Keep style files optimized
- Document custom configurations
- Test new maps before production deployment

### For Developers
- Always use proxy endpoints for commercial services
- Cache map configurations locally
- Handle fallback scenarios
- Implement proper error handling
- Use TypeScript interfaces for type safety

## 🔗 Related Resources

- [Supabase Dashboard](https://app.supabase.com/project/wphrytrrikfkwehwahqc)
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)
- [OpenMapTiles Schema](https://openmaptiles.org/schema/)

## 🚢 Deployment Instructions

### Deploying to Vercel Production

1. **Ensure all changes are committed and pushed to GitHub**:
   ```bash
   git add -A
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Deploy to Vercel Production**:
   ```bash
   # From the /map-config-service/web directory
   vercel --prod
   ```

3. **Alternative: Automatic Deployment**
   - Vercel automatically deploys when changes are pushed to the main branch on GitHub
   - Check deployment status at: https://vercel.com/geolantis-projects/web

### Vercel Commands

- **Deploy to production**: `vercel --prod`
- **Deploy to preview**: `vercel`
- **Check logs**: `vercel logs`
- **Check deployment status**: `vercel inspect [deployment-url] --logs`
- **Redeploy**: `vercel redeploy [deployment-url]`

### Environment Variables

Environment variables are managed in the Vercel dashboard:
1. Go to: https://vercel.com/geolantis-projects/web/settings/environment-variables
2. Add/update variables as needed
3. Redeploy for changes to take effect

## 🚨 Important Notes

1. **Production Data**: The service contains live production configurations used by actual Geolantis360 applications
2. **API Quotas**: Be mindful of commercial API quotas and rate limits
3. **Backwards Compatibility**: Changes to map configurations should maintain compatibility with existing applications
4. **Preview Images**: Automatically generated for better UX in map selection
5. **Caching Strategy**: Implement appropriate caching to reduce API calls

---

*Last Updated: November 2024*
*Service Version: 2.0.0*
*Maintained by: Geolantis360 Development Team*