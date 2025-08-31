# Map Configuration Service - Features & API Documentation

## Feature Overview

### Core Features Matrix

| Feature Category | Feature | Status | Description |
|------------------|---------|--------|-------------|
| **Configuration Management** | CRUD Operations | ✅ Complete | Create, read, update, delete map configurations |
| | Multi-format Support | ✅ Complete | VTC, WMTS, WMS service types |
| | Configuration Validation | ✅ Complete | Real-time validation of map service endpoints |
| | Batch Operations | ✅ Complete | Bulk operations on multiple configurations |
| | Export/Import | ✅ Complete | Standard format support for configuration exchange |
| | Version Control | 🚧 Partial | Basic versioning, advanced history pending |
| **AI Discovery** | Natural Language Search | ✅ Complete | Claude AI powered map service discovery |
| | Multi-source Discovery | ✅ Complete | Government portals, open data, commercial services |
| | Automatic Validation | ✅ Complete | Real-time validation of discovered services |
| | Confidence Scoring | ✅ Complete | AI confidence ratings for discovered maps |
| | Geographic Filtering | ✅ Complete | Region-based discovery filtering |
| **User Interface** | Interactive Dashboard | ✅ Complete | Statistics, filtering, search, grid/list views |
| | Map Preview | ✅ Complete | Interactive MapLibre GL preview |
| | Configuration Editor | ✅ Complete | Visual editing interface |
| | Responsive Design | ✅ Complete | Mobile and desktop optimized |
| | Dark Mode | ❌ Not Implemented | Theme switching |
| **Integration** | Maputnik Integration | ✅ Complete | Direct style editor integration |
| | API Access | ✅ Complete | RESTful API for external integrations |
| | Webhook Support | ❌ Not Implemented | Real-time notifications |
| | Third-party Auth | 🚧 Partial | OAuth providers integration |
| **Administration** | User Management | 🚧 Partial | Basic role-based access |
| | Audit Logging | ✅ Complete | Complete action trail |
| | API Key Management | ✅ Complete | Secure key storage |
| | System Monitoring | 🚧 Partial | Basic health checks |

Legend: ✅ Complete | 🚧 Partial | ❌ Not Implemented

## Detailed Feature Descriptions

### 1. Configuration Management System

#### Map Configuration CRUD
- **Create**: Visual wizard for new configuration setup
- **Read**: Efficient querying with filtering and search
- **Update**: In-place editing with validation
- **Delete**: Soft delete with recovery options
- **Duplicate**: Smart duplication with customization options

#### Supported Map Types
```typescript
// Vector Tile Configuration (VTC)
{
  type: 'vtc',
  style: 'https://api.maptiler.com/maps/streets/style.json',
  metadata: {
    tiles: ['https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf'],
    attribution: 'MapTiler',
    maxzoom: 14
  }
}

// WMTS Configuration
{
  type: 'wmts',
  style: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/WMTS',
  metadata: {
    layer: 'World_Imagery',
    format: 'image/jpeg',
    tileMatrixSet: 'GoogleMapsCompatible'
  }
}

// WMS Configuration
{
  type: 'wms',
  style: 'https://demo.boundlessgeo.com/geoserver/wms',
  metadata: {
    layers: 'ne:ne_50m_admin_0_countries',
    format: 'image/png',
    version: '1.3.0'
  }
}
```

### 2. AI-Powered Map Discovery

#### Claude AI Integration
- **Natural Language Processing**: Understands descriptive search queries
- **Context-Aware Search**: Considers map types, regions, and use cases
- **Multi-source Discovery**: Searches across:
  - Government open data portals
  - Public map services
  - Free tier commercial services
  - Community-driven projects

#### Discovery Pipeline
```typescript
// Search Request Processing
searchQuery: "Find satellite imagery for European cities"
    ↓
// Claude AI Analysis
{
  mapTypes: ['wmts', 'wms'],
  regions: ['Europe'],
  keywords: ['satellite', 'imagery', 'urban', 'cities'],
  providers: ['ESA', 'Sentinel', 'Copernicus']
}
    ↓
// Structured Discovery
{
  maps: [
    {
      name: 'sentinel-2-cloudless',
      label: 'Sentinel-2 Cloudless',
      type: 'wmts',
      url: 'https://tiles.maps.eox.at/wmts',
      country: 'Europe',
      provider: 'EOX',
      confidence: 0.95
    }
  ]
}
```

