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
const layerGroupUpdateSchema = {
  optional: ['name', 'description', 'tags', 'is_featured', 'preview_image_url', 'metadata'],
  validate: (data) => {
    const errors = [];

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length < 1) {
        errors.push('Name must be a non-empty string');
      }
      if (data.name && data.name.length > 100) {
        errors.push('Name must be 100 characters or less');
      }
    }

    if (data.description !== undefined) {
      if (typeof data.description !== 'string') {
        errors.push('Description must be a string');
      }
      if (data.description && data.description.length > 500) {
        errors.push('Description must be 500 characters or less');
      }
    }

    if (data.tags !== undefined && (!Array.isArray(data.tags) || !data.tags.every(tag => typeof tag === 'string'))) {
      errors.push('Tags must be an array of strings');
    }

    if (data.is_featured !== undefined && typeof data.is_featured !== 'boolean') {
      errors.push('is_featured must be a boolean');
    }

    return { valid: errors.length === 0, errors };
  }
};

// Check if user owns the layer group
async function checkLayerGroupOwnership(layerGroupId, userId) {
  const { data, error } = await supabase
    .from('layer_groups')
    .select('id, user_id, name')
    .eq('id', layerGroupId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { exists: false, owned: false, data: null };
  }

  return {
    exists: true,
    owned: data.user_id === userId,
    data: data
  };
}

// Main handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract layer group ID from URL
    const { id: layerGroupId } = req.query;

    if (!layerGroupId) {
      return res.status(400).json({
        success: false,
        message: 'Layer group ID is required',
        code: 'MISSING_ID'
      });
    }

    // Verify authentication for all requests
    const user = verifyToken(req);

    switch (req.method) {
      case 'GET':
        return handleGetLayerGroup(req, res, user, layerGroupId);
      case 'PUT':
        return handleUpdateLayerGroup(req, res, user, layerGroupId);
      case 'DELETE':
        return handleDeleteLayerGroup(req, res, user, layerGroupId);
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    console.error('Layer Group API error:', error);

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

// GET /api/layer-groups/[id] - Get single layer group with all details
async function handleGetLayerGroup(req, res, user, layerGroupId) {
  try {
    // Check ownership
    const ownership = await checkLayerGroupOwnership(layerGroupId, user.userId);

    if (!ownership.exists) {
      return res.status(404).json({
        success: false,
        message: 'Layer group not found',
        code: 'NOT_FOUND'
      });
    }

    if (!ownership.owned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own layer groups.',
        code: 'FORBIDDEN'
      });
    }

    // Fetch layer group with overlays
    const { data: layerGroup, error } = await supabase
      .from('layer_groups')
      .select(`
        *,
        layer_group_overlays(
          id,
          overlay_id,
          position,
          opacity,
          is_visible,
          created_at,
          map_configs(
            id,
            name,
            label,
            type,
            country,
            preview_image_url,
            metadata,
            is_active
          )
        )
      `)
      .eq('id', layerGroupId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Database error fetching layer group:', error);
      throw error;
    }

    // Transform data for response
    const formattedGroup = {
      id: layerGroup.id,
      name: layerGroup.name,
      description: layerGroup.description,
      tags: layerGroup.tags || [],
      is_featured: layerGroup.is_featured,
      is_active: layerGroup.is_active,
      preview_image_url: layerGroup.preview_image_url,
      metadata: layerGroup.metadata || {},
      overlays: layerGroup.layer_group_overlays
        .filter(overlay => overlay.map_configs) // Only include overlays with valid map configs
        .map(overlay => ({
          id: overlay.id,
          position: overlay.position,
          opacity: overlay.opacity,
          is_visible: overlay.is_visible,
          created_at: overlay.created_at,
          layer: {
            id: overlay.map_configs.id,
            name: overlay.map_configs.name,
            label: overlay.map_configs.label,
            type: overlay.map_configs.type,
            country: overlay.map_configs.country,
            preview_image_url: overlay.map_configs.preview_image_url,
            metadata: overlay.map_configs.metadata,
            is_active: overlay.map_configs.is_active
          }
        }))
        .sort((a, b) => a.position - b.position),
      created_at: layerGroup.created_at,
      updated_at: layerGroup.updated_at
    };

    return res.status(200).json({
      success: true,
      data: formattedGroup
    });

  } catch (error) {
    console.error('Get layer group error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch layer group',
      code: 'FETCH_ERROR'
    });
  }
}

