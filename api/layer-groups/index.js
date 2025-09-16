import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Authentication middleware
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

// Validation schemas
const layerGroupSchema = {
  required: ['name', 'description'],
  optional: ['tags', 'is_featured', 'preview_image_url', 'metadata'],
  validate: (data) => {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 1) {
      errors.push('Name is required and must be a non-empty string');
    }

    if (data.name && data.name.length > 100) {
      errors.push('Name must be 100 characters or less');
    }

    if (!data.description || typeof data.description !== 'string') {
      errors.push('Description is required and must be a string');
    }

    if (data.description && data.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }

    if (data.tags && (!Array.isArray(data.tags) || !data.tags.every(tag => typeof tag === 'string'))) {
      errors.push('Tags must be an array of strings');
    }

    if (data.is_featured && typeof data.is_featured !== 'boolean') {
      errors.push('is_featured must be a boolean');
    }

    return { valid: errors.length === 0, errors };
  }
};

// Main handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify authentication for all requests
    const user = verifyToken(req);

    switch (req.method) {
      case 'GET':
        return handleGetLayerGroups(req, res, user);
      case 'POST':
        return handleCreateLayerGroup(req, res, user);
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    console.error('Layer Groups API error:', error);

    if (error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: error.message,
        code: 'UNAUTHORIZED'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

// GET /api/layer-groups - List all layer groups with filters
async function handleGetLayerGroups(req, res, user) {
  try {
    const {
      tags,
      is_active = 'true',
      is_featured,
      search,
      limit = '50',
      offset = '0',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Build query
    let query = supabase
      .from('layer_groups')
      .select(`
        *,
        layer_group_overlays!inner(
          id,
          overlay_id,
          position,
          opacity,
          is_visible,
          map_configs(
            id,
            name,
            label,
            type,
            country,
            preview_image_url,
            metadata
          )
        )
      `);

    // Apply filters
    if (is_active === 'true') {
      query = query.eq('is_active', true);
    }

    if (is_featured !== undefined) {
      query = query.eq('is_featured', is_featured === 'true');
    }

    // Filter by tags (PostgreSQL array contains)
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query = query.overlaps('tags', tagArray);
    }

    // Search in name and description
    if (search && typeof search === 'string') {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'updated_at', 'name'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? { ascending: true } : { ascending: false };

    query = query.order(sortColumn, sortDirection);

    // Apply pagination
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100 items
    const offsetNum = Math.max(parseInt(offset) || 0, 0);

    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: layerGroups, error } = await query;

    if (error) {
      console.error('Database error fetching layer groups:', error);
      throw error;
    }

    // Transform data for response
    const formattedGroups = layerGroups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      tags: group.tags || [],
      is_featured: group.is_featured,
      is_active: group.is_active,
      preview_image_url: group.preview_image_url,
      metadata: group.metadata || {},
      overlays: group.layer_group_overlays.map(overlay => ({
        id: overlay.id,
        position: overlay.position,
        opacity: overlay.opacity,
        is_visible: overlay.is_visible,
        layer: overlay.map_configs ? {
          id: overlay.map_configs.id,
          name: overlay.map_configs.name,
          label: overlay.map_configs.label,
          type: overlay.map_configs.type,
          country: overlay.map_configs.country,
          preview_image_url: overlay.map_configs.preview_image_url,
          metadata: overlay.map_configs.metadata
        } : null
      })).sort((a, b) => a.position - b.position),
      created_at: group.created_at,
      updated_at: group.updated_at
    }));

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('layer_groups')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', is_active === 'true');

    if (countError) {
      console.warn('Failed to get total count:', countError);
    }

    return res.status(200).json({
      success: true,
      data: formattedGroups,
      pagination: {
        total: count || 0,
        limit: limitNum,
        offset: offsetNum,
        hasMore: count ? offsetNum + limitNum < count : false
      },
      filters: {
        is_active: is_active === 'true',
        is_featured: is_featured ? is_featured === 'true' : undefined,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : undefined,
        search: search || undefined
      }
    });

  } catch (error) {
    console.error('Get layer groups error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch layer groups',
      code: 'FETCH_ERROR'
    });
  }
}

// POST /api/layer-groups - Create new layer group
async function handleCreateLayerGroup(req, res, user) {
  try {
    const layerGroupData = req.body;

    // Validate input
    const validation = layerGroupSchema.validate(layerGroupData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if name already exists for this user
    const { data: existing, error: existingError } = await supabase
      .from('layer_groups')
      .select('id')
      .eq('user_id', user.userId)
      .eq('name', layerGroupData.name.trim())
      .eq('is_active', true)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A layer group with this name already exists',
        code: 'DUPLICATE_NAME'
      });
    }

    // Create layer group
    const newLayerGroup = {
      user_id: user.userId,
      name: layerGroupData.name.trim(),
      description: layerGroupData.description.trim(),
      tags: layerGroupData.tags || [],
      is_featured: layerGroupData.is_featured || false,
      is_active: true,
      preview_image_url: layerGroupData.preview_image_url || null,
      metadata: layerGroupData.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: savedGroup, error: saveError } = await supabase
      .from('layer_groups')
      .insert(newLayerGroup)
      .select()
      .single();

    if (saveError) {
      console.error('Save layer group error:', saveError);
      throw saveError;
    }

    return res.status(201).json({
      success: true,
      data: {
        id: savedGroup.id,
        name: savedGroup.name,
        description: savedGroup.description,
        tags: savedGroup.tags,
        is_featured: savedGroup.is_featured,
        is_active: savedGroup.is_active,
        preview_image_url: savedGroup.preview_image_url,
        metadata: savedGroup.metadata,
        overlays: [],
        created_at: savedGroup.created_at,
        updated_at: savedGroup.updated_at
      },
      message: 'Layer group created successfully'
    });

  } catch (error) {
    console.error('Create layer group error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create layer group',
      code: 'CREATE_ERROR'
    });
  }
}