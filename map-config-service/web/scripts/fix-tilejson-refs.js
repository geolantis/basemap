import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixTileJsonReferences() {
  const stylesDir = path.join(__dirname, '..', 'public', 'styles');
  
  console.log('Fixing TileJSON references in style files...\n');
  
  // Get all JSON files in the styles directory
  const files = await fs.readdir(stylesDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  let fixedCount = 0;
  
  for (const file of jsonFiles) {
    const filePath = path.join(stylesDir, file);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const style = JSON.parse(content);
      
      let modified = false;
      
      // Check if this style has sources with GitHub URLs
      if (style.sources) {
        for (const [sourceName, source] of Object.entries(style.sources)) {
          if (source.url && typeof source.url === 'string') {
            // Check if it's a GitHub raw URL
            if (source.url.includes('raw.githubusercontent.com')) {
              const oldUrl = source.url;
              
              // Extract the filename from the URL
              const filename = source.url.split('/').pop();
              
              // Replace with our production URL on Vercel
              // The GitHub files are already deployed on Vercel
              source.url = `https://mapconfig.geolantis.com/styles/${filename}`;
              
              console.log(`Fixed ${file}:`);
              console.log(`  Source: ${sourceName}`);
              console.log(`  Old URL: ${oldUrl}`);
              console.log(`  New URL: ${source.url}`);
              
              modified = true;
              fixedCount++;
            }
          }
        }
      }
      
      // Save the modified file
      if (modified) {
        await fs.writeFile(filePath, JSON.stringify(style, null, 2));
        console.log(`  ✅ Saved\n`);
      }
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`Skipping ${file} - not a style file`);
      } else if (error instanceof SyntaxError) {
        // Not a JSON file or not a style file
        continue;
      } else {
        console.error(`Error processing ${file}:`, error.message);
      }
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Fixed ${fixedCount} TileJSON references`);
  
  // Also copy to dist if it exists
  const distStylesDir = path.join(__dirname, '..', 'dist', 'styles');
  try {
    await fs.access(distStylesDir);
    console.log('\nCopying fixed files to dist/styles...');
    
    for (const file of jsonFiles) {
      const srcPath = path.join(stylesDir, file);
      const destPath = path.join(distStylesDir, file);
      await fs.copyFile(srcPath, destPath);
    }
    
    // Also copy the TileJSON file
    const tileJsonSrc = path.join(stylesDir, 'basemapv-bmapv-3857.json');
    const tileJsonDest = path.join(distStylesDir, 'basemapv-bmapv-3857.json');
    await fs.copyFile(tileJsonSrc, tileJsonDest);
    
    console.log('✅ Copied all files to dist/styles');
  } catch (error) {
    console.log('Note: dist/styles not found (will be created on build)');
  }
}

fixTileJsonReferences().catch(console.error);