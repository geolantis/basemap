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

// Validation schema for overlay operations
const overlaySchema = {
  required: ['overlay_id'],
  optional: ['position', 'opacity', 'is_visible'],
  validate: (data) => {
    const errors = [];

    if (!data.overlay_id || typeof data.overlay_id !== 'string') {
      errors.push('overlay_id is required and must be a string');
    }

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

// Check if overlay (map config) exists
async function checkOverlayExists(overlayId) {
  const { data, error } = await supabase
    .from('map_configs')
    .select('id, name, label, type, metadata')
    .eq('id', overlayId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { exists: false, data: null };
  }

  // Check if it's actually an overlay
  const isOverlay = data.metadata?.isOverlay === true;

  return {
    exists: true,
    isOverlay: isOverlay,
    data: data
  };
}

// Get next position for overlay in layer group
async function getNextPosition(layerGroupId) {
  const { data, error } = await supabase
    .from('layer_group_overlays')
    .select('position')
    .eq('layer_group_id', layerGroupId)
    .eq('is_active', true)
    .order('position', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return 0; // First overlay
  }

  return data[0].position + 1;
}

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
    // Extract layer group ID from URL
    const { id: layerGroupId } = req.query;

    if (!layerGroupId) {
      return res.status(400).json({
        success: false,
        message: 'Layer group ID is required',
        code: 'MISSING_ID'
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

    switch (req.method) {
      case 'GET':
        return handleGetOverlays(req, res, user, layerGroupId);
      case 'POST':
        return handleAddOverlay(req, res, user, layerGroupId);
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    console.error('Layer Group Overlays API error:', error);

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

// GET /api/layer-groups/[id]/overlays - Get all overlays in layer group
async function handleGetOverlays(req, res, user, layerGroupId) {
  try {
    const { data: overlays, error } = await supabase
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
          metadata,
          is_active
        )
      `)
      .eq('layer_group_id', layerGroupId)
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (error) {
      console.error('Database error fetching overlays:', error);
      throw error;
    }

    // Format overlays data
    const formattedOverlays = overlays
      .filter(overlay => overlay.map_configs && overlay.map_configs.is_active)
      .map(overlay => ({
        id: overlay.id,
        overlay_id: overlay.overlay_id,
        position: overlay.position,
        opacity: overlay.opacity,
        is_visible: overlay.is_visible,
        created_at: overlay.created_at,
        updated_at: overlay.updated_at,
        layer: {
          id: overlay.map_configs.id,
          name: overlay.map_configs.name,
          label: overlay.map_configs.label,
          type: overlay.map_configs.type,
          country: overlay.map_configs.country,
          preview_image_url: overlay.map_configs.preview_image_url,
          metadata: overlay.map_configs.metadata
        }
      }));

    return res.status(200).json({
      success: true,
      data: formattedOverlays,
      count: formattedOverlays.length,
      layer_group_id: layerGroupId
    });

  } catch (error) {
    console.error('Get overlays error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch overlays',
      code: 'FETCH_ERROR'
    });
  }
}

// POST /api/layer-groups/[id]/overlays - Add overlay to layer group
async function handleAddOverlay(req, res, user, layerGroupId) {
  try {
    const overlayData = req.body;

    // Validate input
    const validation = overlaySchema.validate(overlayData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if overlay exists and is actually an overlay
    const overlayCheck = await checkOverlayExists(overlayData.overlay_id);
    if (!overlayCheck.exists) {
      return res.status(404).json({
        success: false,
        message: 'Overlay not found or is not active',
        code: 'OVERLAY_NOT_FOUND'
      });
    }

    if (!overlayCheck.isOverlay) {
      return res.status(400).json({
        success: false,
        message: 'The specified map is not configured as an overlay',
        code: 'NOT_AN_OVERLAY'
      });
    }

    // Check if overlay is already in the layer group
    const { data: existingOverlay, error: existingError } = await supabase
      .from('layer_group_overlays')
      .select('id')
      .eq('layer_group_id', layerGroupId)
      .eq('overlay_id', overlayData.overlay_id)
      .eq('is_active', true)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingOverlay) {
      return res.status(409).json({
        success: false,
        message: 'Overlay is already in this layer group',
        code: 'OVERLAY_EXISTS'
      });
    }

    // Get next position if not specified
    const position = overlayData.position !== undefined
      ? overlayData.position
      : await getNextPosition(layerGroupId);

    // If position is specified and already exists, shift other overlays
    if (overlayData.position !== undefined) {
      await supabase.rpc('shift_overlay_positions', {
        p_layer_group_id: layerGroupId,
        p_start_position: position,
        p_shift_amount: 1
      });
    }

    // Add overlay to layer group
    const newOverlay = {
      layer_group_id: layerGroupId,
      overlay_id: overlayData.overlay_id,
      position: position,
      opacity: overlayData.opacity !== undefined ? overlayData.opacity : 0.7,
      is_visible: overlayData.is_visible !== undefined ? overlayData.is_visible : true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: savedOverlay, error: saveError } = await supabase
      .from('layer_group_overlays')
      .insert(newOverlay)
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

    if (saveError) {
      console.error('Save overlay error:', saveError);
      throw saveError;
    }

    // Update layer group timestamp
    await supabase
      .from('layer_groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', layerGroupId);

    return res.status(201).json({
      success: true,
      data: {
        id: savedOverlay.id,
        overlay_id: savedOverlay.overlay_id,
        position: savedOverlay.position,
        opacity: savedOverlay.opacity,
        is_visible: savedOverlay.is_visible,
        created_at: savedOverlay.created_at,
        updated_at: savedOverlay.updated_at,
        layer: {
          id: savedOverlay.map_configs.id,
          name: savedOverlay.map_configs.name,
          label: savedOverlay.map_configs.label,
          type: savedOverlay.map_configs.type,
          country: savedOverlay.map_configs.country,
          preview_image_url: savedOverlay.map_configs.preview_image_url,
          metadata: savedOverlay.map_configs.metadata
        }
      },
      message: 'Overlay added to layer group successfully'
    });

  } catch (error) {
    console.error('Add overlay error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add overlay to layer group',
      code: 'ADD_OVERLAY_ERROR'
    });
  }
}