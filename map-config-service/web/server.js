import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { readFileSync, existsSync, writeFileSync, readdirSync, mkdirSync, statSync, unlinkSync } from 'fs';
import { resolve, join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Custom styles storage path
const CUSTOM_STYLES_PATH = join(__dirname, 'public', 'custom-styles');

// Ensure custom-styles directory exists
if (!existsSync(CUSTOM_STYLES_PATH)) {
  mkdirSync(CUSTOM_STYLES_PATH, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CUSTOM_STYLES_PATH);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const originalName = file.originalname.replace('.json', '');
    const filename = `${originalName}-${timestamp}-${randomSuffix}.json`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept JSON files
    if (file.mimetype === 'application/json' || extname(file.originalname).toLowerCase() === '.json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'), false);
    }
  }
});

// Path to the basemap repository with style files
const BASEMAP_REPO_PATH = '/Users/michael/Development/basemap';

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Function to validate Mapbox/MapLibre style
function validateMapboxStyle(styleObject) {
  try {
    // Basic required properties for a valid Mapbox style
    const requiredFields = ['version', 'sources', 'layers'];
    const missingFields = requiredFields.filter(field => !(field in styleObject));
    
    if (missingFields.length > 0) {
      return { valid: false, error: `Missing required fields: ${missingFields.join(', ')}` };
    }

    // Check version is supported
    if (typeof styleObject.version !== 'number' || styleObject.version < 8) {
      return { valid: false, error: 'Style version must be 8 or higher' };
    }

    // Check sources is an object
    if (typeof styleObject.sources !== 'object' || Array.isArray(styleObject.sources)) {
      return { valid: false, error: 'Sources must be an object' };
    }

    // Check layers is an array
    if (!Array.isArray(styleObject.layers)) {
      return { valid: false, error: 'Layers must be an array' };
    }

    // Validate each layer has required properties
    for (let i = 0; i < styleObject.layers.length; i++) {
      const layer = styleObject.layers[i];
      if (!layer.id || !layer.type) {
        return { valid: false, error: `Layer ${i} missing required 'id' or 'type' property` };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Style validation error: ${error.message}` };
  }
}

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

// Upload style endpoint - MUST come before the dynamic :styleName route
app.post('/api/styles/upload', upload.single('style'), (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a JSON file.'
      });
    }

    // Read and parse the uploaded file
    let styleContent;
    let styleObject;
    
    try {
      styleContent = readFileSync(req.file.path, 'utf8');
      styleObject = JSON.parse(styleContent);
    } catch (parseError) {
      // Clean up the uploaded file if JSON parsing fails
      try {
        unlinkSync(req.file.path);
      } catch {}
      
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON file. Please ensure the file contains valid JSON.'
      });
    }

    // Validate the style
    const validation = validateMapboxStyle(styleObject);
    if (!validation.valid) {
      // Clean up the uploaded file if validation fails
      try {
        unlinkSync(req.file.path);
      } catch {}
      
      return res.status(400).json({
        success: false,
        error: `Invalid Mapbox/MapLibre style: ${validation.error}`
      });
    }

    // Generate the public URL and unique ID
    const filename = req.file.filename;
    const id = filename.replace('.json', '');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const publicUrl = `${baseUrl}/custom-styles/${filename}`;

    console.log(`✅ Successfully uploaded style: ${filename}`);

    // Return success response
    res.json({
      success: true,
      url: publicUrl,
      id: id,
      filename: filename,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up the uploaded file if there was an error
    if (req.file && req.file.path) {
      try {
        unlinkSync(req.file.path);
      } catch {}
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during upload'
    });
  }
});

// List uploaded custom styles - MUST come before the dynamic :styleName route
app.get('/api/styles/custom', (req, res) => {
  try {
    if (!existsSync(CUSTOM_STYLES_PATH)) {
      return res.json({ customStyles: [] });
    }

    const files = readdirSync(CUSTOM_STYLES_PATH)
      .filter(file => file.endsWith('.json'))
      .map(filename => {
        const filepath = join(CUSTOM_STYLES_PATH, filename);
        const stats = statSync(filepath);
        const id = filename.replace('.json', '');
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // Try to read style name from the file
        let styleName = filename;
        try {
          const content = readFileSync(filepath, 'utf8');
          const style = JSON.parse(content);
          styleName = style.name || filename.replace('.json', '').split('-')[0];
        } catch {}

        return {
          id,
          filename,
          name: styleName,
          url: `${baseUrl}/custom-styles/${filename}`,
          size: stats.size,
          uploadedAt: stats.ctime.toISOString(),
          modifiedAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)); // Sort by upload date, newest first

    res.json({ customStyles: files });
    
  } catch (error) {
    console.error('Error listing custom styles:', error);
    res.status(500).json({
      error: 'Failed to list custom styles'
    });
  }
});

// Serve style files from the private repository - MUST come after specific routes
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

// Serve custom styles statically
app.use('/custom-styles', express.static(CUSTOM_STYLES_PATH, {
  setHeaders: (res, path) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
}));

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum file size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field. Please use the field name "style".'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${error.message}`
    });
  }
  
  if (error.message === 'Only JSON files are allowed') {
    return res.status(400).json({
      success: false,
      error: 'Only JSON files are allowed. Please upload a .json file.'
    });
  }
  
  // Pass other errors to Express default handler
  next(error);
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
  console.log(`   GET  /api/styles           - List all available styles`);
  console.log(`   GET  /api/styles/:name     - Get a specific style (e.g., /api/styles/kataster-bev2)`);
  console.log(`   POST /api/styles/upload    - Upload custom Maputnik style (multipart/form-data)`);
  console.log(`   GET  /api/styles/custom    - List uploaded custom styles`);
  console.log(`   GET  /custom-styles/:file  - Serve uploaded custom style files`);
  console.log(`   GET  /proxy/kataster/*     - Proxy for Kataster tiles`);
  console.log(`   GET  /proxy/ktn/*          - Proxy for KTN tiles`);
  console.log(`   GET  /health               - Health check`);
  console.log(`\n📁 Serving styles from: ${BASEMAP_REPO_PATH}`);
  console.log(`📁 Custom styles stored in: ${CUSTOM_STYLES_PATH}`);
  console.log(`\n💡 Example usage:`);
  console.log(`   curl http://localhost:${PORT}/api/styles/basemap`);
  console.log(`   curl http://localhost:${PORT}/api/styles/kataster-bev2`);
  console.log(`   curl -X POST -F "style=@my-style.json" http://localhost:${PORT}/api/styles/upload`);
  console.log(`   curl http://localhost:${PORT}/api/styles/custom`);
  console.log(`\n✨ Features:`);
  console.log(`   • Style references (like basemap7 → bm.json) are automatically resolved`);
  console.log(`   • Custom style uploads with validation (max 10MB, JSON only)`);
  console.log(`   • Mapbox/MapLibre style validation`);
  console.log(`   • Automatic file cleanup on validation errors`);
  console.log(`   • Unique filename generation with timestamps\n`);
});