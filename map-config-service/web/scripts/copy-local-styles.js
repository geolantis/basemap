#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the source and destination directories
const sourceDir = '/Users/michael/Development/basemap';
const destDir = path.join(__dirname, '../public/styles');

// List of style files we need to copy (extracted from the configuration)
const styleFiles = [
  'osmliberty.json',
  'maptiler3d.json',
  'basemap-ortho.json',
  'basemapktn-ortho.json',
  'kataster-light.json',
  'kataster-ortho.json',
  'basemap-ortho-blue.json',
  'bev-katasterlight.json',
  'basemap-at-new.json',
  'agraratlas.json',
  'basemap2.json',
  'basemap3.json',
  'basemap7.json',
  'de_brandenburg.json',
  'plan_ign.json',
  'nz-basemap-topographic.json',
  'nz-topolite-ortho.json',
  'nzortho.json',
  'kiinteistojaotus-taustakartalla.json',
  'kataster.json',
  'kataster-bev2.json',
  'kataster-bev.json',
  'grundstuecke_kataster-ktn-light.json',
  'ovl-kataster.json',
  'nz-parcels.json'
];

console.log('📦 Copying Style Files from Local Repository');
console.log('============================================\n');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`✅ Created directory: ${destDir}\n`);
}

let copiedCount = 0;
let missingCount = 0;
const missingFiles = [];

// Copy each style file
styleFiles.forEach(filename => {
  const sourcePath = path.join(sourceDir, filename);
  const destPath = path.join(destDir, filename);
  
  if (fs.existsSync(sourcePath)) {
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied: ${filename}`);
      copiedCount++;
    } catch (error) {
      console.error(`❌ Error copying ${filename}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  Missing: ${filename}`);
    missingFiles.push(filename);
    missingCount++;
  }
});

console.log('\n📊 Summary');
console.log('----------');
console.log(`✅ Successfully copied: ${copiedCount} files`);
console.log(`⚠️  Missing files: ${missingCount}`);

if (missingFiles.length > 0) {
  console.log('\n⚠️  Missing Files:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
  
  // Try to find similar files
  console.log('\n🔍 Searching for similar files...');
  const allFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));
  
  missingFiles.forEach(missing => {
    const similar = allFiles.filter(f => 
      f.toLowerCase().includes(missing.split('.')[0].toLowerCase()) ||
      missing.toLowerCase().includes(f.split('.')[0].toLowerCase())
    );
    if (similar.length > 0) {
      console.log(`   ${missing} might be: ${similar.join(', ')}`);
    }
  });
}

console.log('\n✅ Style files copied to public/styles directory!');
console.log('   Next step: Run "node scripts/update-style-urls.js" to update configuration');