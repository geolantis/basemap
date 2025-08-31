import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update all style URLs to use local hosting
function updateStyleUrls() {
  const configPath = path.join(__dirname, '../src/data/mapconfig-full.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  let updateCount = 0;
  
  function updateUrls(obj) {
    if (typeof obj === 'string') {
      return obj;
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string' && obj[key].includes('raw.githubusercontent.com/geolantis/basemap')) {
          const filename = obj[key].split('/').pop();
          // Use relative path that works on any domain
          obj[key] = `/styles/${filename}`;
          console.log(`✅ Updated: ${filename}`);
          updateCount++;
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
  console.log(`\n✅ Configuration updated with local style URLs!`);
  console.log(`📊 Total URLs updated: ${updateCount}`);
}

updateStyleUrls();
