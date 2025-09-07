#!/usr/bin/env node

const fs = require('fs');

// Read current basemap8.json
const currentBasemap = JSON.parse(fs.readFileSync('/Users/michael/Development/basemap/basemap8.json', 'utf8'));

// Update the esri source to use direct tiles instead of TileJSON URL
currentBasemap.sources.esri = {
  "type": "vector",
  "tiles": [
    "https://mapsneu.wien.gv.at/basemapv/bmapv/3857/tile/{z}/{y}/{x}.pbf"
  ],
  "minzoom": 0,
  "maxzoom": 23  // Increased from 16 to match the HL source
};

// Write the updated style
fs.writeFileSync('/Users/michael/Development/basemap/basemap8.json', JSON.stringify(currentBasemap, null, 2));

console.log('Successfully updated esri source configuration');
console.log('- Changed from TileJSON URL to direct tiles');
console.log('- Updated maxzoom from 16 to 23');
console.log(`- Total sources: ${Object.keys(currentBasemap.sources).length}`);
console.log(`- Total layers: ${currentBasemap.layers.length}`);