// PUT /api/layer-groups/[id] - Update existing layer group
async function handleUpdateLayerGroup(req, res, user, layerGroupId) {
  try {
    // Check ownership
    const ownership = await checkLayerGroupOwnership(layerGroupId, user.userId);

    if (!ownership.exists) {
      return res.status(404).json({
        success: false,
        message: 'Layer group not found',
        code: 'NOT_FOUND'
      });
    }

    if (!ownership.owned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own layer groups.',
        code: 'FORBIDDEN'
      });
    }

    const updateData = req.body;

    // Validate input
    const validation = layerGroupUpdateSchema.validate(updateData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    // If name is being updated, check for duplicates
    if (updateData.name && updateData.name !== ownership.data.name) {
      const { data: existing } = await supabase
        .from('layer_groups')
        .select('id')
        .eq('user_id', user.userId)
        .eq('name', updateData.name.trim())
        .eq('is_active', true)
        .neq('id', layerGroupId)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'A layer group with this name already exists',
          code: 'DUPLICATE_NAME'
        });
      }
    }

    // Prepare update data
    const updateFields = {
      ...(updateData.name !== undefined && { name: updateData.name.trim() }),
      ...(updateData.description !== undefined && { description: updateData.description.trim() }),
      ...(updateData.tags !== undefined && { tags: updateData.tags }),
      ...(updateData.is_featured !== undefined && { is_featured: updateData.is_featured }),
      ...(updateData.preview_image_url !== undefined && { preview_image_url: updateData.preview_image_url }),
      ...(updateData.metadata !== undefined && { metadata: updateData.metadata }),
      updated_at: new Date().toISOString()
    };

    // Update layer group
    const { data: updatedGroup, error: updateError } = await supabase
      .from('layer_groups')
      .update(updateFields)
      .eq('id', layerGroupId)
      .select()
      .single();

    if (updateError) {
      console.error('Update layer group error:', updateError);
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      data: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        description: updatedGroup.description,
        tags: updatedGroup.tags,
        is_featured: updatedGroup.is_featured,
        is_active: updatedGroup.is_active,
        preview_image_url: updatedGroup.preview_image_url,
        metadata: updatedGroup.metadata,
        created_at: updatedGroup.created_at,
        updated_at: updatedGroup.updated_at
      },
      message: 'Layer group updated successfully'
    });

  } catch (error) {
    console.error('Update layer group error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update layer group',
      code: 'UPDATE_ERROR'
    });
  }
}

// DELETE /api/layer-groups/[id] - Soft delete layer group
async function handleDeleteLayerGroup(req, res, user, layerGroupId) {
  try {
    // Check ownership
    const ownership = await checkLayerGroupOwnership(layerGroupId, user.userId);

    if (!ownership.exists) {
      return res.status(404).json({
        success: false,
        message: 'Layer group not found',
        code: 'NOT_FOUND'
      });
    }

    if (!ownership.owned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own layer groups.',
        code: 'FORBIDDEN'
      });
    }

    // Soft delete the layer group
    const { error: deleteError } = await supabase
      .from('layer_groups')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', layerGroupId);

    if (deleteError) {
      console.error('Soft delete layer group error:', deleteError);
      throw deleteError;
    }

    // Also soft delete all associated overlays
    const { error: overlaysError } = await supabase
      .from('layer_group_overlays')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('layer_group_id', layerGroupId);

    if (overlaysError) {
      console.warn('Failed to soft delete overlays:', overlaysError);
    }

    return res.status(200).json({
      success: true,
      message: 'Layer group deleted successfully',
      data: {
        id: layerGroupId,
        deleted_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Delete layer group error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete layer group',
      code: 'DELETE_ERROR'
    });
  }
}