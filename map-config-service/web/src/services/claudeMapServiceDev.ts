// Development mock service for testing without Claude API
import type { MapConfig } from '../types';

interface ClaudeSearchRequest {
  query: string;
  maxResults?: number;
  mapTypes?: ('vtc' | 'wmts' | 'wms')[];
  regions?: string[];
}

interface ClaudeSearchResult {
  maps: DiscoveredMap[];
  searchMetadata: {
    query: string;
    timestamp: string;
    sources: string[];
    totalFound: number;
  };
}

interface DiscoveredMap {
  name: string;
  label: string;
  type: 'vtc' | 'wmts' | 'wms';
  url: string;
  styleUrl?: string;
  country: string;
  flag: string;
  provider: string;
  confidence: number;
  validation?: ValidationResult;
  metadata?: any;
}

interface ValidationResult {
  status: 'valid' | 'invalid' | 'warning' | 'pending';
  tests: {
    availability: boolean;
    cors: boolean;
    format: boolean;
    geographic: boolean;
  };
  errors: string[];
  warnings: string[];
}

// Mock discovered maps for development
const MOCK_MAPS: Record<string, DiscoveredMap[]> = {
  'austria': [
    {
      name: 'basemap_at_terrain',
      label: 'Basemap.at Terrain',
      type: 'vtc',
      url: 'https://raw.githubusercontent.com/basemap-at/styles/main/styles/basemap-v2.json',
      styleUrl: 'https://raw.githubusercontent.com/basemap-at/styles/main/styles/basemap-v2.json',
      country: 'Austria',
      flag: '🇦🇹',
      provider: 'basemap.at',
      confidence: 0.95,
      validation: {
        status: 'valid',
        tests: {
          availability: true,
          cors: true,
          format: true,
          geographic: true
        },
        errors: [],
        warnings: []
      }
    },
    {
      name: 'bev_ortho',
      label: 'BEV Orthophoto',
      type: 'wmts',
      url: 'https://maps.bev.gv.at/tiles/ortho/{z}/{x}/{y}.png',
      country: 'Austria',
      flag: '🇦🇹',
      provider: 'BEV',
      confidence: 0.9,
      validation: {
        status: 'valid',
        tests: {
          availability: true,
          cors: false,
          format: true,
          geographic: true
        },
        errors: [],
        warnings: ['CORS headers may not be configured']
      }
    },
    {
      name: 'vienna_basemap',
      label: 'Vienna City Map',
      type: 'wmts',
      url: 'https://maps.wien.gv.at/basemap/bmapgrau/normal/google3857/{z}/{y}/{x}.png',
      country: 'Austria',
      flag: '🇦🇹',
      provider: 'Stadt Wien',
      confidence: 0.85,
      validation: {
        status: 'warning',
        tests: {
          availability: true,
          cors: false,
          format: true,
          geographic: true
        },
        errors: [],
        warnings: ['CORS not enabled']
      }
    }
  ],
  'germany': [
    {
      name: 'bkg_topplus',
      label: 'TopPlusOpen',
      type: 'wmts',
      url: 'https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png',
      country: 'Germany',
      flag: '🇩🇪',
      provider: 'BKG',
      confidence: 0.92,
      validation: {
        status: 'valid',
        tests: {
          availability: true,
          cors: true,
          format: true,
          geographic: true
        },
        errors: [],
        warnings: []
      }
    },
    {
      name: 'basemap_de_vector',
      label: 'Basemap.de Vector',
      type: 'vtc',
      url: 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json',
      styleUrl: 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json',
      country: 'Germany',
      flag: '🇩🇪',
      provider: 'BKG',
      confidence: 0.88,
      validation: {
        status: 'valid',
        tests: {
          availability: true,
          cors: true,
          format: true,
          geographic: true
        },
        errors: [],
        warnings: []
      }
    }
  ],
  'satellite': [
    {
      name: 'esri_world_imagery',
      label: 'ESRI World Imagery',
      type: 'wmts',
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      country: 'Global',
      flag: '🌐',
      provider: 'ESRI',
      confidence: 0.95,
      validation: {
        status: 'valid',
        tests: {
          availability: true,
          cors: true,
          format: true,
          geographic: true
        },
        errors: [],
        warnings: []
      }
    },
    {
      name: 'sentinel_hub',
      label: 'Sentinel-2 Cloudless',
      type: 'wmts',
      url: 'https://tiles.sentinel-hub.com/tiles/{z}/{x}/{y}.jpg',
      country: 'Global',
      flag: '🌐',
      provider: 'Sentinel Hub',
      confidence: 0.8,
      validation: {
        status: 'warning',
        tests: {
          availability: true,
          cors: false,
          format: true,
          geographic: true
        },
        errors: [],
        warnings: ['Authentication may be required for full access']
      }
    }
  ],
  'default': [
    {
      name: 'osm_standard',
      label: 'OpenStreetMap Standard',
      type: 'wmts',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      country: 'Global',
      flag: '🌐',
      provider: 'OpenStreetMap',
      confidence: 0.99,
      validation: {
        status: 'valid',
        tests: {
          availability: true,
          cors: true,
          format: true,
          geographic: true
        },
        errors: [],
        warnings: []
      }
    },
    {
      name: 'osm_liberty',
      label: 'OSM Liberty',
      type: 'vtc',
      url: 'https://raw.githubusercontent.com/maputnik/osm-liberty/gh-pages/style.json',
      styleUrl: 'https://raw.githubusercontent.com/maputnik/osm-liberty/gh-pages/style.json',
      country: 'Global',
      flag: '🌐',
      provider: 'OSM Liberty',
      confidence: 0.85,
      validation: {
        status: 'valid',
        tests: {
          availability: true,
          cors: true,
          format: true,
          geographic: true
        },
        errors: [],
        warnings: []
      }
    }
  ]
};

