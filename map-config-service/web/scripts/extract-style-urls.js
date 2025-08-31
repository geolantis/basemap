#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the configuration
const configPath = path.join(__dirname, '../src/data/mapconfig-full.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Extract all unique style URLs from the private repo
const privateRepoUrls = new Set();
const styleMapping = [];

function extractUrls(obj, mapName = '') {
  if (typeof obj === 'string') {
    if (obj.includes('raw.githubusercontent.com/geolantis/basemap')) {
      privateRepoUrls.add(obj);
      const filename = obj.split('/').pop();
      styleMapping.push({
        mapName,
        originalUrl: obj,
        filename,
        newUrl: `/styles/${filename}`
      });
    }
  } else if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      const currentMapName = mapName || value.name || key;
      extractUrls(value, currentMapName);
    });
  }
}

// Process both background and overlay maps
extractUrls(config);

console.log('📊 Style URLs from Private Repository');
console.log('=====================================\n');

console.log(`Total unique style files: ${privateRepoUrls.size}\n`);

// Group by file to see which maps use the same style
const fileUsage = {};
styleMapping.forEach(item => {
  if (!fileUsage[item.filename]) {
    fileUsage[item.filename] = {
      url: item.originalUrl,
      maps: []
    };
  }
  fileUsage[item.filename].maps.push(item.mapName);
});

// Sort by number of maps using each style
const sortedFiles = Object.entries(fileUsage)
  .sort((a, b) => b[1].maps.length - a[1].maps.length);

console.log('Style Files and Usage:');
console.log('----------------------');
sortedFiles.forEach(([filename, data]) => {
  console.log(`\n📄 ${filename}`);
  console.log(`   URL: ${data.url}`);
  console.log(`   Used by ${data.maps.length} map(s): ${data.maps.slice(0, 3).join(', ')}${data.maps.length > 3 ? '...' : ''}`);
});

// Generate download script
const downloadScript = `#!/bin/bash

# Create styles directory
mkdir -p public/styles

# Download all style files from the private repository
# Note: You'll need to be authenticated or do this while the repo is still public

STYLES=(
${Array.from(privateRepoUrls).map(url => `  "${url}"`).join('\n')}
)

for url in "\${STYLES[@]}"; do
  filename=$(basename "$url")
  echo "Downloading $filename..."
  curl -H "Authorization: Bearer $GITHUB_TOKEN" \\
       -H "Accept: application/vnd.github.v3.raw" \\
       -L "$url" \\
       -o "public/styles/$filename"
done

echo "✅ All style files downloaded!"
`;

// Save download script
const scriptPath = path.join(__dirname, 'download-styles.sh');
fs.writeFileSync(scriptPath, downloadScript);
fs.chmodSync(scriptPath, '755');

console.log(`\n✅ Download script created: ${scriptPath}`);
console.log('   Run with: GITHUB_TOKEN=your_token ./scripts/download-styles.sh');

// Generate URL update script
const updateScript = `import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update all style URLs to use local hosting
function updateStyleUrls() {
  const configPath = path.join(__dirname, '../src/data/mapconfig-full.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  function updateUrls(obj) {
    if (typeof obj === 'string') {
      return obj;
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string' && obj[key].includes('raw.githubusercontent.com/geolantis/basemap')) {
          const filename = obj[key].split('/').pop();
          // Use environment variable for base URL in production
          const baseUrl = process.env.PUBLIC_URL || '';
          obj[key] = \`\${baseUrl}/styles/\${filename}\`;
          console.log(\`Updated: \${filename}\`);
        } else if (typeof obj[key] === 'object') {
          updateUrls(obj[key]);
        }
      });
    }
    return obj;
  }
  
  updateUrls(config);
  
  // Save updated configuration
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('\\n✅ Configuration updated with local style URLs!');
}

updateStyleUrls();
`;

// Save update script
const updateScriptPath = path.join(__dirname, 'update-style-urls.js');
fs.writeFileSync(updateScriptPath, updateScript);

console.log(`\n✅ URL update script created: ${updateScriptPath}`);
console.log('   Run with: node scripts/update-style-urls.js');

// Export list of files for reference
const fileList = Array.from(privateRepoUrls).map(url => url.split('/').pop());
const fileListPath = path.join(__dirname, 'style-files.json');
fs.writeFileSync(fileListPath, JSON.stringify({
  totalFiles: fileList.length,
  files: fileList,
  mapping: styleMapping
}, null, 2));

console.log(`\n📋 Complete file list saved to: ${fileListPath}`);

console.log('\n🎯 Next Steps:');
console.log('1. Run the download script to get all style files');
console.log('2. Run the update script to change all URLs');
console.log('3. Deploy to Vercel with the public/styles directory');
console.log('4. Test all maps to ensure styles load correctly');