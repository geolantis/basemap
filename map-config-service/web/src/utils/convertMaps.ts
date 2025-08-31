import type { MapConfig } from '../types';

export function convertMapConfigToArray(mapConfigJson: any): MapConfig[] {
  const configs: MapConfig[] = [];
  let id = 1;
  
  for (const [key, value] of Object.entries(mapConfigJson.backgroundMaps || {})) {
    const map = value as any;
    
    // Remove API keys from the style URL for display
    let cleanStyle = map.style || '';
    if (cleanStyle && cleanStyle.includes('?')) {
      cleanStyle = cleanStyle.split('?')[0];
    }
    
    configs.push({
      id: String(id++),
      name: map.name || key,
      label: map.label || map.name || key,
      type: map.type || 'vtc',
      style: cleanStyle || (map.tiles ? 'tiles' : ''),
      originalStyle: map.style || (map.tiles ? JSON.stringify(map.tiles) : ''), // Keep original with keys for reference
      country: map.country || 'Global',
      flag: map.flag || '🌐',
      layers: map.layers || [],
      metadata: {
        ...map.metadata,
        tiles: map.tiles,
        url: map.url,
        tileSize: map.tileSize,
        attribution: map.attribution
      },
      version: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  return configs;
}