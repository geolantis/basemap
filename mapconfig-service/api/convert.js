const axios = require('axios');

// Default font mappings
const DEFAULT_FONT_MAPPING = {
    'Public Sans Regular': ['Open Sans Regular', 'Noto Sans Regular', 'Arial Unicode MS Regular'],
    'Public Sans Medium': ['Open Sans SemiBold', 'Noto Sans Medium', 'Arial Unicode MS Bold'],
    'Public Sans Bold': ['Open Sans Bold', 'Noto Sans Bold', 'Arial Unicode MS Bold'],
    'Public Sans Italic': ['Open Sans Italic', 'Noto Sans Italic', 'Arial Unicode MS Regular'],
    'Public Sans Light': ['Open Sans Light', 'Noto Sans Light', 'Arial Unicode MS Regular'],
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
            // Convert tile URLs
            if (source.tiles && Array.isArray(source.tiles)) {
                source.tiles = source.tiles.map(tileUrl => 
                    convertRelativeUrl(tileUrl, baseUrl)
                );
            }
            
            // Add tile URL if missing for vector sources
            if (!source.tiles && source.type === 'vector') {
                const tileBaseUrl = styleUrl.replace(/\/resources\/styles\/.*$/, '');
                source.tiles = [`${tileBaseUrl}/tile/{z}/{y}/{x}.pbf`];
            }
            
            // Convert URL if present
            if (source.url) {
                source.url = convertRelativeUrl(source.url, baseUrl);
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
        const { styleUrl, spriteUrl, glyphsUrl, fontMapping } = req.body;
        
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