### 3. Validation & Quality Assurance

#### Multi-Layer Validation
```typescript
interface ValidationSuite {
  availability: {
    test: 'HTTP HEAD request to service endpoint',
    timeout: 5000,
    retries: 3
  },
  cors: {
    test: 'Check Access-Control-Allow-Origin headers',
    requirement: 'Must allow cross-origin requests'
  },
  format: {
    test: 'Validate response content-type',
    vtc: 'application/x-protobuf or application/octet-stream',
    wmts: 'image/* or application/xml',
    wms: 'image/* or application/xml'
  },
  geographic: {
    test: 'Sample tile/image request',
    validation: 'Valid geographic data response'
  }
}
```

#### Validation Status Indicators
- 🟢 **Valid**: All tests passed, service fully functional
- 🟡 **Warning**: Some tests failed, but service partially functional
- 🔴 **Invalid**: Critical tests failed, service not usable
- 🔵 **Validating**: Tests in progress
- ⚪ **Pending**: Not yet tested

### 4. Interactive User Interface

#### Dashboard Features
- **Real-time Statistics**: Live counts and metrics
- **Advanced Filtering**: Multi-criteria filtering system
- **Search Integration**: Instant search with debouncing
- **View Modes**: Grid and list display options
- **Bulk Operations**: Select and operate on multiple items

#### Map Preview System
- **MapLibre GL Integration**: Hardware-accelerated rendering
- **Interactive Controls**: Pan, zoom, layer toggles
- **Style Inspection**: Layer and style property display
- **Export Options**: Image export and style download

## API Documentation

### Authentication

#### JWT Token Authentication
```http
Authorization: Bearer <jwt-token>
```

#### Supabase Integration
```javascript
// Client-side authentication
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Configuration API Endpoints

#### 1. Get All Configurations
```http
GET /api/config
Query Parameters:
  - limit: number (default: 20)
  - offset: number (default: 0)
  - country: string (optional)
  - type: 'vtc' | 'wmts' | 'wms' (optional)
  - active: boolean (optional)

