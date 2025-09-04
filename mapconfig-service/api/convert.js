const axios = require('axios');

// Default font mappings - keep original ESRI fonts to avoid 404s
const DEFAULT_FONT_MAPPING = {
    // Map to the same font to keep using ESRI's font server
    'Public Sans Regular': ['Public Sans Regular'],
    'Public Sans Medium': ['Public Sans Medium'],
    'Public Sans Bold': ['Public Sans Bold'],
    'Public Sans Italic': ['Public Sans Italic'],
    'Public Sans Light': ['Public Sans Light'],
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

// Vercel serverless function
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { styleUrl, spriteUrl, glyphsUrl, fontMapping, useProxy = false } = req.body;
        
        if (!styleUrl) {
            return res.status(400).json({ error: 'Style URL is required' });
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
        
        // If useProxy is enabled, wrap tile URLs with our proxy
        if (useProxy && convertedStyle.sources) {
            for (const source of Object.values(convertedStyle.sources)) {
                if (source.tiles && Array.isArray(source.tiles)) {
                    source.tiles = source.tiles.map(tileUrl => 
                        `/api/proxy?url=${encodeURIComponent(tileUrl)}`
                    );
                }
            }
            // Also wrap sprite and glyphs if they're ESRI URLs
            if (convertedStyle.sprite && convertedStyle.sprite.includes('portal.spatial.nsw.gov.au')) {
                convertedStyle.sprite = `/api/proxy?url=${encodeURIComponent(convertedStyle.sprite)}`;
            }
            if (convertedStyle.glyphs && convertedStyle.glyphs.includes('portal.spatial.nsw.gov.au')) {
                // Glyphs URL has placeholders, so we need to handle it carefully
                const glyphBase = convertedStyle.glyphs.replace('{fontstack}', '__FONTSTACK__').replace('{range}', '__RANGE__');
                convertedStyle.glyphs = `/api/proxy?url=${encodeURIComponent(glyphBase)}`.replace('__FONTSTACK__', '{fontstack}').replace('__RANGE__', '{range}');
            }
        }
        
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
        
        res.status(200).json({
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
};