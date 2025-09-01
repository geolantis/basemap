import jwt from 'jsonwebtoken';

// JWT verification middleware
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization token provided');
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.VITE_JWT_SECRET || 'fallback-secret-key';
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Comprehensive Mapbox GL style validation
function validateMapboxStyle(style) {
  const errors = [];
  const warnings = [];
  const info = [];

  // Basic structure validation
  if (typeof style !== 'object' || style === null) {
    errors.push('Style must be a valid JSON object');
    return { valid: false, errors, warnings, info };
  }

  // Version validation
  if (!style.version) {
    errors.push('Style must have a version property');
  } else if (typeof style.version !== 'number') {
    errors.push('Style version must be a number');
  } else if (style.version < 8) {
    errors.push('Style version must be 8 or higher');
  } else if (style.version > 8) {
    warnings.push(`Style version ${style.version} is newer than the standard version 8`);
  }

  // Sources validation
  if (!style.sources) {
    errors.push('Style must have a sources object');
  } else if (typeof style.sources !== 'object') {
    errors.push('Style sources must be an object');
  } else {
    const sourceCount = Object.keys(style.sources).length;
    if (sourceCount === 0) {
      warnings.push('Style has no sources defined');
    } else {
      info.push(`Style has ${sourceCount} source(s)`);
    }

    // Validate each source
    for (const [sourceId, source] of Object.entries(style.sources)) {
      if (!source.type) {
        errors.push(`Source '${sourceId}' must have a type property`);
      }

      switch (source.type) {
        case 'vector':
          if (!source.url && !source.tiles) {
            errors.push(`Vector source '${sourceId}' must have either 'url' or 'tiles' property`);
          }
          break;
        case 'raster':
          if (!source.url && !source.tiles) {
            errors.push(`Raster source '${sourceId}' must have either 'url' or 'tiles' property`);
          }
          if (source.tileSize && (source.tileSize < 1 || source.tileSize > 4096)) {
            warnings.push(`Raster source '${sourceId}' has unusual tileSize: ${source.tileSize}`);
          }
          break;
        case 'geojson':
          if (!source.data) {
            errors.push(`GeoJSON source '${sourceId}' must have a data property`);
          }
          break;
        case 'image':
          if (!source.url || !source.coordinates) {
            errors.push(`Image source '${sourceId}' must have both 'url' and 'coordinates' properties`);
          }
          break;
        case 'video':
          if (!source.urls || !source.coordinates) {
            errors.push(`Video source '${sourceId}' must have both 'urls' and 'coordinates' properties`);
          }
          break;
      }
    }
  }

  // Layers validation
  if (!style.layers) {
    errors.push('Style must have a layers array');
  } else if (!Array.isArray(style.layers)) {
    errors.push('Style layers must be an array');
  } else {
    const layerCount = style.layers.length;
    if (layerCount === 0) {
      warnings.push('Style has no layers defined');
    } else {
      info.push(`Style has ${layerCount} layer(s)`);
    }

    const layerIds = new Set();
    const layerTypes = {};

    for (let i = 0; i < style.layers.length; i++) {
      const layer = style.layers[i];
      const layerIndex = `layer[${i}]`;

      // Required properties
      if (!layer.id) {
        errors.push(`${layerIndex} must have an id property`);
      } else {
        if (layerIds.has(layer.id)) {
          errors.push(`Duplicate layer id: '${layer.id}'`);
        } else {
          layerIds.add(layer.id);
        }
      }

      if (!layer.type) {
        errors.push(`${layerIndex} (${layer.id || 'unnamed'}) must have a type property`);
      } else {
        layerTypes[layer.type] = (layerTypes[layer.type] || 0) + 1;

        // Validate layer type
        const validTypes = ['fill', 'line', 'symbol', 'circle', 'fill-extrusion', 'raster', 'background', 'heatmap', 'hillshade'];
        if (!validTypes.includes(layer.type)) {
          warnings.push(`${layerIndex} (${layer.id}) has unknown layer type: '${layer.type}'`);
        }
      }

      // Source validation
      if (layer.source) {
        if (!style.sources || !style.sources[layer.source]) {
          errors.push(`${layerIndex} (${layer.id}) references undefined source: '${layer.source}'`);
        }
      } else if (layer.type !== 'background') {
        warnings.push(`${layerIndex} (${layer.id}) has no source property`);
      }

      // Source-layer validation for vector sources
      if (layer.source && style.sources && style.sources[layer.source]) {
        const source = style.sources[layer.source];
        if (source.type === 'vector' && layer.type !== 'background' && !layer['source-layer']) {
          warnings.push(`${layerIndex} (${layer.id}) should have a source-layer property for vector source`);
        }
      }

      // Paint and layout validation
      if (layer.paint && typeof layer.paint !== 'object') {
        errors.push(`${layerIndex} (${layer.id}) paint property must be an object`);
      }

      if (layer.layout && typeof layer.layout !== 'object') {
        errors.push(`${layerIndex} (${layer.id}) layout property must be an object`);
      }

      // Visibility validation
      if (layer.layout && layer.layout.visibility && !['visible', 'none'].includes(layer.layout.visibility)) {
        errors.push(`${layerIndex} (${layer.id}) layout.visibility must be 'visible' or 'none'`);
      }
    }

    // Layer type statistics
    if (Object.keys(layerTypes).length > 0) {
      const typeStats = Object.entries(layerTypes)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
      info.push(`Layer types: ${typeStats}`);
    }
  }

  // Optional properties validation
  if (style.name && typeof style.name !== 'string') {
    warnings.push('Style name should be a string');
  }

  if (style.metadata && typeof style.metadata !== 'object') {
    warnings.push('Style metadata should be an object');
  }

  if (style.center && (!Array.isArray(style.center) || style.center.length !== 2)) {
    warnings.push('Style center should be an array of two numbers [lng, lat]');
  }

  if (style.zoom !== undefined && typeof style.zoom !== 'number') {
    warnings.push('Style zoom should be a number');
  }

  if (style.bearing !== undefined && (typeof style.bearing !== 'number' || style.bearing < 0 || style.bearing >= 360)) {
    warnings.push('Style bearing should be a number between 0 and 360');
  }

  if (style.pitch !== undefined && (typeof style.pitch !== 'number' || style.pitch < 0 || style.pitch > 60)) {
    warnings.push('Style pitch should be a number between 0 and 60');
  }

  // Sprite validation
  if (style.sprite && typeof style.sprite !== 'string') {
    warnings.push('Style sprite should be a string URL');
  }

  // Glyphs validation  
  if (style.glyphs && typeof style.glyphs !== 'string') {
    warnings.push('Style glyphs should be a string URL template');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info
  };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Verify authentication (optional for validation)
    let user = null;
    try {
      user = verifyToken(req);
    } catch (error) {
      // Allow anonymous validation but with limited features
    }

    const { style } = req.body;

    if (!style) {
      return res.status(400).json({
        success: false,
        message: 'Style data is required'
      });
    }

    // Validate the style
    const validation = validateMapboxStyle(style);

    const response = {
      success: true,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      info: validation.info,
      summary: {
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        infoCount: validation.info.length
      }
    };

    // Add severity level
    if (validation.errors.length > 0) {
      response.severity = 'error';
    } else if (validation.warnings.length > 0) {
      response.severity = 'warning';
    } else {
      response.severity = 'success';
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Validation service error'
    });
  }
}