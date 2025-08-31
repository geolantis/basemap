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

export class ClaudeMapService {
  // Use local API endpoint to avoid CORS issues
  private apiUrl = '/api/search-maps';
  
  constructor() {
    // No need for API key in constructor as it's handled server-side
  }

  /**
   * Search for public map services using Claude API via server proxy
   */
  async searchMaps(request: ClaudeSearchRequest): Promise<ClaudeSearchResult> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: request.query,
          maxResults: request.maxResults,
          mapTypes: request.mapTypes,
          regions: request.regions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Validate discovered maps in parallel
      const validatedMaps = await this.validateMapsParallel(result.maps || []);
      
      return {
        ...result,
        maps: validatedMaps
      };
    } catch (error) {
      console.error('Error searching maps:', error);
      throw error;
    }
  }


  /**
   * Validate maps in parallel
   */
  private async validateMapsParallel(maps: DiscoveredMap[]): Promise<DiscoveredMap[]> {
    const validationPromises = maps.map(map => this.validateMap(map));
    const results = await Promise.allSettled(validationPromises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Return map with validation error
        return {
          ...maps[index],
          validation: {
            status: 'invalid' as const,
            tests: {
              availability: false,
              cors: false,
              format: false,
              geographic: false
            },
            errors: [result.reason?.message || 'Validation failed'],
            warnings: []
          }
        };
      }
    });
  }

  /**
   * Validate a single map
   */
  private async validateMap(map: DiscoveredMap): Promise<DiscoveredMap> {
    const validation: ValidationResult = {
      status: 'pending',
      tests: {
        availability: false,
        cors: false,
        format: false,
        geographic: false
      },
      errors: [],
      warnings: []
    };

    try {
      // Test based on map type
      switch (map.type) {
        case 'vtc':
          validation.tests = await this.validateVectorTiles(map);
          break;
        case 'wmts':
          validation.tests = await this.validateWMTS(map);
          break;
        case 'wms':
          validation.tests = await this.validateWMS(map);
          break;
      }

      // Determine overall status
      const testsPassed = Object.values(validation.tests).filter(Boolean).length;
      const totalTests = Object.keys(validation.tests).length;
      
      if (testsPassed === totalTests) {
        validation.status = 'valid';
      } else if (testsPassed >= totalTests / 2) {
        validation.status = 'warning';
      } else {
        validation.status = 'invalid';
      }
    } catch (error) {
      validation.status = 'invalid';
      validation.errors.push(error instanceof Error ? error.message : 'Validation error');
    }

    return {
      ...map,
      validation
    };
  }

  /**
   * Validate vector tiles
   */
  private async validateVectorTiles(map: DiscoveredMap): Promise<ValidationResult['tests']> {
    const tests = {
      availability: false,
      cors: false,
      format: false,
      geographic: false
    };

    try {
      // Test style.json availability
      if (map.styleUrl) {
        const styleResponse = await fetch(map.styleUrl, {
          method: 'HEAD',
          mode: 'cors'
        });
        tests.availability = styleResponse.ok;
        tests.cors = styleResponse.headers.get('access-control-allow-origin') !== null;
      }

      // Test tile availability (sample tile at zoom 10)
      const tileUrl = this.buildTileUrl(map.url, 10, 512, 512);
      const tileResponse = await fetch(tileUrl, {
        method: 'HEAD',
        mode: 'cors'
      });
      
      tests.format = tileResponse.headers.get('content-type')?.includes('protobuf') || false;
      tests.geographic = tileResponse.ok;
    } catch (error) {
      console.error('Vector tile validation error:', error);
    }

    return tests;
  }

  /**
   * Validate WMTS
   */
  private async validateWMTS(map: DiscoveredMap): Promise<ValidationResult['tests']> {
    const tests = {
      availability: false,
      cors: false,
      format: false,
      geographic: false
    };

    try {
      // Test GetCapabilities
      const capabilitiesUrl = `${map.url}?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0`;
      const response = await fetch(capabilitiesUrl, {
        method: 'GET',
        mode: 'cors'
      });
      
      tests.availability = response.ok;
      tests.cors = response.headers.get('access-control-allow-origin') !== null;
      tests.format = response.headers.get('content-type')?.includes('xml') || false;
      tests.geographic = true; // Assume geographic coverage if capabilities are available
    } catch (error) {
      console.error('WMTS validation error:', error);
    }

    return tests;
  }

  /**
   * Validate WMS
   */
  private async validateWMS(map: DiscoveredMap): Promise<ValidationResult['tests']> {
    const tests = {
      availability: false,
      cors: false,
      format: false,
      geographic: false
    };

    try {
      // Test GetCapabilities
      const capabilitiesUrl = `${map.url}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`;
      const response = await fetch(capabilitiesUrl, {
        method: 'GET',
        mode: 'cors'
      });
      
      tests.availability = response.ok;
      tests.cors = response.headers.get('access-control-allow-origin') !== null;
      tests.format = response.headers.get('content-type')?.includes('xml') || false;
      tests.geographic = true; // Assume geographic coverage if capabilities are available
    } catch (error) {
      console.error('WMS validation error:', error);
    }

    return tests;
  }

  /**
   * Build tile URL from pattern
   */
  private buildTileUrl(pattern: string, z: number, x: number, y: number): string {
    return pattern
      .replace('{z}', z.toString())
      .replace('{x}', x.toString())
      .replace('{y}', y.toString());
  }

  /**
   * Convert discovered map to MapConfig
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