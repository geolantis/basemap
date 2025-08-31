import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Path to the basemap repository with style files
const BASEMAP_REPO_PATH = '/Users/michael/Development/basemap';

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve style files from the private repository
app.get('/api/styles/:styleName', (req, res) => {
  const { styleName } = req.params;
  
  // Add .json extension if not present
  const fileName = styleName.endsWith('.json') ? styleName : `${styleName}.json`;
  
  // Try multiple possible locations
  const possiblePaths = [
    join(BASEMAP_REPO_PATH, fileName),
    join(BASEMAP_REPO_PATH, 'styles', fileName),
    join(__dirname, 'public', 'styles', fileName),
    join(__dirname, 'dist', 'styles', fileName)
  ];
  
  // Find the first existing file
  const filePath = possiblePaths.find(path => existsSync(path));
  
  if (!filePath) {
    return res.status(404).json({ 
      error: `Style '${styleName}' not found`,
      searched: possiblePaths 
    });
  }
  
  try {
    // Read and parse the style JSON
    const styleContent = readFileSync(filePath, 'utf8');
    let styleJson = JSON.parse(styleContent);
    
    // Process the style to update references
    styleJson = processStyleReferences(styleJson, req);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    
    res.json(styleJson);
    
  } catch (error) {
    console.error(`Error reading style ${styleName}:`, error);
    res.status(500).json({ error: 'Failed to read style file' });
  }
});

// List available styles
app.get('/api/styles', (req, res) => {
  const styles = {
    basemaps: [
      { id: 'basemap', name: 'Basemap Austria Standard' },
      { id: 'basemap2', name: 'Basemap Austria v2' },
      { id: 'basemap3', name: 'Basemap Austria v3' },
      { id: 'basemap4', name: 'Basemap Austria v4' },
      { id: 'basemap5', name: 'Basemap Austria v5' },
      { id: 'basemap6', name: 'Basemap Austria v6' },
      { id: 'basemap7', name: 'Basemap Austria v7' },
      { id: 'basemap-at-new', name: 'Basemap Austria New' },
      { id: 'basemap-ortho', name: 'Basemap Orthophoto' },
      { id: 'basemap-ortho-blue', name: 'Basemap Orthophoto Blue' },
      { id: 'bm', name: 'Basemap Minimal' }
    ],
    overlays: [
      { id: 'kataster', name: 'Kataster Standard' },
      { id: 'kataster-bev', name: 'Kataster BEV' },
      { id: 'kataster-bev2', name: 'Kataster BEV v2' },
      { id: 'kataster-light', name: 'Kataster Light' },
      { id: 'kataster-ortho', name: 'Kataster Orthophoto' },
      { id: 'ovl-kataster', name: 'Overlay Kataster' }
    ],
    regional: [
      { id: 'basemapktn-ortho', name: 'Kärnten Orthophoto' },
      { id: 'grundstuecke_kataster-ktn-light', name: 'Grundstücke KTN Light' },
      { id: 'agraratlas', name: 'Agrar Atlas' }
    ]
  };
  
  res.json(styles);
});

// Proxy endpoints - using middleware approach for wildcards
app.use('/proxy/kataster', (req, res) => {
  const tilePath = req.url.substring(1); // Remove leading slash
  const targetUrl = `https://kataster.bev.gv.at/${tilePath}`;
  res.redirect(targetUrl);
});

app.use('/proxy/ktn', (req, res) => {
  const tilePath = req.url.substring(1);
  const targetUrl = `https://gis.ktn.gv.at/${tilePath}`;
  res.redirect(targetUrl);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'map-styles-api' });
});

// Function to process style references
function processStyleReferences(styleJson, req) {
  const processed = { ...styleJson };
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  // Update sources that reference other styles
  if (processed.sources) {
    Object.keys(processed.sources).forEach(sourceId => {
      const source = processed.sources[sourceId];
      
      // If source references another style JSON file
      if (source.url) {
        // Handle relative references like "bm.json"
        if (!source.url.startsWith('http') && source.url.endsWith('.json')) {
          const refStyleName = source.url.replace('.json', '');
          source.url = `${baseUrl}/api/styles/${refStyleName}`;
        }
        // Handle full GitHub URLs that need to be redirected to our API
        else if (source.url.includes('github.com') || source.url.includes('raw.githubusercontent.com')) {
          const match = source.url.match(/([^/]+)\.json$/);
          if (match) {
            const refStyleName = match[1];
            source.url = `${baseUrl}/api/styles/${refStyleName}`;
          }
        }
      }
      
      // Update tile URLs to use proxy if needed
      if (source.tiles) {
        source.tiles = source.tiles.map(tileUrl => {
          if (tileUrl.includes('kataster.bev.gv.at')) {
            const path = tileUrl.replace(/https?:\/\/kataster\.bev\.gv\.at\//, '');
            return `${baseUrl}/proxy/kataster/${path}`;
          }
          if (tileUrl.includes('gis.ktn.gv.at')) {
            const path = tileUrl.replace(/https?:\/\/gis\.ktn\.gv\.at\//, '');
            return `${baseUrl}/proxy/ktn/${path}`;
          }
          return tileUrl;
        });
      }
    });
  }
  
  // Update sprite URLs if needed
  if (processed.sprite && !processed.sprite.startsWith('http')) {
    processed.sprite = `https://kataster.bev.gv.at${processed.sprite}`;
  }
  
  // Update glyphs URLs if needed
  if (processed.glyphs && !processed.glyphs.startsWith('http')) {
    processed.glyphs = `https://kataster.bev.gv.at${processed.glyphs}`;
  }
  
  return processed;
}

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 Map Styles API Server running on http://localhost:${PORT}`);
  console.log(`\n📍 Endpoints:`);
  console.log(`   GET /api/styles           - List all available styles`);
  console.log(`   GET /api/styles/:name     - Get a specific style (e.g., /api/styles/kataster-bev2)`);
  console.log(`   GET /proxy/kataster/*     - Proxy for Kataster tiles`);
  console.log(`   GET /proxy/ktn/*          - Proxy for KTN tiles`);
  console.log(`   GET /health               - Health check`);
  console.log(`\n📁 Serving styles from: ${BASEMAP_REPO_PATH}`);
  console.log(`\n💡 Example usage:`);
  console.log(`   curl http://localhost:${PORT}/api/styles/basemap`);
  console.log(`   curl http://localhost:${PORT}/api/styles/kataster-bev2`);
  console.log(`\n✨ Style references (like basemap7 → bm.json) are automatically resolved!\n`);
});