export class ClaudeMapServiceDev {
  /**
   * Mock search for development
   */
  async searchMaps(request: ClaudeSearchRequest): Promise<ClaudeSearchResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Determine which mock maps to return based on query
    let maps: DiscoveredMap[] = [];
    const query = request.query.toLowerCase();
    
    if (query.includes('austria') || query.includes('österreich')) {
      maps = [...MOCK_MAPS.austria];
    } else if (query.includes('germany') || query.includes('deutschland')) {
      maps = [...MOCK_MAPS.germany];
    } else if (query.includes('satellite') || query.includes('aerial') || query.includes('imagery')) {
      maps = [...MOCK_MAPS.satellite];
    } else {
      maps = [...MOCK_MAPS.default];
      
      // Add some random maps from other categories
      if (Math.random() > 0.5) {
        maps.push(...MOCK_MAPS.austria.slice(0, 1));
      }
      if (Math.random() > 0.5) {
        maps.push(...MOCK_MAPS.germany.slice(0, 1));
      }
    }
    
    // Filter by type if specified
    if (request.mapTypes?.length) {
      maps = maps.filter(m => request.mapTypes!.includes(m.type));
    }
    
    // Filter by region if specified
    if (request.regions?.length) {
      maps = maps.filter(m => request.regions!.includes(m.country));
    }
    
    // Limit results
    maps = maps.slice(0, request.maxResults || 20);
    
    // Simulate validation delay
    maps = maps.map(m => ({
      ...m,
      validation: {
        ...m.validation!,
        status: 'pending' as const
      }
    }));
    
    // Simulate async validation
    setTimeout(() => {
      maps.forEach(m => {
        if (m.validation) {
          m.validation.status = Math.random() > 0.2 ? 'valid' : 'warning';
        }
      });
    }, 2000);
    
    return {
      maps,
      searchMetadata: {
        query: request.query,
        timestamp: new Date().toISOString(),
        sources: ['OpenStreetMap', 'Government Portals', 'Commercial Providers'],
        totalFound: maps.length
      }
    };
  }
  
  /**
   * Convert to MapConfig format
   */
  convertToMapConfig(map: DiscoveredMap): Partial<MapConfig> {
    return {
      name: map.name,
      label: map.label,
      type: map.type,
      style: map.styleUrl || 'tiles',
      originalStyle: map.styleUrl || map.url,
      country: map.country,
      flag: map.flag,
      layers: [],
      metadata: {
        provider: map.provider,
        confidence: map.confidence,
        discoveredAt: new Date().toISOString(),
        ...map.metadata
      },
      isActive: map.validation?.status === 'valid'
    };
  }
}