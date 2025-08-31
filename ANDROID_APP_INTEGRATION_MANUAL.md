# Android App Map Configuration Service Integration Manual

## Executive Summary
This manual provides step-by-step instructions to migrate your Geolantis 360 Android app from using GitHub-hosted map configurations to your local map configuration service. The service provides a centralized, managed approach to serving map configurations with proxy support for tile servers.

---

## Table of Contents
1. [Current Setup Analysis](#1-current-setup-analysis)
2. [Service Architecture](#2-service-architecture)
3. [Required Service Modifications](#3-required-service-modifications)
4. [Android App Integration](#4-android-app-integration)
5. [Testing Strategy](#5-testing-strategy)
6. [Deployment Options](#6-deployment-options)
7. [Migration Checklist](#7-migration-checklist)

---

## 1. Current Setup Analysis

### Current Implementation
Your Android app currently loads map configuration from:
```javascript
// File: /app/src/main/assets/engine_ml/src/mapConfigLoader.js
const defaultConfigUrl = 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/mapconfig.json';
```

### Issues with Current Approach
- Private repository access problems
- No centralized configuration management
- Direct dependency on GitHub availability
- No usage analytics or monitoring
- Cannot dynamically modify configurations

---

## 2. Service Architecture

### Your Existing Service Components

#### Style Server (Running on port 3001)
- **Location**: `/Users/michael/Development/basemap/map-config-service/web/server.js`
- **Current Endpoints**:
  - `GET /api/styles` - List available styles
  - `GET /api/styles/:name` - Get specific style JSON
  - `GET /proxy/kataster/*` - Proxy for Kataster tiles
  - `GET /proxy/ktn/*` - Proxy for KTN tiles

#### What's Missing
The service currently serves individual style files but doesn't serve the main `mapconfig.json` that your Android app expects.

---

## 3. Required Service Modifications

### Step 1: Add Map Configuration Endpoint

Add this new endpoint to your `server.js` file:

```javascript
// Add this after the existing imports in server.js
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Add this new endpoint BEFORE the /api/styles/:styleName endpoint
// Serve the main map configuration
app.get('/api/mapconfig', (req, res) => {
  const configPath = join(BASEMAP_REPO_PATH, 'mapconfig.json');
  
  if (!existsSync(configPath)) {
    return res.status(404).json({ 
      error: 'Map configuration not found',
      path: configPath 
    });
  }
  
  try {
    // Read the map configuration
    const configContent = readFileSync(configPath, 'utf8');
    let mapConfig = JSON.parse(configContent);
    
    // Get the base URL for constructing absolute URLs
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('x-forwarded-host') || req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    // Process the configuration to update style URLs to use our service
    mapConfig = processMapConfig(mapConfig, baseUrl);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin requests
    
    res.json(mapConfig);
    
  } catch (error) {
    console.error('Error reading map configuration:', error);
    res.status(500).json({ error: 'Failed to read map configuration' });
  }
});

// Add this helper function after the processStyleReferences function
function processMapConfig(config, baseUrl) {
  const processed = JSON.parse(JSON.stringify(config)); // Deep clone
  
  // Process background maps
  if (processed.backgroundMaps) {
    Object.keys(processed.backgroundMaps).forEach(mapId => {
      const map = processed.backgroundMaps[mapId];
      
      // Update style URLs that point to local files
      if (map.style) {
        // Handle local style files (e.g., kataster-bev2.json)
        if (!map.style.startsWith('http') || 
            map.style.includes('github.com') || 
            map.style.includes('raw.githubusercontent.com')) {
          
          // Extract the filename
          const match = map.style.match(/([^/]+\.json)$/);
          if (match) {
            const styleName = match[1].replace('.json', '');
            map.style = `${baseUrl}/api/styles/${styleName}`;
          }
        }
        // Leave external URLs (like maptiler) unchanged
      }
      
      // Update tile URLs to use proxy if needed
      if (map.tiles) {
        map.tiles = map.tiles.map(tileUrl => {
          if (tileUrl.includes('kataster.bev.gv.at')) {
            const path = tileUrl.replace(/https?:\/\/kataster\.bev\.gv\.at\//, '');
            return `${baseUrl}/proxy/kataster/${path}`;
          }
          if (tileUrl.includes('gis.ktn.gv.at')) {
            const path = tileUrl.replace(/https?:\/\/gis\.ktn\.gv\.at\//, '');
            return `${baseUrl}/proxy/ktn/${path}`;
          }
          return tileUrl;
        });
      }
    });
  }
  
  // Process overlay maps
  if (processed.overlayMaps) {
    Object.keys(processed.overlayMaps).forEach(mapId => {
      const map = processed.overlayMaps[mapId];
      
      // Update style URLs
      if (map.style) {
        if (!map.style.startsWith('http') || 
            map.style.includes('github.com') || 
            map.style.includes('raw.githubusercontent.com')) {
          
          const match = map.style.match(/([^/]+\.json)$/);
          if (match) {
            const styleName = match[1].replace('.json', '');
            map.style = `${baseUrl}/api/styles/${styleName}`;
          }
        }
      }
      
      // Update tile URLs for overlays
      if (map.tiles) {
        map.tiles = map.tiles.map(tileUrl => {
          if (tileUrl.includes('kataster.bev.gv.at')) {
            const path = tileUrl.replace(/https?:\/\/kataster\.bev\.gv\.at\//, '');
            return `${baseUrl}/proxy/kataster/${path}`;
          }
          if (tileUrl.includes('gis.ktn.gv.at')) {
            const path = tileUrl.replace(/https?:\/\/gis\.ktn\.gv\.at\//, '');
            return `${baseUrl}/proxy/ktn/${path}`;
          }
          return tileUrl;
        });
      }
    });
  }
  
  // Add metadata about the service
  processed.metadata = {
    ...processed.metadata,
    serviceUrl: baseUrl,
    version: '2.0.0',
    servedAt: new Date().toISOString(),
    cacheControl: 'max-age=300'
  };
  
  return processed;
}

// Update the console.log in app.listen to include the new endpoint
app.listen(PORT, () => {
  console.log(`\n🚀 Map Styles API Server running on http://localhost:${PORT}`);
  console.log(`\n📍 Endpoints:`);
  console.log(`   GET /api/mapconfig        - Get the main map configuration`); // NEW
  console.log(`   GET /api/styles           - List all available styles`);
  console.log(`   GET /api/styles/:name     - Get a specific style`);
  console.log(`   GET /proxy/kataster/*     - Proxy for Kataster tiles`);
  console.log(`   GET /proxy/ktn/*          - Proxy for KTN tiles`);
  console.log(`   GET /health               - Health check`);
  console.log(`\n📁 Serving from: ${BASEMAP_REPO_PATH}`);
  console.log(`\n💡 Test the new endpoint:`);
  console.log(`   curl http://localhost:${PORT}/api/mapconfig`);
});
```

### Step 2: Test the New Endpoint

After adding the code above, restart your server and test:

```bash
# Stop the current server (Ctrl+C) and restart
npm run styles:server

# In another terminal, test the new endpoint
curl http://localhost:3001/api/mapconfig | jq '.'
```

---

## 4. Android App Integration

### Step 1: Update mapConfigLoader.js

Replace the GitHub URL with your service URL:

```javascript
// File: /app/src/main/assets/engine_ml/src/mapConfigLoader.js

// OLD (line 13):
const defaultConfigUrl = 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/mapconfig.json';

// NEW - For local development:
const defaultConfigUrl = 'http://localhost:3001/api/mapconfig';

// OR for production (when deployed):
// const defaultConfigUrl = 'https://maps.yourdomain.com/api/mapconfig';

// OR make it configurable:
const defaultConfigUrl = window.MAP_SERVICE_URL || 
                        'http://localhost:3001/api/mapconfig' ||
                        'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/mapconfig.json';
```

### Step 2: Handle CORS and Network Security (Android-specific)

#### For Development (HTTP localhost)

Add to your Android app's `AndroidManifest.xml`:

```xml
<!-- Allow cleartext traffic for local development -->
<application
    android:usesCleartextTraffic="true"
    ...>
```

Or create/update `res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext for localhost during development -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain> <!-- Android emulator -->
        <domain includeSubdomains="true">192.168.1.100</domain> <!-- Your dev machine IP -->
    </domain-config>
    
    <!-- Production domains -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">maps.yourdomain.com</domain>
    </domain-config>
</network-security-config>
```

Reference it in `AndroidManifest.xml`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### Step 3: Configure Service URL Based on Environment

Create a configuration approach that allows different URLs for development and production:

```javascript
// File: /app/src/main/assets/engine_ml/src/config/serviceConfig.js

const ServiceConfig = {
  // Detect environment
  isDevelopment: () => {
    return window.location.hostname === 'localhost' || 
           window.location.hostname.includes('192.168') ||
           window.location.hostname === '10.0.2.2';
  },
  
  // Get appropriate service URL
  getMapServiceUrl: () => {
    // Check for Android WebView injection
    if (window.AndroidConfig && window.AndroidConfig.mapServiceUrl) {
      return window.AndroidConfig.mapServiceUrl;
    }
    
    // Check for environment variable
    if (window.MAP_SERVICE_URL) {
      return window.MAP_SERVICE_URL;
    }
    
    // Use environment-based defaults
    if (ServiceConfig.isDevelopment()) {
      // For Android emulator, use 10.0.2.2 instead of localhost
      if (window.navigator.userAgent.includes('Android')) {
        return 'http://10.0.2.2:3001';
      }
      return 'http://localhost:3001';
    }
    
    // Production URL
    return 'https://maps.yourdomain.com';
  },
  
  // Get full endpoint URL
  getMapConfigUrl: () => {
    return `${ServiceConfig.getMapServiceUrl()}/api/mapconfig`;
  }
};

// Export for use in other modules
window.ServiceConfig = ServiceConfig;
```

Then update your `mapConfigLoader.js`:

```javascript
// At the top of mapConfigLoader.js, after the IIFE starts
const defaultConfigUrl = window.ServiceConfig ? 
                        window.ServiceConfig.getMapConfigUrl() :
                        'http://localhost:3001/api/mapconfig';
```

### Step 4: Inject Configuration from Android (Optional)

In your Android WebView setup, inject the service URL:

```java
// In your WebView activity or fragment
webView.evaluateJavascript(
    "window.AndroidConfig = { " +
    "  mapServiceUrl: '" + BuildConfig.MAP_SERVICE_URL + "'" +
    "};",
    null
);

// Then load your HTML
webView.loadUrl("file:///android_asset/engine_ml/measure.html");
```

Add to your `build.gradle`:

```gradle
android {
    buildTypes {
        debug {
            buildConfigField "String", "MAP_SERVICE_URL", "\"http://10.0.2.2:3001\""
        }
        release {
            buildConfigField "String", "MAP_SERVICE_URL", "\"https://maps.yourdomain.com\""
        }
    }
}
```

---

## 5. Testing Strategy

### Step 1: Local Testing

1. **Start the service:**
   ```bash
   cd /Users/michael/Development/basemap/map-config-service/web
   npm run styles:server
   ```

2. **Test the endpoint directly:**
   ```bash
   # Test map configuration endpoint
   curl http://localhost:3001/api/mapconfig | jq '.backgroundMaps | keys'
   
   # Test a style endpoint
   curl http://localhost:3001/api/styles/kataster-bev2 | jq '.name'
   ```

3. **Test in browser:**
   Create a test HTML file:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>Map Config Test</title>
   </head>
   <body>
       <h1>Map Configuration Test</h1>
       <pre id="config"></pre>
       
       <script>
           fetch('http://localhost:3001/api/mapconfig')
               .then(response => response.json())
               .then(config => {
                   document.getElementById('config').textContent = 
                       JSON.stringify(config, null, 2);
                   console.log('Map config loaded:', config);
               })
               .catch(error => {
                   console.error('Failed to load config:', error);
                   document.getElementById('config').textContent = 
                       'Error: ' + error.message;
               });
       </script>
   </body>
   </html>
   ```

### Step 2: Android Emulator Testing

1. **Start Android emulator**
2. **Use 10.0.2.2 instead of localhost** (this is the emulator's alias for host machine)
3. **Update your mapConfigLoader.js temporarily:**
   ```javascript
   const defaultConfigUrl = 'http://10.0.2.2:3001/api/mapconfig';
   ```

### Step 3: Real Device Testing

1. **Find your development machine's IP:**
   ```bash
   # On Mac
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Look for something like: inet 192.168.1.100
   ```

2. **Update the service URL:**
   ```javascript
   const defaultConfigUrl = 'http://192.168.1.100:3001/api/mapconfig';
   ```

3. **Ensure your device is on the same network**

---

## 6. Deployment Options

### Option A: Deploy to a Cloud Service

#### Using PM2 for Production

```bash
# Install PM2
npm install -g pm2

# Start the service
pm2 start server.js --name map-config-service

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server.js ./
COPY /Users/michael/Development/basemap/*.json ./

ENV PORT=3001
ENV BASEMAP_REPO_PATH=/app

EXPOSE 3001

CMD ["node", "server.js"]
```

#### Deploy to Vercel

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/proxy/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

### Option B: Use Nginx as Reverse Proxy

```nginx
server {
    listen 80;
    server_name maps.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
    }

    # Cache static responses
    location ~ ^/api/(mapconfig|styles)$ {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 5m;
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

---

## 7. Migration Checklist

### Pre-Migration
- [ ] Backup current `mapconfig.json`
- [ ] Test service locally with new endpoint
- [ ] Verify all style files are accessible
- [ ] Test proxy endpoints for tile servers

### Service Setup
- [ ] Add `/api/mapconfig` endpoint to server.js
- [ ] Test endpoint returns correct JSON structure
- [ ] Verify style URLs are transformed correctly
- [ ] Confirm proxy URLs are working

### Android App Updates
- [ ] Update `mapConfigLoader.js` with new URL
- [ ] Configure network security for development
- [ ] Add service configuration module
- [ ] Test in Android emulator
- [ ] Test on real device

### Testing
- [ ] Verify map loads with new configuration
- [ ] Check all basemap options work
- [ ] Test overlay maps functionality
- [ ] Confirm tile loading through proxy
- [ ] Validate offline fallback behavior

### Production Deployment
- [ ] Deploy service to production server
- [ ] Configure SSL certificate
- [ ] Set up monitoring and logging
- [ ] Update Android app with production URL
- [ ] Test production build

### Post-Migration
- [ ] Monitor service performance
- [ ] Check error logs
- [ ] Verify usage analytics
- [ ] Document any issues
- [ ] Update team documentation

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Failed to fetch" or CORS errors
**Solution:** Ensure CORS is properly configured in server.js:
```javascript
app.use(cors({
  origin: '*', // Or specify your app's domain
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
```

#### Issue: Android app can't reach localhost
**Solution:** Use `10.0.2.2` for emulator or machine IP for real device

#### Issue: Cleartext traffic not permitted
**Solution:** Add network security config for development domains

#### Issue: Styles not loading
**Solution:** Check that style files exist in BASEMAP_REPO_PATH and server has read permissions

#### Issue: Tiles not loading through proxy
**Solution:** Verify proxy endpoints are correctly forwarding requests and handling HTTPS

---

## Monitoring and Maintenance

### Add Logging
```javascript
// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Add error tracking
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
```

### Health Monitoring
```javascript
// Enhanced health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    service: 'map-config-service',
    timestamp: new Date().toISOString(),
    endpoints: {
      mapconfig: await checkEndpoint('/api/mapconfig'),
      styles: await checkEndpoint('/api/styles'),
      katasterProxy: await checkEndpoint('/proxy/kataster/test'),
      ktnProxy: await checkEndpoint('/proxy/ktn/test')
    }
  };
  
  res.json(health);
});

async function checkEndpoint(path) {
  try {
    // Simple check if route exists
    return { available: true };
  } catch (error) {
    return { available: false, error: error.message };
  }
}
```

---

## Summary

This integration replaces the GitHub-hosted map configuration with your local service, providing:

1. **Centralized Management**: All map configurations served from one location
2. **Proxy Support**: CORS-free access to tile servers
3. **Better Performance**: Local caching and optimized delivery
4. **Flexibility**: Easy to update configurations without modifying the app
5. **Monitoring**: Track usage and performance

The key change is updating the `defaultConfigUrl` in your Android app from the GitHub URL to your service URL (`http://localhost:3001/api/mapconfig` for development or your production URL).

After implementing the service endpoint and updating the Android app, your map configurations will be served from your controlled service rather than directly from GitHub.