Response:
{
  "data": [MapConfig[]],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### 2. Get Configuration by ID
```http
GET /api/config/:id

Response: MapConfig | null
```

#### 3. Create Configuration
```http
POST /api/config
Content-Type: application/json

Body:
{
  "name": "osm-bright-custom",
  "label": "Custom OSM Bright Style",
  "type": "vtc",
  "style": "https://api.maptiler.com/maps/bright/style.json",
  "country": "Global",
  "flag": "🌍",
  "metadata": {
    "attribution": "OpenStreetMap contributors",
    "maxzoom": 18
  }
}

Response: MapConfig
```

#### 4. Update Configuration
```http
PUT /api/config/:id
Content-Type: application/json

Body: Partial<MapConfig>
Response: MapConfig
```

#### 5. Delete Configuration
```http
DELETE /api/config/:id
Response: { "success": boolean }
```

#### 6. Duplicate Configuration
```http
POST /api/config/duplicate
Content-Type: application/json

Body:
{
  "sourceId": "uuid",
  "type": "exact" | "country" | "template" | "merge",
  "newName": "new-config-name",
  "newLabel": "New Configuration Label",
  "description": "Duplication description",
  "targetCountry": "Germany",
  "options": {
    "copyApiKeys": true,
    "copyPermissions": false,
    "copyTags": true,
    "createBackup": true
  }
}

Response: MapConfig
```

#### 7. Search Configurations
```http
GET /api/config/search
Query Parameters:
  - q: string (search query)
  - type: 'vtc' | 'wmts' | 'wms' (optional)
  - country: string (optional)

Response: MapConfig[]
```

### Map Discovery API

#### AI-Powered Map Search
```http
POST /api/search-maps
Content-Type: application/json

Body:
{
  "query": "Find topographic maps for hiking in Switzerland",
  "maxResults": 15,
  "mapTypes": ["vtc", "wmts"],
  "regions": ["Switzerland", "Alps"]
}

Response:
{
  "maps": [
    {
      "name": "swiss-topo-hiking",
      "label": "Swiss Topo Hiking Maps",
      "type": "wmts",
      "url": "https://wmts.geo.admin.ch",
      "styleUrl": null,
      "country": "Switzerland",
      "flag": "🇨🇭",
      "provider": "swisstopo",
      "confidence": 0.92,
      "validation": {
        "status": "valid",
        "tests": {
          "availability": true,
          "cors": true,
          "format": true,
          "geographic": true
        },
        "errors": [],
        "warnings": []
      }
    }
  ],
  "searchMetadata": {
    "query": "Find topographic maps for hiking in Switzerland",
    "timestamp": "2024-08-30T12:00:00Z",
    "sources": ["swisstopo", "OpenStreetMap", "government portals"],
    "totalFound": 1
  }
}
```

### Validation API

#### Single Map Validation
```http
POST /api/validate
Content-Type: application/json

Body:
{
  "url": "https://api.maptiler.com/maps/streets/style.json",
  "type": "vtc"
}

Response:
{
  "id": "validation-uuid",
  "status": "valid" | "invalid" | "warning" | "pending" | "error",
  "message": "Validation completed successfully",
  "tests": {
    "availability": true,
    "cors": true,
    "format": true,
    "geographic": true
  },
  "errors": [],
  "warnings": [],
  "timestamp": "2024-08-30T12:00:00Z"
}
```

#### Batch Validation
```http
POST /api/validate/batch
Content-Type: application/json

Body:
{
  "configs": [
    {
      "id": "config-1",
      "url": "https://example.com/service1",
      "type": "wmts"
    },
    {
      "id": "config-2", 
      "url": "https://example.com/service2",
      "type": "vtc"
    }
  ]
}

Response:
{
  "id": "batch-uuid",
  "type": "validate",
  "targetIds": ["config-1", "config-2"],
  "status": "pending" | "running" | "completed" | "failed",
  "progress": 0, // 0-100
  "results": [
    {
      "targetId": "config-1",
      "success": true,
      "message": "Validation completed"
    }
  ],
  "startedAt": "2024-08-30T12:00:00Z",
  "completedAt": "2024-08-30T12:01:00Z"
}
```

### Proxy API

#### Style Proxy (CORS handling)
```http
GET /api/proxy/style
Query Parameters:
  - url: string (encoded style URL)

Response: MapLibre Style JSON
```

#### Tile Proxy
```http
GET /api/proxy/tile/{z}/{x}/{y}
Query Parameters:
  - url: string (encoded tile URL pattern)
  - format: 'png' | 'jpg' | 'webp' | 'pbf' (optional)

Response: Tile data (binary)
```

## Error Handling

### Standard Error Response
```typescript
interface ApiError {
  error: string;
  message?: string;
  statusCode: number;
  timestamp?: string;
  path?: string;
  details?: Record<string, any>;
}
```

### Common Error Codes
- **400**: Bad Request - Invalid request parameters
- **401**: Unauthorized - Invalid or missing authentication
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **409**: Conflict - Duplicate name or constraint violation
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server-side error
- **503**: Service Unavailable - External service unavailable

## Rate Limiting

### Current Limits
- **API Requests**: 100 requests per minute per IP
- **Claude AI Calls**: 10 discovery requests per minute per user
- **Validation Requests**: 50 validations per minute per user
- **Bulk Operations**: 5 batch operations per minute per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhook Support (Planned)

### Event Types
```typescript
interface WebhookEvent {
  type: 'config.created' | 'config.updated' | 'config.deleted' | 
        'validation.completed' | 'discovery.completed';
  data: MapConfig | ValidationStatus | DiscoveredMap[];
  timestamp: string;
  user?: string;
}
```

### Webhook Configuration
```http
POST /api/webhooks
Content-Type: application/json

Body:
{
  "url": "https://your-app.com/webhooks/map-config",
  "events": ["config.created", "config.updated"],
  "secret": "webhook-secret-key"
}
```

This API provides comprehensive access to all map configuration management features with proper authentication, validation, and error handling.