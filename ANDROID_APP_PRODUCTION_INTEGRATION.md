# Android App Production Service Integration Guide

## Quick Solution

Your production service is already running at `https://mapconfig.geolantis.com`. To integrate it with your Android app, you need to handle the format difference.

---

## The Format Challenge

### What Your Android App Expects (Legacy Format)
```javascript
{
  "backgroundMaps": {
    "Global": { name, style, label, type, flag, country },
    "Global2": { ... }
  },
  "overlayMaps": {
    "kataster": { ... }
  }
}
```

### What The Production Service Returns (New Format)
```javascript
{
  "version": "2.0.0",
  "timestamp": "2024-01-15T10:00:00Z",
  "configs": [
    { id, name, label, type, style, country, flag, layers, metadata }
  ],
  "total": 123
}
```

---

## Integration Options

## Option 1: Use Legacy Format Parameter (Check if Available)

First, check if the legacy format is supported:

```bash
curl "https://mapconfig.geolantis.com/api/public/mapconfig?format=legacy"
```

If this returns the old format, simply update your Android app:

```javascript
// File: /app/src/main/assets/engine_ml/src/mapConfigLoader.js

// Change line 13 from:
const defaultConfigUrl = 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/mapconfig.json';

// To:
const defaultConfigUrl = 'https://mapconfig.geolantis.com/api/public/mapconfig?format=legacy';
```

---

## Option 2: Add Format Transformation in Your App

If legacy format isn't available, add a transformation layer:

```javascript
// File: /app/src/main/assets/engine_ml/src/mapConfigLoader.js

// Add this transformation function before the loadMapConfig function
function transformNewFormatToLegacy(newFormat) {
  const legacy = {
    backgroundMaps: {},
    overlayMaps: {}
  };
  
  if (newFormat.configs && Array.isArray(newFormat.configs)) {
    newFormat.configs.forEach(config => {
      // Determine if it's a background or overlay map
      const isOverlay = config.name.toLowerCase().includes('overlay') || 
                       config.name.toLowerCase().includes('kataster') ||
                       config.label.toLowerCase().includes('overlay');
      
      // Create legacy entry
      const legacyEntry = {
        name: config.name,
        label: config.label,
        type: config.type,
        style: config.style,
        country: config.country || 'Global',
        flag: config.flag || '🌐'
      };
      
      // Add additional fields if present
      if (config.layers) legacyEntry.layers = config.layers;
      if (config.metadata) legacyEntry.metadata = config.metadata;
      if (config.attribution) legacyEntry.attribution = config.attribution;
      
      // Fix style URLs if they're relative
      if (legacyEntry.style && legacyEntry.style.startsWith('/api/')) {
        legacyEntry.style = 'https://mapconfig.geolantis.com' + legacyEntry.style;
      }
      
      // Use name as key, sanitize it for object key
      const key = config.name.replace(/[^a-zA-Z0-9]/g, '');
      
      if (isOverlay) {
        legacy.overlayMaps[key] = legacyEntry;
      } else {
        legacy.backgroundMaps[key] = legacyEntry;
      }
    });
  }
  
  return legacy;
}

// Update the loadMapConfig function (around line 22)
function loadMapConfig(url = defaultConfigUrl, callback) {
  // ... existing code ...
  
  loadPromise = fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load map configuration: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(config => {
      console.log('Map configuration loaded successfully from remote source');
      
      // CHECK IF TRANSFORMATION IS NEEDED
      if (config.configs && Array.isArray(config.configs)) {
        console.log('Transforming new format to legacy format');
        config = transformNewFormatToLegacy(config);
      }
      
      // Store the configuration globally
      window.mapConfig = config;
      window._mapConfigFullyLoaded = true;
      
      // ... rest of existing code ...
    });
}

// Update the default URL to use production service
const defaultConfigUrl = 'https://mapconfig.geolantis.com/api/public/mapconfig';
```

---

## Option 3: Create a Legacy Endpoint Wrapper

If you control the production service, add a legacy format endpoint:

```javascript
// In your production service API
app.get('/api/public/mapconfig/legacy', async (req, res) => {
  try {
    // Fetch the new format data
    const newFormat = await getMapConfigs();
    
    // Transform to legacy format
    const legacy = {
      backgroundMaps: {},
      overlayMaps: {}
    };
    
    newFormat.configs.forEach(config => {
      const isOverlay = config.name.toLowerCase().includes('overlay') || 
                       config.name.toLowerCase().includes('kataster');
      
      const entry = {
        name: config.name,
        label: config.label,
        type: config.type,
        style: config.style.startsWith('/') ? 
               `https://mapconfig.geolantis.com${config.style}` : 
               config.style,
        country: config.country || 'Global',
        flag: config.flag || '🌐',
        layers: config.layers || [],
        metadata: config.metadata
      };
      
      const key = config.name.replace(/[^a-zA-Z0-9]/g, '');
      
      if (isOverlay) {
        legacy.overlayMaps[key] = entry;
      } else {
        legacy.backgroundMaps[key] = entry;
      }
    });
    
    res.json(legacy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate legacy format' });
  }
});
```

---

## Minimal Change Solution (Recommended)

The simplest approach with minimal code changes:

### Step 1: Update the URL
```javascript
// File: /app/src/main/assets/engine_ml/src/mapConfigLoader.js
// Line 13 - change to:
const defaultConfigUrl = 'https://mapconfig.geolantis.com/api/public/mapconfig';
```

### Step 2: Add Format Detection and Transformation
```javascript
// Add this right after line 59 (after return response.json())
.then(config => {
  // Auto-detect and transform if needed
  if (config.configs && !config.backgroundMaps) {
    // New format detected, transform it
    const transformed = {
      backgroundMaps: {},
      overlayMaps: {}
    };
    
    config.configs.forEach(item => {
      const isOverlay = item.name.toLowerCase().includes('overlay') || 
                       item.name.toLowerCase().includes('kataster');
      const maps = isOverlay ? transformed.overlayMaps : transformed.backgroundMaps;
      
      // Fix relative URLs
      if (item.style && item.style.startsWith('/api/')) {
        item.style = 'https://mapconfig.geolantis.com' + item.style;
      }
      
      maps[item.name.replace(/[^a-zA-Z0-9]/g, '')] = item;
    });
    
    return transformed;
  }
  return config;
})
```

---

## Testing the Integration

### 1. Test the Production Endpoint
```bash
# Check what format is returned
curl https://mapconfig.geolantis.com/api/public/mapconfig | jq '.'

