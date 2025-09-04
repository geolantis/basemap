import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface DuplicateRequest {
  sourceId: string;
  type: 'exact' | 'country' | 'template' | 'merge';
  newName: string;
  newLabel: string;
  description?: string;
  targetCountry?: string;
  mergeConfigs?: string[];
  options: {
    copyApiKeys: boolean;
    copyPermissions: boolean;
    copyTags: boolean;
    createBackup: boolean;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const duplicateRequest: DuplicateRequest = req.body;
    
    // Validate request
    if (!duplicateRequest.sourceId || !duplicateRequest.newName || !duplicateRequest.newLabel) {
      return res.status(400).json({ 
        error: 'Missing required fields: sourceId, newName, newLabel' 
      });
    }

    // Fetch source configuration
    const { data: source, error: fetchError } = await supabase
      .from('map_configs')
      .select('*')
      .eq('id', duplicateRequest.sourceId)
      .single();

    if (fetchError || !source) {
      return res.status(404).json({ error: 'Source configuration not found' });
    }

    // Check if new name already exists
    const { data: existing } = await supabase
      .from('map_configs')
      .select('id')
      .eq('name', duplicateRequest.newName)
      .single();

    if (existing) {
      return res.status(409).json({ 
        error: 'Configuration with this name already exists' 
      });
    }

    // Create new configuration based on type
    let newConfig: any = {};
    
    switch (duplicateRequest.type) {
      case 'exact':
        newConfig = createExactCopy(source);
        break;
        
      case 'country':
        newConfig = await adaptForCountry(source, duplicateRequest.targetCountry!);
        break;
        
      case 'template':
        newConfig = createTemplate(source);
        break;
        
      case 'merge':
        newConfig = await mergeConfigurations(source, duplicateRequest.mergeConfigs || []);
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid duplication type' });
    }

    // Apply common properties
    newConfig.name = duplicateRequest.newName;
    newConfig.label = duplicateRequest.newLabel;
    newConfig.metadata = {
      ...newConfig.metadata,
      description: duplicateRequest.description,
      duplicatedFrom: duplicateRequest.sourceId,
      duplicationType: duplicateRequest.type,
      duplicatedAt: new Date().toISOString()
    };

    // Handle options
    if (!duplicateRequest.options.copyApiKeys) {
      delete newConfig.api_provider;
    }
    
    if (!duplicateRequest.options.copyTags) {
      newConfig.tags = [];
    }

    // Create backup if requested
    if (duplicateRequest.options.createBackup) {
      await createBackup(source);
    }

    // Insert new configuration
    const { data: created, error: insertError } = await supabase
      .from('map_configs')
      .insert({
        ...newConfig,
        version: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    // Log the duplication
    await supabase
      .from('audit_logs')
      .insert({
        action: 'CONFIG_DUPLICATED',
        resource_type: 'config',
        resource_id: created.id,
        changes: {
          sourceId: duplicateRequest.sourceId,
          type: duplicateRequest.type
        },
        created_at: new Date().toISOString()
      });

    return res.status(201).json(created);

  } catch (error) {
    console.error('Duplication error:', error);
    return res.status(500).json({ 
      error: 'Failed to duplicate configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function createExactCopy(source: any): any {
  const copy = { ...source };
  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;
  delete copy.created_by;
  delete copy.updated_by;
  return copy;
}

async function adaptForCountry(source: any, targetCountry: string): Promise<any> {
  const adapted = createExactCopy(source);
  adapted.country = targetCountry;
  adapted.flag = getFlagForCountry(targetCountry);
  
  // Adapt layers based on country availability
  if (adapted.layers && Array.isArray(adapted.layers)) {
    adapted.layers = adapted.layers.filter((layer: any) => 
      !layer.countries || layer.countries.includes(targetCountry)
    );
  }
  
  return adapted;
}

function createTemplate(source: any): any {
  return {
    type: source.type,
    country: source.country,
    flag: source.flag,
    layers: source.layers?.map((layer: any) => ({
      ...layer,
      source: '',
      tiles: [],
      url: ''
    })),
    metadata: {
      templateSource: source.id,
      templateCreated: new Date().toISOString()
    }
  };
}

async function mergeConfigurations(primary: any, mergeConfigIds: string[]): Promise<any> {
  const merged = createExactCopy(primary);
  
  // Fetch configurations to merge
  const { data: configs } = await supabase
    .from('map_configs')
    .select('*')
    .in('id', mergeConfigIds);
  
  if (!configs) return merged;
  
  // Merge layers (avoiding duplicates)
  const layerMap = new Map();
  
  // Add primary layers first
  primary.layers?.forEach((layer: any) => {
    layerMap.set(layer.id || layer.name, layer);
  });
  
  // Add layers from other configs
  configs.forEach(config => {
    config.layers?.forEach((layer: any) => {
      const key = layer.id || layer.name;
      if (!layerMap.has(key)) {
        layerMap.set(key, layer);
      }
    });
  });
  
  merged.layers = Array.from(layerMap.values());
  merged.metadata = {
    ...merged.metadata,
    mergedFrom: [primary.id, ...mergeConfigIds],
    mergeDate: new Date().toISOString()
  };
  
  return merged;
}

async function createBackup(config: any): Promise<void> {
  await supabase
    .from('map_config_versions')
    .insert({
      config_id: config.id,
      version: config.version,
      data: config,
      change_summary: 'Backup before duplication',
      created_at: new Date().toISOString()
    });
}

function getFlagForCountry(country: string): string {
  const flags: Record<string, string> = {
    'Austria': '🇦🇹',
    'Germany': '🇩🇪',
    'Switzerland': '🇨🇭',
    'France': '🇫🇷',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Netherlands': '🇳🇱',
    'Belgium': '🇧🇪',
    'Luxembourg': '🇱🇺',
    'United Kingdom': '🇬🇧',
    'USA': '🇺🇸',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'New Zealand': '🇳🇿',
    'Finland': '🇫🇮',
    'Global': '🌐'
  };
  
  return flags[country] || '🌐';
}