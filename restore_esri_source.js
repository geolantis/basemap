#!/usr/bin/env node

const fs = require('fs');

// Read current basemap8.json
const currentBasemap = JSON.parse(fs.readFileSync('/Users/michael/Development/basemap/basemap8.json', 'utf8'));

// Read the original backup to get the correct esri source configuration
const originalBasemap = JSON.parse(fs.readFileSync('/Users/michael/Development/basemap/basemap8_backup.json', 'utf8'));

// Restore the original esri source configuration
currentBasemap.sources.esri = originalBasemap.sources.esri;

// Keep the esri-hl source as is
// Keep all layers as they are

// Write the updated style
fs.writeFileSync('/Users/michael/Development/basemap/basemap8.json', JSON.stringify(currentBasemap, null, 2));

console.log('Successfully restored esri source configuration');
console.log('Sources:');
console.log('- basemap-source: raster tiles');
console.log('- esri: restored original vector source with TileJSON URL');
console.log('- esri-hl: vector tiles for HL layers');
console.log(`Total layers: ${currentBasemap.layers.length}`);