# Check if legacy format works
curl "https://mapconfig.geolantis.com/api/public/mapconfig?format=legacy" | jq '.'
```

### 2. Test in Browser Console
```javascript
// Test the transformation
fetch('https://mapconfig.geolantis.com/api/public/mapconfig')
  .then(r => r.json())
  .then(data => {
    console.log('Original:', data);
    
    // Transform
    const legacy = {
      backgroundMaps: {},
      overlayMaps: {}
    };
    
    data.configs.forEach(config => {
      const isOverlay = config.name.includes('Overlay') || 
                       config.name.includes('kataster');
      const target = isOverlay ? legacy.overlayMaps : legacy.backgroundMaps;
      target[config.name.replace(/[^a-zA-Z0-9]/g, '')] = config;
    });
    
    console.log('Transformed:', legacy);
  });
```

### 3. Update and Test Android App
1. Make the code changes
2. Build the Android app
3. Test with production endpoint
4. Verify maps load correctly

---

## Security Considerations

### HTTPS Required
The production service uses HTTPS, which is good. No changes needed for Android network security.

### API Keys
The production service injects API keys server-side, so they're not exposed in the configuration. This is more secure than the GitHub approach.

---

## Rollback Plan

If issues occur, you can quickly rollback:

```javascript
// Temporary fallback to GitHub
const defaultConfigUrl = window.USE_GITHUB_FALLBACK ? 
  'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/mapconfig.json' :
  'https://mapconfig.geolantis.com/api/public/mapconfig';
```

---

## Benefits of Using Production Service

1. **API Key Security**: Keys are injected server-side, not exposed in JSON
2. **Better Performance**: Cached responses (1 hour cache)
3. **Admin Portal**: Manage configurations at https://mapconfig.geolantis.com/login
4. **Monitoring**: Track usage and errors
5. **No GitHub Dependency**: Service remains available even if GitHub is down
6. **Dynamic Updates**: Change configurations without app updates

---

## Complete Integration Code

Here's the complete updated `mapConfigLoader.js` with all changes:

```javascript
// mapConfigLoader.js - Updated for production service
(function() {
    let loadPromise = null;
    
    // Use production service
    const defaultConfigUrl = 'https://mapconfig.geolantis.com/api/public/mapconfig';
    
    // Transform new format to legacy if needed
    function transformToLegacy(data) {
      if (data.configs && !data.backgroundMaps) {
        const legacy = {
          backgroundMaps: {},
          overlayMaps: {}
        };
        
        data.configs.forEach(config => {
          // Fix relative URLs
          if (config.style && config.style.startsWith('/api/')) {
            config.style = 'https://mapconfig.geolantis.com' + config.style;
          }
          
          // Categorize maps
          const isOverlay = config.name.toLowerCase().includes('overlay') || 
                           config.name.toLowerCase().includes('kataster');
          const target = isOverlay ? legacy.overlayMaps : legacy.backgroundMaps;
          
          // Use sanitized name as key
          const key = config.name.replace(/[^a-zA-Z0-9]/g, '');
          target[key] = config;
        });
        
        return legacy;
      }
      return data;
    }
    
    function loadMapConfig(url = defaultConfigUrl, callback) {
      // ... existing initialization code ...
      
      loadPromise = fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load: ${response.status}`);
          }
          return response.json();
        })
        .then(config => {
          // Transform if needed
          config = transformToLegacy(config);
          
          console.log('Map configuration loaded from production service');
          window.mapConfig = config;
          window._mapConfigFullyLoaded = true;
          
          if (typeof callback === 'function' && !window._callbackCalled) {
            callback(config);
            window._callbackCalled = true;
          }
          
          const event = new CustomEvent('mapconfig:loaded', { 
            detail: { config: config } 
          });
          document.dispatchEvent(event);
          
          return config;
        })
        .catch(error => {
          console.error('Error loading from production:', error);
          // ... existing fallback code ...
        });
      
      return loadPromise;
    }
    
    // ... rest of existing code ...
    
    window.loadMapConfig = loadMapConfig;
    window.getMapConfig = getMapConfig;
    window.isMapConfigLoaded = isConfigLoaded;
    window.reloadMapConfig = reloadMapConfig;
    
    // Auto-load on script inclusion
    loadMapConfig();
})();
```

---

## Summary

To use your production service at `https://mapconfig.geolantis.com`:

1. **Update the URL** in `mapConfigLoader.js` to point to the production service
2. **Add format transformation** to convert from new format to legacy format
3. **Fix relative style URLs** to be absolute URLs
4. **Test thoroughly** before deploying to production

The key advantage is that you now have a managed, secure service with API key injection, caching, and an admin portal for configuration management.