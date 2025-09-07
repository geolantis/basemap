#!/usr/bin/env node

const fs = require('fs');

// Read current basemap8.json
const currentBasemap = JSON.parse(fs.readFileSync('/Users/michael/Development/basemap/basemap8.json', 'utf8'));

// Update the esri source to have consistent zoom levels
currentBasemap.sources.esri = {
  "type": "vector",
  "tiles": [
    "https://mapsneu.wien.gv.at/basemapv/bmapv/3857/tile/{z}/{y}/{x}.pbf"
  ],
  "minzoom": 0,
  "maxzoom": 23,  // Match the HL source maxzoom
  "bounds": [
    8.8587,
    45.7823,
    17.1608,
    49.5752
  ]
};

// Also ensure all sources have consistent configurations
currentBasemap.sources["basemap-source"].maxzoom = 23;  // Update raster maxzoom too

// Write the updated style
fs.writeFileSync('/Users/michael/Development/basemap/basemap8.json', JSON.stringify(currentBasemap, null, 2));

console.log('Successfully fixed zoom levels');
console.log('All sources now have maxzoom: 23');
console.log(`Total layers: ${currentBasemap.layers.length}`);