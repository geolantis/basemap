import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken, type AuthenticatedRequest } from '../middleware/auth';

// Use service key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Admin CORS - restricted origin
  res.setHeader('Access-Control-Allow-Origin', process.env.ADMIN_ORIGIN || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify admin authentication
  return new Promise((resolve) => {
    verifyAdminToken(req as AuthenticatedRequest, res, async () => {
      const authReq = req as AuthenticatedRequest;
      
      try {
        switch (req.method) {
          case 'GET':
            return resolve(handleGet(authReq, res));
          case 'POST':
            return resolve(handlePost(authReq, res));
          case 'PUT':
            return resolve(handlePut(authReq, res));
          case 'DELETE':
            return resolve(handleDelete(authReq, res));
          default:
            return resolve(res.status(405).json({ error: 'Method not allowed' }));
        }
      } catch (error) {
        console.error('Admin API error:', error);
        return resolve(res.status(500).json({ 
          error: 'Internal server error' 
        }));
      }
    });
  });
}

async function handleGet(req: AuthenticatedRequest, res: VercelResponse) {
  const { id } = req.query;

  if (id) {
    // Get single configuration with full details (including sensitive data)
    const { data, error } = await supabase
      .from('map_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    // Include audit information
    const { data: auditLog } = await supabase
      .from('config_audit_log')
      .select('*')
      .eq('config_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return res.status(200).json({
      config: data,
      audit: auditLog || []
    });
  }

  // Get all configurations (admin view)
  const { data, error, count } = await supabase
    .from('map_configs')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch configurations' });
  }

  return res.status(200).json({
    configs: data || [],
    total: count || 0,
    user: req.user
  });
}

async function handlePost(req: AuthenticatedRequest, res: VercelResponse) {
  const configData = req.body;

  // Validate required fields
  if (!configData.name || !configData.label || !configData.type) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, label, type' 
    });
  }

  // Check for duplicate name
  const { data: existing } = await supabase
    .from('map_configs')
    .select('id')
    .eq('name', configData.name)
    .single();

  if (existing) {
    return res.status(409).json({ 
      error: 'Configuration with this name already exists' 
    });
  }

  // Create configuration
  const { data, error } = await supabase
    .from('map_configs')
    .insert({
      ...configData,
      created_by: req.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to create configuration' });
  }

  // Log action
  await supabase
    .from('config_audit_log')
    .insert({
      config_id: data.id,
      user_id: req.user?.id,
      action: 'create',
      changes: configData,
      created_at: new Date().toISOString()
    });

  return res.status(201).json(data);
}

async function handlePut(req: AuthenticatedRequest, res: VercelResponse) {
  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Configuration ID required' });
  }

  // Get current version for audit
  const { data: current } = await supabase
    .from('map_configs')
    .select('*')
    .eq('id', id)
    .single();

  if (!current) {
    return res.status(404).json({ error: 'Configuration not found' });
  }

  // Update configuration
  const { data, error } = await supabase
    .from('map_configs')
    .update({
      ...updates,
      updated_by: req.user?.id,
      updated_at: new Date().toISOString(),
      version: current.version + 1
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update configuration' });
  }

  // Log changes
  await supabase
    .from('config_audit_log')
    .insert({
      config_id: id,
      user_id: req.user?.id,
      action: 'update',
      changes: updates,
      previous_values: current,
      created_at: new Date().toISOString()
    });

  return res.status(200).json(data);
}

async function handleDelete(req: AuthenticatedRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Configuration ID required' });
  }

  // Check permissions (only super_admin can delete)
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Insufficient permissions',
      message: 'Only super administrators can delete configurations'
    });
  }

  // Soft delete (set is_active to false)
  const { error } = await supabase
    .from('map_configs')
    .update({
      is_active: false,
      deleted_by: req.user?.id,
      deleted_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete configuration' });
  }

  // Log deletion
  await supabase
    .from('config_audit_log')
    .insert({
      config_id: id as string,
      user_id: req.user?.id,
      action: 'delete',
      created_at: new Date().toISOString()
    });

  return res.status(200).json({ 
    success: true,
    message: 'Configuration deleted successfully'
  });
}