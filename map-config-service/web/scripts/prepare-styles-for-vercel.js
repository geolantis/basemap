#!/usr/bin/env node
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const BASEMAP_REPO = '/Users/michael/Development/basemap';
const PUBLIC_STYLES_DIR = resolve(process.cwd(), 'public/styles');

// Style files to copy
const STYLE_FILES = [
  'basemap.json',
  'basemap2.json',
  'basemap3.json',
  'basemap4.json',
  'basemap5.json',
  'basemap6.json',
  'basemap7.json',
  'bm.json',
  'basemap-at-new.json',
  'basemap-ortho.json',
  'basemap-ortho-blue.json',
  'basemapktn-ortho.json',
  'kataster.json',
  'kataster-bev.json',
  'kataster-bev2.json',
  'kataster-light.json',
  'kataster-ortho.json',
  'bev-katasterlight.json',
  'ovl-kataster.json',
  'grundstuecke_kataster-ktn-light.json',
  'agraratlas.json',
  'nz-basemap-topographic.json'
];

console.log('📦 Preparing styles for Vercel deployment...\n');

// Create public/styles directory if it doesn't exist
if (!existsSync(PUBLIC_STYLES_DIR)) {
  mkdirSync(PUBLIC_STYLES_DIR, { recursive: true });
  console.log('✅ Created public/styles directory');
}

let copied = 0;
let failed = 0;

// Copy each style file
for (const file of STYLE_FILES) {
  const sourcePath = join(BASEMAP_REPO, file);
  const destPath = join(PUBLIC_STYLES_DIR, file);
  
  if (existsSync(sourcePath)) {
    try {
      copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file}`);
      copied++;
    } catch (err) {
      console.error(`❌ Failed to copy ${file}: ${err.message}`);
      failed++;
    }
  } else {
    console.warn(`⚠️  File not found: ${file}`);
    failed++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`✅ Successfully copied: ${copied} files`);
if (failed > 0) {
  console.log(`❌ Failed/Not found: ${failed} files`);
}

console.log('\n📝 Next steps for Vercel deployment:');
console.log('1. Run this script before building: npm run prepare:styles');
console.log('2. Commit the public/styles directory');
console.log('3. Deploy to Vercel: vercel --prod');
console.log('4. Update environment variables in Vercel dashboard');
console.log('\n✨ Styles will be available at: https://your-app.vercel.app/styles/[style-name].json');