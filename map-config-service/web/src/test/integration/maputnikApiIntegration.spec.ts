import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SaveService } from '../../services/saveService';
import { AuthService } from '../../services/authService';
import { MaputnikBridge, type MaputnikConfig } from '../../utils/maputnikBridge';
import { openInMaputnik, canOpenInMaputnik } from '../../utils/maputnikHelper';
import type { MapStyle } from '../../types/save';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window methods
const mockWindowOpen = vi.fn();
const mockAlert = vi.fn();
Object.defineProperty(window, 'open', { value: mockWindowOpen, writable: true });
Object.defineProperty(window, 'alert', { value: mockAlert, writable: true });

// Mock storage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, writable: true });

describe('Maputnik API Integration', () => {
  let saveService: SaveService;
  let authService: AuthService;
  let bridge: MaputnikBridge;

  const validMapboxStyle: MapStyle = {
    version: 8,
    name: 'Test Maputnik Style',
    metadata: {
      'maputnik:renderer': 'mlgl',
      'maputnik:openmaptiles_access_token': 'test-token'
    },
    sources: {
      'openmaptiles': {
        type: 'vector',
        url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=test'
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#f8f4f0'
        }
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: {
          'fill-color': '#a8d8ea'
        }
      }
    ],
    glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=test',
    sprite: 'https://api.maptiler.com/maps/streets/sprite'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockSessionStorage.getItem.mockClear();
    mockSessionStorage.setItem.mockClear();
    mockWindowOpen.mockReturnValue({});

    // Set up services
    saveService = SaveService.getInstance({
      baseUrl: 'http://localhost:3001'
    });

    authService = AuthService.getInstance({
      baseUrl: 'http://localhost:3001'
    });

    // Set up bridge
    const bridgeConfig: MaputnikConfig = {
      styleUrl: 'http://localhost:3001/api/styles/test.json',
      styleName: 'Test Style',
      saveEndpoint: 'http://localhost:3001/api/styles/save',
      apiKey: 'test-api-key'
    };
    bridge = new MaputnikBridge(bridgeConfig);

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
        origin: 'http://localhost:3000'
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should authenticate user before opening Maputnik', async () => {
      // Mock successful login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'jwt-token',
          refreshToken: 'refresh-token',
          expiresAt: Date.now() + (24 * 60 * 60 * 1000),
          user: {
            id: 'user-123',
            email: 'user@example.com',
            name: 'Test User',
            role: 'user'
          }
        })
      });

      const authToken = await authService.login('user@example.com', 'password123');

      expect(authToken).toBeDefined();
      expect(authToken.token).toBe('jwt-token');
      expect(mockSessionStorage.setItem).toHaveBeenCalled();

      // Should be able to open Maputnik after authentication
      const config = {
        style: 'https://api.maptiler.com/maps/streets/style.json?key=test',
        type: 'vtc'
      };

      expect(canOpenInMaputnik(config)).toBe(true);
    });

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Invalid credentials'
        })
      });

      await expect(authService.login('user@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should refresh token automatically', async () => {
      // Mock stored token
      const storedToken = {
        token: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 1000, // Expires soon
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          role: 'user'
        }
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(storedToken));

      // Mock refresh response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'new-token',
          refreshToken: 'new-refresh-token',
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        })
      });

      const newToken = await authService.refreshToken();

      expect(newToken?.token).toBe('new-token');
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Style Validation and Saving', () => {
    it('should validate Maputnik-style JSON before saving', async () => {
      // Mock authentication
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      // Mock validation endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          errors: [],
          warnings: ['No glyphs URL specified']
        })
      });

      const validation = await saveService.validateStyle(validMapboxStyle);

      expect(validation.valid).toBe(true);
      expect(validation.warnings).toContain('No glyphs URL specified');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/styles/validate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ style: validMapboxStyle })
        })
      );
    });

    it('should save validated Maputnik style', async () => {
      // Mock authentication
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      // Mock successful save
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          styleId: 'maputnik-style-123',
          url: 'http://localhost:3001/api/styles/maputnik-style-123/download',
          message: 'Maputnik style saved successfully',
          metadata: {
            name: 'Test Maputnik Style',
            description: 'Style created with Maputnik editor',
            category: 'maputnik',
            isPublic: false,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
          }
        })
      });

      const result = await saveService.saveStyle(validMapboxStyle, {
        name: 'Test Maputnik Style',
        description: 'Style created with Maputnik editor',
        category: 'maputnik',
        isPublic: false
      });

      expect(result.success).toBe(true);
      expect(result.styleId).toBe('maputnik-style-123');
      expect(result.metadata?.category).toBe('maputnik');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/styles',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle complex Maputnik styles with multiple sources', async () => {
      const complexStyle: MapStyle = {
        ...validMapboxStyle,
        sources: {
          'openmaptiles': {
            type: 'vector',
            url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=test'
          },
          'satellite': {
            type: 'raster',
            tiles: ['https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=test'],
            tileSize: 256
          },
          'hillshade': {
            type: 'raster-dem',
            url: 'https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=test'
          }
        },
        layers: [
          ...validMapboxStyle.layers,
          {
            id: 'satellite',
            type: 'raster',
            source: 'satellite',
            minzoom: 0,
            maxzoom: 18
          },
          {
            id: 'hillshade',
            type: 'hillshade',
            source: 'hillshade',
            paint: {
              'hillshade-shadow-color': '#473B24',
              'hillshade-illuminate-direction': 315
            }
          }
        ]
      };

      // Mock authentication and validation
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          errors: [],
          warnings: ['Complex style with multiple sources']
        })
      });

      const validation = await saveService.validateStyle(complexStyle);

      expect(validation.valid).toBe(true);
      expect(validation.warnings).toContain('Complex style with multiple sources');
    });
  });

  describe('Maputnik Bridge Integration', () => {
    it('should establish communication with Maputnik iframe', () => {
      const mockContainer = {
        appendChild: vi.fn()
      } as any;

      bridge.createCustomMaputnik(mockContainer, 'test-style.json');

      expect(mockContainer.appendChild).toHaveBeenCalled();
      expect(window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should handle style changes from Maputnik', () => {
      const mockContainer = document.createElement('div');
      bridge.createCustomMaputnik(mockContainer, 'test-style.json');

      const styleData = {
        version: 8,
        name: 'Modified in Maputnik',
        layers: [],
        sources: {}
      };

      const messageEvent = {
        origin: 'https://maputnik.github.io',
        data: {
          type: 'style-changed',
          data: styleData
        }
      };

      // Simulate message handling
      const handler = (bridge as any).handleMessage.bind(bridge);
      handler(messageEvent);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'maputnik-current-style',
        JSON.stringify(styleData)
      );
    });

    it('should save style through bridge callback', async () => {
      let saveCallback: ((style: any) => Promise<void>) | undefined;

      const url = bridge.openMaputnik({
        styleFile: 'test-style.json',
        onSave: async (style) => {
          // Mock save implementation
          if (saveCallback) {
            await saveCallback(style);
          }
        }
      });

      expect(url).toContain('maputnik.github.io');

      // Mock the save service call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          styleId: 'saved-through-bridge',
          url: 'http://localhost:3001/api/styles/saved-through-bridge/download',
          message: 'Style saved via bridge'
        })
      });

      // Set up authentication
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      saveCallback = async (style) => {
        await saveService.saveStyle(style, {
          name: 'Bridge Saved Style',
          description: 'Saved through Maputnik bridge',
          category: 'maputnik',
          isPublic: false
        });
      };

      // Simulate save from Maputnik
      await saveCallback(validMapboxStyle);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/styles'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      await expect(saveService.saveStyle(validMapboxStyle, {
        name: 'Test Style',
        description: 'Test',
        category: 'test',
        isPublic: false
      })).rejects.toThrow('Network error. Please check your connection.');
    });

    it('should handle server errors with meaningful messages', async () => {
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          message: 'Invalid Maputnik style format: missing required layer properties',
          code: 'INVALID_MAPUTNIK_STYLE',
          details: {
            missingFields: ['paint'],
            invalidLayers: ['water-layer']
          }
        })
      });

      try {
        await saveService.saveStyle(validMapboxStyle, {
          name: 'Invalid Style',
          description: 'Test invalid style',
          category: 'test',
          isPublic: false
        });
      } catch (error: any) {
        expect(error.message).toBe('Invalid Maputnik style format: missing required layer properties');
        expect(error.code).toBe('INVALID_MAPUTNIK_STYLE');
      }
    });

    it('should handle timeout errors', async () => {
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockRejectedValueOnce(new DOMException('Timeout', 'TimeoutError'));

      await expect(saveService.saveStyle(validMapboxStyle, {
        name: 'Timeout Test',
        description: 'Test timeout handling',
        category: 'test',
        isPublic: false
      })).rejects.toThrow('Request timed out. Please try again.');
    });

    it('should handle unauthorized errors and refresh tokens', async () => {
      // Mock expired token
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'expired-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() - 1000 // Expired
      }));

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Token expired' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'new-token',
            refreshToken: 'new-refresh-token',
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
          })
        });

      // First attempt should fail with expired token
      try {
        await saveService.saveStyle(validMapboxStyle, {
          name: 'Test Style',
          description: 'Test',
          category: 'test',
          isPublic: false
        });
      } catch (error: any) {
        expect(error.message).toBe('Token expired');
      }

      // Token refresh should work
      const newToken = await authService.refreshToken();
      expect(newToken?.token).toBe('new-token');
    });
  });

  describe('Style URL Handling', () => {
    it('should correctly identify supported style formats', () => {
      const testCases = [
        {
          config: { style: 'https://api.maptiler.com/maps/streets/style.json?key=test' },
          expected: true,
          description: 'MapTiler style with API key'
        },
        {
          config: { style: 'https://raw.githubusercontent.com/user/repo/main/style.json' },
          expected: true,
          description: 'GitHub raw style URL'
        },
        {
          config: { style: 'https://gis.ktn.gv.at/styles/basemap.json' },
          expected: true,
          description: 'Government service style'
        },
        {
          config: { style: '/api/styles/custom.json' },
          expected: true,
          description: 'Relative style URL'
        },
        {
          config: { style: 'tiles' },
          expected: false,
          description: 'Unsupported tiles type'
        },
        {
          config: { originalStyle: 'https://example.com/style.json' },
          expected: true,
          description: 'fallback to originalStyle'
        }
      ];

      testCases.forEach(({ config, expected, description }) => {
        expect(canOpenInMaputnik(config)).toBe(expected);
      });
    });

    it('should open different style URL formats correctly', () => {
      const testUrls = [
        'https://api.maptiler.com/maps/streets/style.json?key=test',
        'https://raw.githubusercontent.com/mapbox/mapbox-gl-styles/master/styles/basic-v8.json',
        '/api/styles/basemap.json',
        'custom-style.json'
      ];

      testUrls.forEach(styleUrl => {
        mockWindowOpen.mockClear();
        openInMaputnik(styleUrl, 'vtc');
        expect(mockWindowOpen).toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle multiple concurrent save operations', async () => {
      // Mock authentication
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      // Mock multiple successful saves
      const saveResponses = Array.from({ length: 5 }, (_, i) => ({
        ok: true,
        json: async () => ({
          styleId: `concurrent-style-${i}`,
          url: `http://localhost:3001/api/styles/concurrent-style-${i}/download`,
          message: 'Style saved successfully'
        })
      }));

      mockFetch.mockImplementation(() => 
        Promise.resolve(saveResponses.shift() || { ok: false })
      );

      const savePromises = Array.from({ length: 5 }, (_, i) =>
        saveService.saveStyle(validMapboxStyle, {
          name: `Concurrent Style ${i}`,
          description: `Concurrent save test ${i}`,
          category: 'test',
          isPublic: false
        })
      );

      const results = await Promise.all(savePromises);

      results.forEach((result, i) => {
        expect(result.success).toBe(true);
        expect(result.styleId).toBe(`concurrent-style-${i}`);
      });
    });

    it('should handle large style files efficiently', async () => {
      // Create a large style with many layers
      const largeStyle: MapStyle = {
        ...validMapboxStyle,
        layers: Array.from({ length: 1000 }, (_, i) => ({
          id: `layer-${i}`,
          type: 'fill',
          source: 'openmaptiles',
          'source-layer': 'test',
          paint: {
            'fill-color': `rgb(${i % 255}, ${(i * 2) % 255}, ${(i * 3) % 255})`
          }
        }))
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          styleId: 'large-style',
          url: 'http://localhost:3001/api/styles/large-style/download',
          message: 'Large style saved successfully'
        })
      });

      const startTime = Date.now();
      const result = await saveService.saveStyle(largeStyle, {
        name: 'Large Style Test',
        description: 'Testing large style performance',
        category: 'performance',
        isPublic: false
      });
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});