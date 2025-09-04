const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "blob:"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https:", "http:"],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["blob:"],
        },
    },
}));

// Enable CORS for API endpoints
app.use(cors());

// Compression
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname)));

// Cache for converted styles (in-memory cache for demo, use Redis in production)
const styleCache = new Map();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Default font mappings
const DEFAULT_FONT_MAPPING = {
    'Public Sans Regular': ['Open Sans Regular', 'Noto Sans Regular', 'Arial Unicode MS Regular'],
    'Public Sans Medium': ['Open Sans SemiBold', 'Noto Sans Medium', 'Arial Unicode MS Bold'],
    'Public Sans Bold': ['Open Sans Bold', 'Noto Sans Bold', 'Arial Unicode MS Bold'],
    'Public Sans Italic': ['Open Sans Italic', 'Noto Sans Italic', 'Arial Unicode MS Regular'],
    'Public Sans Light': ['Open Sans Light', 'Noto Sans Light', 'Arial Unicode MS Regular'],
    'Public Sans SemiBold': ['Open Sans SemiBold', 'Noto Sans SemiBold', 'Arial Unicode MS Bold'],
    'Public Sans ExtraBold': ['Open Sans ExtraBold', 'Noto Sans ExtraBold', 'Arial Unicode MS Bold'],
    'Public Sans Black': ['Open Sans ExtraBold', 'Noto Sans Black', 'Arial Unicode MS Bold'],
    'Public Sans Thin': ['Open Sans Light', 'Noto Sans Thin', 'Arial Unicode MS Regular'],
};

// Helper function to extract base URL
function extractBaseUrl(styleUrl) {
    try {
        const url = new URL(styleUrl);
        const pathParts = url.pathname.split('/');
        const resourcesIndex = pathParts.indexOf('resources');
        if (resourcesIndex > 0) {
            pathParts.length = resourcesIndex + 1;
        }
        return `${url.protocol}//${url.host}${pathParts.join('/')}`;
    } catch (error) {
        throw new Error('Invalid URL format');
    }
}

// Convert relative URL to absolute
function convertRelativeUrl(relativeUrl, baseUrl) {
    if (!relativeUrl) return relativeUrl;
    
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
    }
    
    if (relativeUrl.startsWith('../')) {
        const cleanPath = relativeUrl.replace(/^\.\.\//, '');
        return `${baseUrl}/${cleanPath}`;
    }
    
    return `${baseUrl}/${relativeUrl}`;
}

// Convert ESRI style to MapLibre
function convertESRIToMapLibre(esriStyle, styleUrl, options = {}) {
    const converted = JSON.parse(JSON.stringify(esriStyle)); // Deep clone
    const baseUrl = extractBaseUrl(styleUrl);
    
    // Convert sprite URL
    if (options.spriteUrl) {
        converted.sprite = options.spriteUrl;
    } else if (converted.sprite) {
        converted.sprite = convertRelativeUrl(converted.sprite, baseUrl);
    }
    
    // Convert glyphs URL
    if (options.glyphsUrl) {
        converted.glyphs = options.glyphsUrl;
    } else if (converted.glyphs) {
        converted.glyphs = convertRelativeUrl(converted.glyphs, baseUrl);
    }
    
    // Convert sources
    if (converted.sources) {
        for (const [key, source] of Object.entries(converted.sources)) {
            // Add tile URL if missing for vector sources
            if (!source.tiles && source.type === 'vector') {
                const tileBaseUrl = styleUrl.replace(/\/resources\/styles\/.*$/, '');
                source.tiles = [`${tileBaseUrl}/tile/{z}/{y}/{x}.pbf`];
            }
            
            // Convert tile URLs if present
            if (source.tiles && Array.isArray(source.tiles)) {
                source.tiles = source.tiles.map(tileUrl => 
                    convertRelativeUrl(tileUrl, baseUrl)
                );
            }
            
            // Remove URL field if tiles are present (MapLibre prefers tiles over url)
            if (source.tiles && source.url) {
                delete source.url;
            } else if (source.url && source.url.startsWith('../')) {
                // Only keep URL if no tiles and it needs conversion
                source.url = convertRelativeUrl(source.url, baseUrl);
                // But for vector sources, convert URL to tiles
                if (source.type === 'vector') {
                    const tileBaseUrl = styleUrl.replace(/\/resources\/styles\/.*$/, '');
                    source.tiles = [`${tileBaseUrl}/tile/{z}/{y}/{x}.pbf`];
                    delete source.url;
                }
            }
            
            // Add scheme if needed
            if (source.type === 'vector' && !source.scheme) {
                source.scheme = 'xyz';
            }
        }
    }
    
    // Convert layers with font mapping
    const fontMapping = { ...DEFAULT_FONT_MAPPING, ...(options.fontMapping || {}) };
    
    if (converted.layers) {
        converted.layers = converted.layers.map(layer => {
            const newLayer = { ...layer };
            
            // Convert fonts
            if (newLayer.layout && newLayer.layout['text-font']) {
                newLayer.layout['text-font'] = newLayer.layout['text-font'].map(font => {
                    if (fontMapping[font]) {
                        return fontMapping[font][0];
                    }
                    return font;
                });
            }
            
            // Remove ESRI-specific properties
            const esriProps = ['esri:defaultVisibility', 'esri:labelingInfo'];
            esriProps.forEach(prop => delete newLayer[prop]);
            
            // Clean layout properties
            if (newLayer.layout) {
                Object.keys(newLayer.layout).forEach(prop => {
                    if (prop.startsWith('esri:')) {
                        delete newLayer.layout[prop];
                    }
                });
            }
            
            // Clean paint properties
            if (newLayer.paint) {
                Object.keys(newLayer.paint).forEach(prop => {
                    if (prop.startsWith('esri:')) {
                        delete newLayer.paint[prop];
                    }
                });
            }
            
            return newLayer;
        });
    }
    
    // Add metadata
    converted.metadata = {
        ...converted.metadata,
        'maplibre:converted': true,
        'maplibre:convertedFrom': 'ESRI',
        'maplibre:convertedAt': new Date().toISOString(),
        'maplibre:converter': 'mapconfig.geolantis.com',
        'maplibre:originalUrl': styleUrl
    };
    
    return converted;
}

