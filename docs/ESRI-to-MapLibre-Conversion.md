# ESRI to MapLibre Style Conversion Guide

## Overview

This guide explains how to convert ESRI ArcGIS Vector Tile styles to MapLibre GL compatible formats, specifically addressing the issue of relative paths that MapLibre doesn't support.

## The Problem

ESRI vector tile styles often use relative paths for resources:
- **Sprites:** `../sprites/sprite`
- **Fonts (Glyphs):** `../fonts/{fontstack}/{range}.pbf`
- **Tiles:** `../../{z}/{y}/{x}.pbf`

MapLibre GL JS requires absolute URLs for these resources, as it doesn't resolve relative paths the same way ESRI clients do.

## The Solution

The conversion process involves:

1. **Converting relative paths to absolute URLs**
2. **Mapping ESRI-specific fonts to web-compatible fonts**
3. **Adjusting layer properties for MapLibre compatibility**
4. **Updating source references**

## Key Conversions

### 1. URL Path Conversions

```javascript
// ESRI (relative paths)
{
  "sprite": "../sprites/sprite",
  "glyphs": "../fonts/{fontstack}/{range}.pbf"
}

// MapLibre (absolute URLs)
{
  "sprite": "https://portal.spatial.nsw.gov.au/.../resources/sprites/sprite",
  "glyphs": "https://portal.spatial.nsw.gov.au/.../resources/fonts/{fontstack}/{range}.pbf"
}
```

### 2. Font Mapping

ESRI styles often use proprietary fonts that need to be mapped to web-compatible alternatives:

```javascript
// ESRI fonts → MapLibre fonts
{
  "Public Sans Regular": ["Open Sans Regular", "Noto Sans Regular"],
  "Public Sans Bold": ["Open Sans Bold", "Noto Sans Bold"],
  // ... more mappings
}
```

### 3. Source Configuration

```javascript
// ESRI source
{
  "esri": {
    "type": "vector",
    "bounds": [...],
    "minzoom": 3,
    "maxzoom": 20
  }
}

// MapLibre source (with tiles URL)
{
  "nsw-basemap": {
    "type": "vector",
    "tiles": ["https://portal.spatial.nsw.gov.au/.../tile/{z}/{y}/{x}.pbf"],
    "bounds": [...],
    "minzoom": 3,
    "maxzoom": 20,
    "scheme": "xyz"  // Added for MapLibre
  }
}
```

## Usage

### Automated Conversion

Use the provided converter script:

```bash
# Convert NSW Basemap
node scripts/convert-nsw-basemap.js

# Convert any ESRI style
node scripts/esri-to-maplibre-converter.js <style-url> <output-file>
```

### Manual Integration in MapLibre

```javascript
// Option 1: Use the converted style file
const map = new maplibregl.Map({
  container: 'map',
  style: 'converted-styles/nsw-basemap-streets.json',
  center: [151.2093, -33.8688],
  zoom: 10
});

// Option 2: Convert on-the-fly
async function loadESRIStyle(esriStyleUrl) {
  const response = await fetch(esriStyleUrl);
  const esriStyle = await response.json();
  
  // Convert relative URLs to absolute
  const baseUrl = esriStyleUrl.replace(/\/styles\/.*$/, '');
  
  esriStyle.sprite = `${baseUrl}/sprites/sprite`;
  esriStyle.glyphs = `${baseUrl}/fonts/{fontstack}/{range}.pbf`;
  
  // Update source tiles URL
  if (esriStyle.sources.esri) {
    esriStyle.sources.esri.tiles = [
      `${baseUrl.replace('/resources', '')}/tile/{z}/{y}/{x}.pbf`
    ];
  }
  
  return esriStyle;
}
```

## Common Issues and Solutions

### Issue 1: Font Loading Errors

**Problem:** Fonts fail to load due to CORS or missing font files.

**Solution:** 
- Use fallback fonts that are widely available
- Host your own font files with proper CORS headers
- Use a font service like Fontsource or OpenMapTiles fonts

### Issue 2: Sprite Loading Errors

**Problem:** Sprites fail to load due to incorrect paths.

**Solution:**
- Ensure sprite URL points to the base name (without extension)
- MapLibre will automatically append `.json` and `.png`
- Check CORS headers on the sprite hosting server

### Issue 3: Tile Loading Issues

**Problem:** Vector tiles don't load or display incorrectly.

**Solution:**
- Verify the tile URL template is correct
- Check authentication requirements
- Ensure the `source-layer` names in styles match the actual tile layers

### Issue 4: Layer Visibility

**Problem:** Some layers don't appear in MapLibre.

**Solution:**
- Check if layer IDs are unique (MapLibre requires unique IDs)
- Verify `source-layer` references are correct
- Check zoom level restrictions (`minzoom`, `maxzoom`)

## Example: NSW Basemap Conversion

The NSW Basemap from Spatial NSW is a good example of ESRI to MapLibre conversion:

### Original ESRI Configuration
- **Style URL:** `https://portal.spatial.nsw.gov.au/.../styles/root.json`
- **Relative Paths:** Uses `../sprites/sprite` and `../fonts/{fontstack}/{range}.pbf`
- **187 Layers:** Complex road network styling with multiple zoom levels

### Converted MapLibre Configuration
- **Absolute URLs:** All paths converted to full HTTPS URLs
- **Font Fallbacks:** Public Sans fonts mapped to Open Sans alternatives
- **XYZ Scheme:** Added for proper tile loading
- **Source Renamed:** Changed from "esri" to "nsw-basemap" for clarity

## Performance Considerations

1. **Font Loading:** Consider using a CDN for fonts to improve loading speed
2. **Sprite Optimization:** Compress sprite images for faster loading
3. **Tile Caching:** Implement proper cache headers for vector tiles
4. **Style Simplification:** Remove unused layers for better performance

## Testing

After conversion, test your map with:

1. **Visual Inspection:** Compare with original ESRI rendering
2. **Console Monitoring:** Check for any loading errors
3. **Performance Testing:** Measure tile and resource loading times
4. **Cross-browser Testing:** Verify compatibility across browsers

## Advanced Options

### Custom Font Hosting

```javascript
// Use your own font server
converter.options.glyphsBaseUrl = 'https://your-cdn.com/fonts/{fontstack}/{range}.pbf';
```

### Custom Sprite Hosting

```javascript
// Use your own sprite server
converter.options.spriteBaseUrl = 'https://your-cdn.com/sprites/sprite';
```

### Selective Layer Import

```javascript
// Filter layers during conversion
convertedStyle.layers = esriStyle.layers.filter(layer => 
  layer.type === 'line' || layer.type === 'fill'
);
```

## Resources

- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/)
- [MapLibre Style Specification](https://maplibre.org/maplibre-gl-js-docs/style-spec/)
- [ESRI Vector Tile Specification](https://github.com/Esri/vector-tile-spec)
- [Font Generation Tools](https://github.com/openmaptiles/fonts)

## License

The converter script is provided as-is for educational and development purposes. Always respect the licensing terms of the original data and style providers.