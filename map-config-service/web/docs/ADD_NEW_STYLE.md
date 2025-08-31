# How to Add a New Map Style

## Overview
Adding a new map style involves:
1. Creating/adding the style JSON file
2. Adding the map configuration to the database
3. Deploying the style file

## Step 1: Prepare Your Style File

### Option A: Create a New Style File
Create a new MapLibre GL style JSON file in `public/styles/`:

```json
// public/styles/my-new-style.json
{
  "version": 8,
  "name": "My Custom Style",
  "sources": {
    "my-source": {
      "type": "vector",
      "url": "https://mapconfig.geolantis.com/styles/my-tilejson.json"
      // OR directly specify tiles:
      "tiles": ["https://example.com/tiles/{z}/{x}/{y}.pbf"],
      "minzoom": 0,
      "maxzoom": 14
    },
    "raster-source": {
      "type": "raster",
      "tiles": ["https://example.com/raster/{z}/{x}/{y}.png"],
      "tileSize": 256
    }
  },
  "sprite": "https://example.com/sprite",
  "glyphs": "https://example.com/fonts/{fontstack}/{range}.pbf",
  "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#f0f0f0"
      }
    },
    {
      "id": "my-layer",
      "type": "line",
      "source": "my-source",
      "source-layer": "roads",
      "paint": {
        "line-color": "#333",
        "line-width": 2
      }
    }
  ]
}
```

### Option B: Use an Existing Style
Copy an existing style file to `public/styles/` and modify it.

## Step 2: Fix TileJSON References (if needed)

If your style references external TileJSON files from GitHub, update them:

```bash
# Run the fix script to update GitHub URLs to production URLs
node scripts/fix-tilejson-refs.js
```

## Step 3: Add to Database

### Using the Script (Recommended)

Create a script to add your new map:

```javascript
// scripts/add-new-map.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey);

async function addNewMap() {
  const newMap = {
    name: 'My New Map',
    label: 'My Custom Map Style',
    type: 'vtc', // 'vtc' for vector tiles, 'wmts' for raster, 'wms' for WMS
    style: 'https://mapconfig.geolantis.com/styles/my-new-style.json',
    original_style: null, // Optional: original source URL
    country: 'Austria', // or appropriate country
    flag: '🇦🇹', // Country flag emoji
    layers: null, // Optional: for WMS layers
    metadata: {
      styleUrl: 'https://mapconfig.geolantis.com/styles/my-new-style.json',
      styleName: 'my-new-style',
      description: 'Custom map style for specific use case',
      attribution: '© Your Attribution',
      bounds: [9.47, 46.36, 17.16, 49.02], // [west, south, east, north]
      center: [13.3, 47.7], // [lng, lat]
      zoom: 7, // Default zoom level
      minZoom: 0,
      maxZoom: 18
    },
    version: 1,
    is_active: true
  };

  const { data, error } = await supabase
    .from('map_configs')
    .insert([newMap])
    .select()
    .single();

  if (error) {
    console.error('Error adding map:', error);
  } else {
    console.log('✅ Successfully added map:', data.name);
    console.log('Map ID:', data.id);
    console.log('Preview URL:', `https://mapconfig.geolantis.com/map/${data.id}`);
  }
}

addNewMap().catch(console.error);
```

Run the script:
```bash
node scripts/add-new-map.js
```

### Manual Database Entry

Or add directly via Supabase dashboard:

1. Go to Supabase Dashboard
2. Navigate to `map_configs` table
3. Insert new row with:
   - `name`: Unique name for the map
   - `label`: Display label
   - `type`: 'vtc', 'wmts', or 'wms'
   - `style`: URL to your style JSON
   - `country`: Country name
   - `flag`: Country flag emoji
   - `metadata`: Additional configuration (JSON)

## Step 4: Deploy Style Files

```bash
# Build and deploy to production
npm run build:prod
npx vercel --prod

# Or if using local development
npm run dev
```

## Step 5: Test Your New Map

1. **Check style file is accessible:**
   ```bash
   curl https://mapconfig.geolantis.com/styles/my-new-style.json
   ```

2. **Preview the map:**
   - Go to `https://mapconfig.geolantis.com/discovery`
   - Search for your new map
   - Click Preview

## Example: Adding a Raster/WMTS Map

For raster tiles without a style file:

```javascript
const rasterMap = {
  name: 'Satellite Imagery',
  label: 'High Resolution Satellite',
  type: 'wmts',
  style: 'tiles', // Special value for direct tiles
  country: 'Global',
  flag: '🌍',
  metadata: {
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    ],
    tileSize: 256,
    attribution: '© Esri',
    maxZoom: 19,
    bounds: [-180, -85, 180, 85]
  }
};
```

## Example: Adding a WMS Map

```javascript
const wmsMap = {
  name: 'Weather Radar',
  label: 'Live Weather Radar',
  type: 'wms',
  style: 'tiles',
  country: 'Europe',
  flag: '🇪🇺',
  layers: ['radar_composite'], // WMS layer names
  metadata: {
    url: 'https://weather.example.com/wms',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    crs: 'EPSG:3857',
    attribution: '© Weather Service'
  }
};
```

## Troubleshooting

### Common Issues:

1. **404 on style file**: Make sure file is in `public/styles/` and deployed
2. **CORS errors**: Ensure tile servers have proper CORS headers
3. **GitHub URLs not working**: Run `fix-tilejson-refs.js` script
4. **Map not showing**: Check browser console for errors
5. **RLS blocking updates**: Use service key instead of anon key

### Verify Everything:

```bash
# Test style is accessible
curl -I https://mapconfig.geolantis.com/styles/my-new-style.json

# Check database entry
node -e "
  const { createClient } = require('@supabase/supabase-js');
  // ... fetch and log your map config
"
```

## Quick Add Script Template

Save this as `scripts/quick-add-style.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function quickAddStyle(styleName, mapName, country = 'Austria') {
  // 1. Check style file exists
  const stylePath = path.join('public/styles', `${styleName}.json`);
  try {
    await fs.access(stylePath);
    console.log('✅ Style file found:', stylePath);
  } catch {
    console.error('❌ Style file not found:', stylePath);
    return;
  }

  // 2. Add to database
  const { data, error } = await supabase
    .from('map_configs')
    .insert([{
      name: mapName,
      label: mapName,
      type: 'vtc',
      style: `https://mapconfig.geolantis.com/styles/${styleName}.json`,
      country: country,
      flag: country === 'Austria' ? '🇦🇹' : '🌍',
      metadata: {
        styleUrl: `https://mapconfig.geolantis.com/styles/${styleName}.json`,
        styleName: styleName
      },
      is_active: true
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Added successfully!');
    console.log('Preview at:', `https://mapconfig.geolantis.com/map/${data.id}`);
  }
}

// Usage: node scripts/quick-add-style.js
quickAddStyle('my-new-style', 'My New Map', 'Austria')
  .catch(console.error);
```

---

**Remember to:**
1. Always test locally first
2. Deploy style files before adding to database
3. Use meaningful names and descriptions
4. Include proper attribution
5. Document any special requirements