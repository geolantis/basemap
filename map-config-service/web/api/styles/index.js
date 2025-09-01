import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

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

// Validate Mapbox GL style
function validateMapboxStyle(style) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!style.version) {
    errors.push('Style must have a version property');
  } else if (typeof style.version !== 'number' || style.version < 8) {
    errors.push('Style version must be a number >= 8');
  }

  if (!style.sources || typeof style.sources !== 'object') {
    errors.push('Style must have a sources object');
  }

  if (!style.layers || !Array.isArray(style.layers)) {
    errors.push('Style must have a layers array');
  }

  // Warnings
  if (style.sources && Object.keys(style.sources).length === 0) {
    warnings.push('Style has no sources defined');
  }

  if (style.layers && style.layers.length === 0) {
    warnings.push('Style has no layers defined');
  }

  // Check for common issues
  if (style.layers) {
    const layerIds = new Set();
    for (const layer of style.layers) {
      if (!layer.id) {
        errors.push('All layers must have an id property');
      } else if (layerIds.has(layer.id)) {
        errors.push(`Duplicate layer id: ${layer.id}`);
      } else {
        layerIds.add(layer.id);
      }

      if (!layer.type) {
        errors.push(`Layer ${layer.id} must have a type property`);
      }

      if (layer.source && !style.sources[layer.source]) {
        errors.push(`Layer ${layer.id} references undefined source: ${layer.source}`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify authentication for all requests
    const user = verifyToken(req);

    switch (req.method) {
      case 'GET':
        return handleGetStyles(req, res, user);
      case 'POST':
        return handleCreateStyle(req, res, user);
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('API error:', error);
    
    if (error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: error.message,
        code: 'UNAUTHORIZED'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Get user's styles
async function handleGetStyles(req, res, user) {
  try {
    const { data: styles, error } = await supabase
      .from('user_styles')
      .select('*')
      .eq('user_id', user.userId)
      .eq('is_active', true)
      .order('modified_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    const formattedStyles = styles.map(style => ({
      id: style.id,
      name: style.name,
      description: style.description,
      category: style.category,
      createdAt: style.created_at,
      modifiedAt: style.modified_at,
      url: `${req.headers.host}/api/styles/${style.id}/download`,
      isPublic: style.is_public,
      thumbnail: style.thumbnail_url
    }));

    return res.status(200).json({
      success: true,
      styles: formattedStyles,
      count: formattedStyles.length
    });

  } catch (error) {
    console.error('Get styles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch styles'
    });
  }
}

// Create new style
async function handleCreateStyle(req, res, user) {
  try {
    const { style, metadata, overwrite = false } = req.body;

    if (!style || !metadata) {
      return res.status(400).json({
        success: false,
        message: 'Style data and metadata are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate style
    const validation = validateMapboxStyle(style);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Style validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
        code: 'VALIDATION_ERROR'
      });
    }

    // Check user quota
    const { data: userStyles, error: quotaError } = await supabase
      .from('user_styles')
      .select('id')
      .eq('user_id', user.userId)
      .eq('is_active', true);

    if (quotaError) {
      throw quotaError;
    }

    const maxStyles = parseInt(process.env.VITE_MAX_STYLES_PER_USER) || 50;
    if (userStyles.length >= maxStyles) {
      return res.status(409).json({
        success: false,
        message: `Maximum styles limit reached (${maxStyles}). Please delete some styles first.`,
        code: 'QUOTA_EXCEEDED'
      });
    }

    // Check for duplicate names if not overwriting
    if (!overwrite) {
      const { data: existing, error: existingError } = await supabase
        .from('user_styles')
        .select('id')
        .eq('user_id', user.userId)
        .eq('name', metadata.name)
        .eq('is_active', true)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'A style with this name already exists',
          code: 'DUPLICATE_NAME'
        });
      }
    }

    // Save style to database
    const styleData = {
      user_id: user.userId,
      name: metadata.name,
      description: metadata.description || '',
      category: metadata.category || 'custom',
      is_public: metadata.isPublic || false,
      style_data: style,
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      is_active: true,
      tags: metadata.tags || []
    };

    const { data: savedStyle, error: saveError } = await supabase
      .from('user_styles')
      .insert(styleData)
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      throw saveError;
    }

    return res.status(201).json({
      success: true,
      styleId: savedStyle.id,
      url: `${req.headers.host}/api/styles/${savedStyle.id}/download`,
      message: 'Style saved successfully',
      metadata: {
        name: savedStyle.name,
        description: savedStyle.description,
        category: savedStyle.category,
        isPublic: savedStyle.is_public,
        createdAt: savedStyle.created_at,
        modifiedAt: savedStyle.modified_at
      },
      validation: {
        warnings: validation.warnings
      }
    });

  } catch (error) {
    console.error('Create style error:', error);
    
    if (error.message.includes('quota') || error.message.includes('limit')) {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: 'QUOTA_EXCEEDED'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to save style'
    });
  }
}