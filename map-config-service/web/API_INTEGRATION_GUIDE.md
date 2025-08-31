# API Integration Guide - Map Configuration Service

## 🚀 Quick Start

Access map configurations from your 3rd party application using our REST API or direct database connection.

## 📋 Table of Contents
- [REST API](#rest-api)
- [Direct Supabase Access](#direct-supabase-access)
- [JavaScript/TypeScript SDK](#javascripttypescript-sdk)
- [Authentication](#authentication)
- [CORS Configuration](#cors-configuration)
- [Webhooks](#webhooks)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

---

## 🌐 REST API

### Base URL
```
Development: http://localhost:5173/api/maps
Production: https://your-domain.vercel.app/api/maps
```

### Endpoints

#### GET /api/maps
Retrieve all map configurations with optional filtering.

**Query Parameters:**
- `country` (string): Filter by country (e.g., "Austria", "Germany", "Global")
- `type` (string): Filter by type ("vtc", "wmts", "wms")
- `search` (string): Search in name, label, or provider
- `limit` (number): Number of results (default: 100)
- `offset` (number): Pagination offset (default: 0)

**Headers:**
```http
X-API-Key: your-api-key-here
Accept: application/json
```

**Response:**
```json
{
  "data": [
    {
      "id": "1",
      "name": "basemap_at_standard",
      "label": "Basemap AT Standard",
      "type": "vtc",
      "style": "https://raw.githubusercontent.com/basemap-at/styles/main/styles/basemap-v2.json",
      "country": "Austria",
      "flag": "🇦🇹",
      "metadata": {
        "provider": "basemap.at",
        "attribution": "© basemap.at"
      }
    }
  ],
  "meta": {
    "total": 94,
    "limit": 100,
    "offset": 0,
    "hasMore": false
  },
  "filters": {
    "country": null,
    "type": null,
    "search": null
  }
}
```

### Example Requests

#### cURL
```bash
# Get all maps
curl -H "X-API-Key: your-api-key" \
  https://your-domain.vercel.app/api/maps

# Filter by country
curl -H "X-API-Key: your-api-key" \
  "https://your-domain.vercel.app/api/maps?country=Austria"

# Search with pagination
curl -H "X-API-Key: your-api-key" \
  "https://your-domain.vercel.app/api/maps?search=satellite&limit=10&offset=0"
```

#### JavaScript/Fetch
```javascript
// Basic fetch
const response = await fetch('https://your-domain.vercel.app/api/maps', {
  headers: {
    'X-API-Key': 'your-api-key'
  }
});
const data = await response.json();

// With filters
const params = new URLSearchParams({
  country: 'Germany',
  type: 'wmts',
  limit: '20'
});

const response = await fetch(`https://your-domain.vercel.app/api/maps?${params}`, {
  headers: {
    'X-API-Key': 'your-api-key'
  }
});
```

#### Python
```python
import requests

# Get all Austrian maps
response = requests.get(
    'https://your-domain.vercel.app/api/maps',
    headers={'X-API-Key': 'your-api-key'},
    params={'country': 'Austria'}
)
maps = response.json()['data']
```

---

## 🔌 Direct Supabase Access

For real-time updates and advanced queries, connect directly to Supabase.

### Connection Details
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### JavaScript Client
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get all active maps
const { data, error } = await supabase
  .from('map_configs')
  .select('*')
  .eq('is_active', true);

// Filter by country
const { data } = await supabase
  .from('map_configs')
  .select('*')
  .eq('country', 'Austria')
  .eq('is_active', true);

// Real-time subscription
const subscription = supabase
  .channel('map-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'map_configs' },
    (payload) => {
      console.log('Map config changed:', payload);
    }
  )
  .subscribe();
```

### SQL Queries
```sql
-- Get all vector tile maps
SELECT * FROM map_configs 
WHERE type = 'vtc' AND is_active = true;

-- Get maps by provider
SELECT * FROM map_configs 
WHERE metadata->>'provider' = 'MapTiler';

-- Count by country
SELECT country, COUNT(*) 
FROM map_configs 
GROUP BY country 
ORDER BY COUNT(*) DESC;
```

---

## 📦 JavaScript/TypeScript SDK

### Installation
```bash
npm install axios
# or
yarn add axios
```

### SDK Class
```typescript
// mapConfigClient.ts
import axios, { AxiosInstance } from 'axios';

interface MapConfig {
  id: string;
  name: string;
  label: string;
  type: 'vtc' | 'wmts' | 'wms';
  style: string;
  country: string;
  flag: string;
  metadata: any;
}

interface MapResponse {
  data: MapConfig[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

class MapConfigClient {
  private client: AxiosInstance;

  constructor(baseURL: string, apiKey: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async getMaps(params?: {
    country?: string;
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<MapResponse> {
    const response = await this.client.get('/api/maps', { params });
    return response.data;
  }

  async getMapById(id: string): Promise<MapConfig> {
    const response = await this.client.get(`/api/maps/${id}`);
    return response.data;
  }

  async getCountries(): Promise<string[]> {
    const response = await this.getMaps();
    const countries = new Set(response.data.map(m => m.country));
    return Array.from(countries);
  }

  async searchMaps(query: string): Promise<MapConfig[]> {
    const response = await this.getMaps({ search: query });
    return response.data;
  }
}

// Usage
const client = new MapConfigClient(
  'https://your-domain.vercel.app',
  'your-api-key'
);

const austrianMaps = await client.getMaps({ country: 'Austria' });
const vectorMaps = await client.getMaps({ type: 'vtc' });
```

---

## 🔐 Authentication

### API Key Authentication
1. Request an API key from the admin
2. Include in all requests:
```http
X-API-Key: your-api-key-here
```

### JWT Authentication (Coming Soon)
```javascript
// Future implementation
const token = await authenticate(email, password);
headers['Authorization'] = `Bearer ${token}`;
```

---

## 🔄 CORS Configuration

### Allowed Origins
Update the API to allow your domain:

```typescript
// In api/maps.ts
const ALLOWED_ORIGINS = [
  'https://your-app.com',
  'https://app.your-domain.com',
  'http://localhost:3000', // Development
];
```

### Development Mode
Set environment variable to allow all origins:
```bash
ALLOW_ALL_ORIGINS=true
```

---

## 🪝 Webhooks (Planned)

### Webhook Events
- `map.created` - New map configuration added
- `map.updated` - Map configuration modified
- `map.deleted` - Map configuration removed
- `map.validated` - Map validation completed

### Webhook Payload
```json
{
  "event": "map.updated",
  "timestamp": "2024-12-30T12:00:00Z",
  "data": {
    "id": "123",
    "changes": {
      "style": {
        "old": "old-url",
        "new": "new-url"
      }
    }
  }
}
```

---

## ⚡ Rate Limiting

- **Default**: 1000 requests per hour
- **Authenticated**: 5000 requests per hour
- **Headers**:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067200
```

---

## 💻 Complete Integration Examples

### React Application
```jsx
// useMapConfigs.js
import { useState, useEffect } from 'react';

function useMapConfigs(country) {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaps() {
      try {
        const params = new URLSearchParams();
        if (country) params.append('country', country);
        
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/maps?${params}`,
          {
            headers: {
              'X-API-Key': process.env.REACT_APP_API_KEY
            }
          }
        );
        
        const data = await response.json();
        setMaps(data.data);
      } catch (error) {
        console.error('Failed to fetch maps:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMaps();
  }, [country]);

  return { maps, loading };
}

// Component
function MapSelector() {
  const { maps, loading } = useMapConfigs('Austria');

  if (loading) return <div>Loading maps...</div>;

  return (
    <select>
      {maps.map(map => (
        <option key={map.id} value={map.style}>
          {map.label}
        </option>
      ))}
    </select>
  );
}
```

### Vue 3 Application
```vue
<template>
  <div>
    <select v-model="selectedMap">
      <option v-for="map in maps" :key="map.id" :value="map">
        {{ map.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const maps = ref([]);
const selectedMap = ref(null);

onMounted(async () => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/maps?country=Germany`,
    {
      headers: {
        'X-API-Key': import.meta.env.VITE_API_KEY
      }
    }
  );
  
  const data = await response.json();
  maps.value = data.data;
});
</script>
```

### Angular Service
```typescript
// map-config.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MapConfigService {
  private apiUrl = environment.apiUrl;
  private apiKey = environment.apiKey;

  constructor(private http: HttpClient) {}

  getMaps(country?: string): Observable<MapConfig[]> {
    const headers = { 'X-API-Key': this.apiKey };
    const params: any = {};
    
    if (country) params.country = country;
    
    return this.http.get<MapResponse>(
      `${this.apiUrl}/api/maps`,
      { headers, params }
    ).pipe(
      map(response => response.data)
    );
  }
}
```

### Node.js Backend
```javascript
// mapService.js
const axios = require('axios');

class MapService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.MAP_API_URL,
      headers: {
        'X-API-Key': process.env.MAP_API_KEY
      }
    });
  }

  async getVectorTileMaps() {
    const { data } = await this.client.get('/api/maps', {
      params: { type: 'vtc' }
    });
    return data.data;
  }

  async getMapsByCountry(country) {
    const { data } = await this.client.get('/api/maps', {
      params: { country }
    });
    return data.data;
  }

  async searchMaps(query) {
    const { data } = await this.client.get('/api/maps', {
      params: { search: query }
    });
    return data.data;
  }
}

module.exports = MapService;
```

---

## 🔧 Environment Variables

### For 3rd Party Apps
```env
# .env
MAP_API_URL=https://your-domain.vercel.app
MAP_API_KEY=your-api-key-here

# For direct Supabase access
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

---

## 📊 Response Formats

### Success Response
```json
{
  "data": [...],
  "meta": {
    "total": 94,
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

### Error Response
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is invalid or expired",
  "code": "AUTH_001"
}
```

---

## 🚀 Production Deployment

1. **Set up API keys** in Vercel environment:
```bash
vercel env add API_KEYS
vercel env add ALLOWED_ORIGINS
```

2. **Configure CORS** for your domains

3. **Enable rate limiting** with Vercel Edge Config

4. **Monitor usage** with Vercel Analytics

---

## 📚 Additional Resources

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)

---

## 🆘 Support

For API access or technical support:
- Email: support@your-domain.com
- Documentation: https://your-domain.com/docs
- GitHub Issues: https://github.com/your-org/map-config-service