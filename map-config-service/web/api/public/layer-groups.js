import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Enable CORS for all origins (public endpoint)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Cache for 1 hour
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, pretty } = req.query;

    // If specific ID requested, get that layer group
    if (id) {
      const { data: layerGroup, error } = await supabase
        .from('layer_groups')
        .select(`
          *,
          basemap:map_configs!basemap_id(
            id, name, label, type, style, map_category,
            country, flag, metadata, preview_image_url
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .eq('is_public', true)
        .single();

      if (error || !layerGroup) {
        return res.status(404).json({ error: 'Layer group not found' });
      }

      // Get overlays for this group
      const { data: overlays } = await supabase
        .from('layer_group_overlays')
        .select(`
          *,
          overlay:map_configs!overlay_id(
            id, name, label, type, style, map_category,
            country, flag, metadata, preview_image_url
          )
        `)
        .eq('layer_group_id', id)
        .order('display_order');

      const response = {
        ...layerGroup,
        overlays: overlays || []
      };

      if (pretty === 'true' || pretty === '1') {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(JSON.stringify(response, null, 2));
      }
      return res.status(200).json(response);
    }

    // Get all layer groups with full details
    const { data: layerGroups, error } = await supabase
      .from('layer_groups')
      .select(`
        *,
        basemap:map_configs!basemap_id(
          id, name, label, type, style, map_category,
          country, flag, metadata, preview_image_url
        )
      `)
      .eq('is_active', true)
      .eq('is_public', true)
      .order('display_order');

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch layer groups' });
    }

    // Get all overlay relationships
    const { data: allOverlays } = await supabase
      .from('layer_group_overlays')
      .select(`
        *,
        overlay:map_configs!overlay_id(
          id, name, label, type, style, map_category,
          country, flag, metadata, preview_image_url
        )
      `)
      .order('display_order');

    // Combine layer groups with their overlays
    const layerGroupsWithOverlays = layerGroups?.map(group => ({
      ...group,
      overlays: allOverlays?.filter(o => o.layer_group_id === group.id) || []
    })) || [];

    const response = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      layerGroups: layerGroupsWithOverlays,
      total: layerGroupsWithOverlays.length
    };

    if (pretty === 'true' || pretty === '1') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(JSON.stringify(response, null, 2));
    }
    return res.status(200).json(response);

  } catch (error) {
    console.error('Layer groups API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve layer groups'
    });
  }
}