// API endpoint to convert ESRI style
app.post('/api/convert', async (req, res) => {
    try {
        const { styleUrl, spriteUrl, glyphsUrl, fontMapping, useCache = true } = req.body;
        
        if (!styleUrl) {
            return res.status(400).json({ error: 'Style URL is required' });
        }
        
        // Check cache
        const cacheKey = JSON.stringify({ styleUrl, spriteUrl, glyphsUrl, fontMapping });
        if (useCache && styleCache.has(cacheKey)) {
            const cached = styleCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return res.json({
                    style: cached.style,
                    cached: true,
                    statistics: cached.statistics
                });
            }
        }
        
        // Fetch the ESRI style
        const response = await axios.get(styleUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'MapConfig-Converter/1.0'
            }
        });
        
        const esriStyle = response.data;
        
        // Convert the style
        const convertedStyle = convertESRIToMapLibre(esriStyle, styleUrl, {
            spriteUrl,
            glyphsUrl,
            fontMapping
        });
        
        // Generate statistics
        const statistics = {
            layerCount: convertedStyle.layers?.length || 0,
            sourceCount: Object.keys(convertedStyle.sources || {}).length,
            layerTypes: {},
            originalSize: JSON.stringify(esriStyle).length,
            convertedSize: JSON.stringify(convertedStyle).length,
            compressionRatio: (1 - (JSON.stringify(convertedStyle).length / JSON.stringify(esriStyle).length)).toFixed(2)
        };
        
        if (convertedStyle.layers) {
            convertedStyle.layers.forEach(layer => {
                statistics.layerTypes[layer.type] = (statistics.layerTypes[layer.type] || 0) + 1;
            });
        }
        
        // Cache the result
        if (useCache) {
            styleCache.set(cacheKey, {
                style: convertedStyle,
                statistics,
                timestamp: Date.now()
            });
        }
        
        res.json({
            style: convertedStyle,
            cached: false,
            statistics
        });
        
    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ 
            error: 'Conversion failed', 
            message: error.message,
            details: error.response?.data || null
        });
    }
});

// API endpoint to validate a style
app.post('/api/validate', (req, res) => {
    try {
        const { style } = req.body;
        
        if (!style) {
            return res.status(400).json({ error: 'Style is required' });
        }
        
        const issues = [];
        const warnings = [];
        
        // Check version
        if (!style.version) {
            issues.push('Missing style version');
        } else if (style.version !== 8) {
            warnings.push(`Style version ${style.version} may not be fully compatible`);
        }
        
        // Check sources
        if (!style.sources || Object.keys(style.sources).length === 0) {
            issues.push('No sources defined');
        }
        
        // Check layers
        if (!style.layers || style.layers.length === 0) {
            issues.push('No layers defined');
        } else {
            // Check for duplicate layer IDs
            const layerIds = new Set();
            style.layers.forEach(layer => {
                if (layerIds.has(layer.id)) {
                    issues.push(`Duplicate layer ID: ${layer.id}`);
                }
                layerIds.add(layer.id);
                
                // Check source references
                if (layer.source && !style.sources[layer.source]) {
                    issues.push(`Layer "${layer.id}" references non-existent source "${layer.source}"`);
                }
            });
        }
        
        // Check sprite and glyphs
        if (!style.sprite) {
            warnings.push('No sprite URL defined');
        }
        if (!style.glyphs) {
            warnings.push('No glyphs URL defined (text labels may not work)');
        }
        
        res.json({
            valid: issues.length === 0,
            issues,
            warnings
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Validation failed', 
            message: error.message 
        });
    }
});

// API endpoint to get predefined examples
app.get('/api/examples', (req, res) => {
    res.json({
        examples: [
            {
                id: 'nsw-streets',
                name: 'NSW Basemap Streets',
                url: 'https://portal.spatial.nsw.gov.au/vectortileservices/rest/services/Hosted/NSW_BaseMap_VectorTile_Streets/VectorTileServer/resources/styles/root.json?f=pjson',
                description: 'Street map of New South Wales, Australia',
                center: [151.2093, -33.8688],
                zoom: 10
            },
            {
                id: 'nsw-topo',
                name: 'NSW Topographic',
                url: 'https://portal.spatial.nsw.gov.au/vectortileservices/rest/services/Hosted/NSW_BaseMap_VectorTile_Topographic/VectorTileServer/resources/styles/root.json?f=pjson',
                description: 'Topographic map of New South Wales',
                center: [151.2093, -33.8688],
                zoom: 10
            }
        ]
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0',
        cacheSize: styleCache.size,
        uptime: process.uptime()
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Clear cache endpoint (for maintenance)
app.post('/api/cache/clear', (req, res) => {
    const { secret } = req.body;
    
    // Simple secret check (use proper authentication in production)
    if (secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const previousSize = styleCache.size;
    styleCache.clear();
    
    res.json({
        message: 'Cache cleared',
        itemsCleared: previousSize
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`MapConfig Converter Service running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to use the web interface`);
});