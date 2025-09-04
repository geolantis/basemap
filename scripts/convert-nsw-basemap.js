#!/usr/bin/env node

/**
 * Script to convert NSW Basemap ESRI style to MapLibre format
 */

const ESRIToMapLibreConverter = require('./esri-to-maplibre-converter');
const fs = require('fs');
const path = require('path');

// NSW Basemap style URL
const NSW_BASEMAP_URL = 'https://portal.spatial.nsw.gov.au/vectortileservices/rest/services/Hosted/NSW_BaseMap_VectorTile_Streets/VectorTileServer/resources/styles/root.json?f=pjson';

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../converted-styles');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Output file path
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'nsw-basemap-streets.json');

console.log('Converting NSW Basemap style...');
console.log('Source:', NSW_BASEMAP_URL);
console.log('Output:', OUTPUT_FILE);
console.log('---');

// Create converter with custom options
const converter = new ESRIToMapLibreConverter({
  outputPath: OUTPUT_FILE,
  
  // Optional: Override sprite and glyphs URLs if you want to use different sources
  // spriteBaseUrl: 'https://your-cdn.com/sprites/sprite',
  // glyphsBaseUrl: 'https://your-cdn.com/fonts/{fontstack}/{range}.pbf',
  
  // Font mapping for NSW fonts to common web fonts
  fontMapping: {
    'Public Sans Regular': ['Open Sans Regular', 'Noto Sans Regular', 'Arial Unicode MS Regular'],
    'Public Sans Medium': ['Open Sans SemiBold', 'Noto Sans Medium', 'Arial Unicode MS Bold'],
    'Public Sans Bold': ['Open Sans Bold', 'Noto Sans Bold', 'Arial Unicode MS Bold'],
    'Public Sans Italic': ['Open Sans Italic', 'Noto Sans Italic', 'Arial Unicode MS Regular'],
    'Public Sans Light': ['Open Sans Light', 'Noto Sans Light', 'Arial Unicode MS Regular'],
    'Public Sans SemiBold': ['Open Sans SemiBold', 'Noto Sans SemiBold', 'Arial Unicode MS Bold'],
    'Public Sans ExtraBold': ['Open Sans ExtraBold', 'Noto Sans ExtraBold', 'Arial Unicode MS Bold'],
    'Public Sans Black': ['Open Sans ExtraBold', 'Noto Sans Black', 'Arial Unicode MS Bold'],
    'Public Sans Thin': ['Open Sans Light', 'Noto Sans Thin', 'Arial Unicode MS Regular'],
    // Add any other font mappings needed
  }
});

// Perform the conversion
converter.convertFromUrl(NSW_BASEMAP_URL, OUTPUT_FILE)
  .then(convertedStyle => {
    console.log('\n✅ Conversion completed successfully!');
    console.log(`\nThe converted style has been saved to: ${OUTPUT_FILE}`);
    
    // Generate a simple HTML test file
    const htmlTestFile = path.join(OUTPUT_DIR, 'test-nsw-basemap.html');
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test NSW Basemap</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://unpkg.com/maplibre-gl@4.1.1/dist/maplibre-gl.js"></script>
    <link href="https://unpkg.com/maplibre-gl@4.1.1/dist/maplibre-gl.css" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
    </style>
</head>
<body>
<div id="map"></div>
<script>
    // Load the converted style
    fetch('nsw-basemap-streets.json')
        .then(response => response.json())
        .then(style => {
            const map = new maplibregl.Map({
                container: 'map',
                style: style,
                center: [151.2093, -33.8688], // Sydney
                zoom: 10
            });
            
            map.addControl(new maplibregl.NavigationControl());
            
            map.on('load', () => {
                console.log('Map loaded successfully with converted style');
            });
            
            map.on('error', (e) => {
                console.error('Map error:', e);
            });
        })
        .catch(error => {
            console.error('Failed to load style:', error);
            document.getElementById('map').innerHTML = '<p style="padding:20px">Failed to load style. Check console for errors.</p>';
        });
</script>
</body>
</html>`;
    
    fs.writeFileSync(htmlTestFile, htmlContent);
    console.log(`\nTest HTML file created: ${htmlTestFile}`);
    console.log('\nTo test the converted style:');
    console.log('1. Start a local web server in the converted-styles directory');
    console.log('   For example: npx http-server converted-styles -p 8080');
    console.log('2. Open http://localhost:8080/test-nsw-basemap.html in your browser');
    
    // Print some statistics
    console.log('\n📊 Style Statistics:');
    console.log(`- Layers: ${convertedStyle.layers?.length || 0}`);
    console.log(`- Sources: ${Object.keys(convertedStyle.sources || {}).length}`);
    if (convertedStyle.layers) {
      const layerTypes = {};
      convertedStyle.layers.forEach(layer => {
        layerTypes[layer.type] = (layerTypes[layer.type] || 0) + 1;
      });
      console.log('- Layer types:');
      Object.entries(layerTypes).forEach(([type, count]) => {
        console.log(`  • ${type}: ${count}`);
      });
    }
  })
  .catch(error => {
    console.error('\n❌ Conversion failed:', error.message);
    process.exit(1);
  });