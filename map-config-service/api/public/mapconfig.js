/**
 * API endpoint for serving map configuration
 * This serves the configuration data that map engines consume
 */

const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the mapconfig file
    const configPath = path.join(process.cwd(), 'web/src/data/mapconfig-full.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    // Check for format parameter (for future compatibility)
    const format = req.query.format || 'legacy';
    
    if (format === 'legacy') {
      // Return the configuration as-is for legacy format
      return res.status(200).json(config);
    } else {
      // Could support other formats in the future
      return res.status(200).json(config);
    }
  } catch (error) {
    console.error('Error reading map configuration:', error);
    
    // Return a minimal fallback configuration if the file can't be read
    const fallbackConfig = {
      backgroundMaps: {
        "OpenStreetMap": {
          "name": "OpenStreetMap",
          "tiles": [
            "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
          ],
          "attribution": "© OpenStreetMap contributors",
          "maxzoom": 19,
          "tileSize": 256
        }
      },
      overlayMaps: {}
    };
    
    return res.status(200).json(fallbackConfig);
  }
}