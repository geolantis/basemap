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

// Validation schema for overlay updates
const overlayUpdateSchema = {
  optional: ['position', 'opacity', 'is_visible'],
  validate: (data) => {
    const errors = [];

    if (data.position !== undefined) {
      if (typeof data.position !== 'number' || data.position < 0) {
        errors.push('position must be a non-negative number');
      }
    }

    if (data.opacity !== undefined) {
      if (typeof data.opacity !== 'number' || data.opacity < 0 || data.opacity > 1) {
        errors.push('opacity must be a number between 0 and 1');
      }
    }

    if (data.is_visible !== undefined && typeof data.is_visible !== 'boolean') {
      errors.push('is_visible must be a boolean');
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

// Check if overlay exists in layer group
async function checkOverlayInLayerGroup(layerGroupId, overlayId) {
  const { data, error } = await supabase
    .from('layer_group_overlays')
    .select(`
      *,
      map_configs(
        id,
        name,
        label,
        type,
        country,
        preview_image_url,
        metadata
      )
    `)
    .eq('layer_group_id', layerGroupId)
    .eq('id', overlayId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { exists: false, data: null };
  }

  return {
    exists: true,
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
    // Extract IDs from URL
    const { id: layerGroupId, overlayId } = req.query;

    if (!layerGroupId || !overlayId) {
      return res.status(400).json({
        success: false,
        message: 'Layer group ID and overlay ID are required',
        code: 'MISSING_IDS'
      });
    }

    // Verify authentication
    const user = verifyToken(req);

    // Check ownership
    const ownership = await checkLayerGroupOwnership(layerGroupId, user.userId);

    if (!ownership.exists) {
      return res.status(404).json({
        success: false,
        message: 'Layer group not found',
        code: 'LAYER_GROUP_NOT_FOUND'
      });
    }

    if (!ownership.owned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own layer groups.',
        code: 'FORBIDDEN'
      });
    }

    switch (req.method) {
      case 'GET':
        return handleGetOverlay(req, res, user, layerGroupId, overlayId);
      case 'PUT':
        return handleUpdateOverlay(req, res, user, layerGroupId, overlayId);
      case 'DELETE':
        return handleRemoveOverlay(req, res, user, layerGroupId, overlayId);
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    console.error('Layer Group Overlay API error:', error);

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

// GET /api/layer-groups/[id]/overlays/[overlayId] - Get specific overlay
async function handleGetOverlay(req, res, user, layerGroupId, overlayId) {
  try {
    const overlayCheck = await checkOverlayInLayerGroup(layerGroupId, overlayId);

    if (!overlayCheck.exists) {
      return res.status(404).json({
        success: false,
        message: 'Overlay not found in this layer group',
        code: 'OVERLAY_NOT_FOUND'
      });
    }

    const overlay = overlayCheck.data;

    const formattedOverlay = {
      id: overlay.id,
      overlay_id: overlay.overlay_id,
      position: overlay.position,
      opacity: overlay.opacity,
      is_visible: overlay.is_visible,
      created_at: overlay.created_at,
      updated_at: overlay.updated_at,
      layer: overlay.map_configs ? {
        id: overlay.map_configs.id,
        name: overlay.map_configs.name,
        label: overlay.map_configs.label,
        type: overlay.map_configs.type,
        country: overlay.map_configs.country,
        preview_image_url: overlay.map_configs.preview_image_url,
        metadata: overlay.map_configs.metadata
      } : null
    };

    return res.status(200).json({
      success: true,
      data: formattedOverlay
    });

  } catch (error) {
    console.error('Get overlay error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch overlay',
      code: 'FETCH_ERROR'
    });
  }
}

// PUT /api/layer-groups/[id]/overlays/[overlayId] - Update overlay properties
async function handleUpdateOverlay(req, res, user, layerGroupId, overlayId) {
  try {
    const overlayCheck = await checkOverlayInLayerGroup(layerGroupId, overlayId);

    if (!overlayCheck.exists) {
      return res.status(404).json({
        success: false,
        message: 'Overlay not found in this layer group',
        code: 'OVERLAY_NOT_FOUND'
      });
    }

    const updateData = req.body;

    // Validate input
    const validation = overlayUpdateSchema.validate(updateData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const currentOverlay = overlayCheck.data;
    const currentPosition = currentOverlay.position;

    // If position is being updated, handle reordering
    if (updateData.position !== undefined && updateData.position !== currentPosition) {
      // Shift overlays to make room for the new position
      if (updateData.position > currentPosition) {
        // Moving down: shift overlays between current+1 and new position up
        await supabase.rpc('shift_overlay_positions_range', {
          p_layer_group_id: layerGroupId,
          p_start_position: currentPosition + 1,
          p_end_position: updateData.position,
          p_shift_amount: -1
        });
      } else {
        // Moving up: shift overlays between new position and current-1 down
        await supabase.rpc('shift_overlay_positions_range', {
          p_layer_group_id: layerGroupId,
          p_start_position: updateData.position,
          p_end_position: currentPosition - 1,
          p_shift_amount: 1
        });
      }
    }

    // Prepare update fields
    const updateFields = {
      ...(updateData.position !== undefined && { position: updateData.position }),
      ...(updateData.opacity !== undefined && { opacity: updateData.opacity }),
      ...(updateData.is_visible !== undefined && { is_visible: updateData.is_visible }),
      updated_at: new Date().toISOString()
    };

    // Update the overlay
    const { data: updatedOverlay, error: updateError } = await supabase
      .from('layer_group_overlays')
      .update(updateFields)
      .eq('id', overlayId)
      .eq('layer_group_id', layerGroupId)
      .select(`
        *,
        map_configs(
          id,
          name,
          label,
          type,
          country,
          preview_image_url,
          metadata
        )
      `)
      .single();

    if (updateError) {
      console.error('Update overlay error:', updateError);
      throw updateError;
    }

    // Update layer group timestamp
    await supabase
      .from('layer_groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', layerGroupId);

    return res.status(200).json({
      success: true,
      data: {
        id: updatedOverlay.id,
        overlay_id: updatedOverlay.overlay_id,
        position: updatedOverlay.position,
        opacity: updatedOverlay.opacity,
        is_visible: updatedOverlay.is_visible,
        created_at: updatedOverlay.created_at,
        updated_at: updatedOverlay.updated_at,
        layer: updatedOverlay.map_configs ? {
          id: updatedOverlay.map_configs.id,
          name: updatedOverlay.map_configs.name,
          label: updatedOverlay.map_configs.label,
          type: updatedOverlay.map_configs.type,
          country: updatedOverlay.map_configs.country,
          preview_image_url: updatedOverlay.map_configs.preview_image_url,
          metadata: updatedOverlay.map_configs.metadata
        } : null
      },
      message: 'Overlay updated successfully'
    });

  } catch (error) {
    console.error('Update overlay error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update overlay',
      code: 'UPDATE_ERROR'
    });
  }
}

// DELETE /api/layer-groups/[id]/overlays/[overlayId] - Remove overlay from layer group
async function handleRemoveOverlay(req, res, user, layerGroupId, overlayId) {
  try {
    const overlayCheck = await checkOverlayInLayerGroup(layerGroupId, overlayId);

    if (!overlayCheck.exists) {
      return res.status(404).json({
        success: false,
        message: 'Overlay not found in this layer group',
        code: 'OVERLAY_NOT_FOUND'
      });
    }

    const currentOverlay = overlayCheck.data;
    const currentPosition = currentOverlay.position;

    // Soft delete the overlay
    const { error: deleteError } = await supabase
      .from('layer_group_overlays')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', overlayId)
      .eq('layer_group_id', layerGroupId);

    if (deleteError) {
      console.error('Delete overlay error:', deleteError);
      throw deleteError;
    }

    // Shift remaining overlays up to close the gap
    await supabase.rpc('shift_overlay_positions', {
      p_layer_group_id: layerGroupId,
      p_start_position: currentPosition + 1,
      p_shift_amount: -1
    });

    // Update layer group timestamp
    await supabase
      .from('layer_groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', layerGroupId);

    return res.status(200).json({
      success: true,
      message: 'Overlay removed from layer group successfully',
      data: {
        id: overlayId,
        layer_group_id: layerGroupId,
        removed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Remove overlay error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove overlay from layer group',
      code: 'REMOVE_ERROR'
    });
  }
}