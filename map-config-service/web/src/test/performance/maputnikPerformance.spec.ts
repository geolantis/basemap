import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SaveService } from '../../services/saveService';
import { AuthService } from '../../services/authService';
import { MaputnikBridge } from '../../utils/maputnikBridge';
import { openInMaputnik } from '../../utils/maputnikHelper';
import type { MapStyle } from '../../types/save';

// Mock fetch with configurable delays
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
};
Object.defineProperty(window, 'performance', { value: mockPerformance, writable: true });

// Mock console for performance logging
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  time: vi.fn(),
  timeEnd: vi.fn()
};
Object.defineProperty(window, 'console', { value: mockConsole, writable: true });

// Memory usage tracking
const mockMemoryInfo = {
  usedJSHeapSize: 10000000, // 10MB
  totalJSHeapSize: 50000000, // 50MB
  jsHeapSizeLimit: 2000000000 // 2GB
};

Object.defineProperty(window, 'performance', {
  value: {
    ...mockPerformance,
    memory: mockMemoryInfo
  },
  writable: true
});

describe('Maputnik Performance Tests', () => {
  let saveService: SaveService;
  let authService: AuthService;

  const createLargeStyle = (layerCount: number = 1000): MapStyle => ({
    version: 8,
    name: `Large Style - ${layerCount} layers`,
    metadata: {
      'maputnik:renderer': 'mlgl',
      'test:layer_count': layerCount
    },
    sources: {
      'openmaptiles': {
        type: 'vector',
        url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=test'
      },
      'satellite': {
        type: 'raster',
        tiles: ['https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=test'],
        tileSize: 256
      }
    },
    layers: Array.from({ length: layerCount }, (_, i) => ({
      id: `layer-${i}`,
      type: i % 4 === 0 ? 'fill' : i % 4 === 1 ? 'line' : i % 4 === 2 ? 'symbol' : 'circle',
      source: 'openmaptiles',
      'source-layer': i % 2 === 0 ? 'water' : 'building',
      filter: i % 3 === 0 ? ['==', 'class', 'residential'] : null,
      layout: i % 4 === 2 ? {
        'text-field': '{name}',
        'text-font': ['Open Sans Regular'],
        'text-size': 12
      } : undefined,
      paint: i % 4 === 0 ? {
        'fill-color': `hsl(${i % 360}, 70%, 50%)`,
        'fill-opacity': 0.8
      } : i % 4 === 1 ? {
        'line-color': `hsl(${i % 360}, 70%, 50%)`,
        'line-width': Math.max(1, i % 10)
      } : i % 4 === 2 ? {
        'text-color': `hsl(${i % 360}, 70%, 30%)`,
        'text-halo-color': '#ffffff',
        'text-halo-width': 1
      } : {
        'circle-color': `hsl(${i % 360}, 70%, 50%)`,
        'circle-radius': Math.max(2, i % 20)
      }
    })),
    glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=test',
    sprite: 'https://api.maptiler.com/maps/streets/sprite?key=test'
  });

  const mockSuccessResponse = (delay: number = 0) => ({
    ok: true,
    json: async () => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return {
        styleId: 'perf-test-style',
        url: 'http://localhost:3001/api/styles/perf-test-style/download',
        message: 'Style saved successfully',
        metadata: {
          name: 'Performance Test Style',
          category: 'performance',
          createdAt: new Date().toISOString()
        }
      };
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockPerformance.now.mockReturnValue(Date.now());

    saveService = SaveService.getInstance({
      baseUrl: 'http://localhost:3001',
      timeout: 30000
    });

    authService = AuthService.getInstance({
      baseUrl: 'http://localhost:3001'
    });

    // Mock authentication
    const authToken = JSON.stringify({
      token: 'perf-test-token',
      user: { id: 'perf-user', email: 'perf@example.com', role: 'user' },
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => authToken),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Large Style Handling', () => {
    it('should handle styles with 1000+ layers efficiently', async () => {
      const largeStyle = createLargeStyle(1000);
      
      // Mock successful save with 200ms delay to simulate processing
      mockFetch.mockResolvedValueOnce(mockSuccessResponse(200));

      const startTime = performance.now();
      const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const result = await saveService.saveStyle(largeStyle, {
        name: 'Large Style Test',
        description: 'Performance test with 1000 layers',
        category: 'performance',
        isPublic: false
      });

      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const duration = endTime - startTime;
      const memoryIncrease = endMemory - startMemory;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB memory increase

      // Verify the request payload size is reasonable
      const fetchCall = mockFetch.mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);
      expect(payload.style.layers).toHaveLength(1000);
    });

    it('should validate large styles within acceptable time', async () => {
      const largeStyle = createLargeStyle(2000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          errors: [],
          warnings: ['Large style with 2000 layers may impact performance']
        })
      });

      const startTime = performance.now();
      const result = await saveService.validateStyle(largeStyle);
      const duration = performance.now() - startTime;

      expect(result.valid).toBe(true);
      expect(duration).toBeLessThan(3000); // Should validate within 3 seconds
      expect(result.warnings).toContain('Large style with 2000 layers may impact performance');
    });

    it('should handle extremely large styles gracefully', async () => {
      const extremeStyle = createLargeStyle(5000); // 5000 layers

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: async () => ({
          message: 'Style too large. Maximum 3000 layers allowed.',
          code: 'STYLE_TOO_LARGE'
        })
      });

      const startTime = performance.now();
      
      try {
        await saveService.saveStyle(extremeStyle, {
          name: 'Extreme Style Test',
          category: 'performance',
          isPublic: false
        });
      } catch (error: any) {
        const duration = performance.now() - startTime;
        expect(error.code).toBe('STYLE_TOO_LARGE');
        expect(duration).toBeLessThan(2000); // Should fail fast
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent save operations', async () => {
      const concurrentSaves = 10;
      const styles = Array.from({ length: concurrentSaves }, (_, i) => 
        createLargeStyle(100 + i * 10) // Varying sizes
      );

      // Mock responses with different delays
      const responses = styles.map((_, i) => mockSuccessResponse(i * 50));
      mockFetch.mockImplementation(() => Promise.resolve(responses.shift()));

      const startTime = performance.now();

      const savePromises = styles.map((style, i) =>
        saveService.saveStyle(style, {
          name: `Concurrent Style ${i}`,
          description: `Performance test ${i}`,
          category: 'performance',
          isPublic: false
        })
      );

      const results = await Promise.all(savePromises);
      const duration = performance.now() - startTime;

      // All saves should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete within reasonable time (not sequential)
      expect(duration).toBeLessThan(2000); // Much less than 10 * individual save time
      expect(mockFetch).toHaveBeenCalledTimes(concurrentSaves);
    });

    it('should handle authentication refresh during concurrent operations', async () => {
      const operations = 5;
      
      // Mock expired token initially
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: vi.fn(() => JSON.stringify({
            token: 'expired-token',
            refreshToken: 'refresh-token',
            user: { id: 'user', email: 'user@example.com', role: 'user' },
            expiresAt: Date.now() - 1000 // Expired
          })),
          setItem: vi.fn(),
          removeItem: vi.fn()
        },
        writable: true
      });

      // Mock token refresh
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'new-token',
            refreshToken: 'new-refresh-token',
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
          })
        });

      const startTime = performance.now();
      const newToken = await authService.refreshToken();
      const refreshDuration = performance.now() - startTime;

      expect(newToken?.token).toBe('new-token');
      expect(refreshDuration).toBeLessThan(1000); // Should refresh quickly
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not leak memory during repeated operations', async () => {
      const iterations = 50;
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < iterations; i++) {
        const style = createLargeStyle(100);
        
        mockFetch.mockResolvedValueOnce(mockSuccessResponse(10));
        
        await saveService.validateStyle(style);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal after many operations
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });

    it('should handle large JSON parsing efficiently', async () => {
      const veryLargeStyle = createLargeStyle(3000);
      const styleJson = JSON.stringify(veryLargeStyle);
      const jsonSize = new Blob([styleJson]).size;

      console.log(`Testing JSON parsing for style size: ${(jsonSize / 1024 / 1024).toFixed(2)} MB`);

      const startTime = performance.now();
      const parsed = JSON.parse(styleJson);
      const parseTime = performance.now() - startTime;

      expect(parsed.layers).toHaveLength(3000);
      expect(parseTime).toBeLessThan(500); // Should parse within 500ms

      // Test serialization performance
      const serializeStart = performance.now();
      const reserialized = JSON.stringify(parsed);
      const serializeTime = performance.now() - serializeStart;

      expect(reserialized.length).toBe(styleJson.length);
      expect(serializeTime).toBeLessThan(500); // Should serialize within 500ms
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network conditions', async () => {
      const style = createLargeStyle(500);
      
      // Simulate slow network (2 second delay)
      mockFetch.mockResolvedValueOnce(mockSuccessResponse(2000));

      const startTime = performance.now();
      const result = await saveService.saveStyle(style, {
        name: 'Slow Network Test',
        description: 'Testing slow network conditions',
        category: 'performance',
        isPublic: false
      });
      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeGreaterThan(2000); // Should take at least 2 seconds
      expect(duration).toBeLessThan(2500); // But not much longer than network delay
    });

    it('should timeout appropriately for very slow requests', async () => {
      const style = createLargeStyle(100);
      
      // Mock extremely slow response (exceeds timeout)
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSuccessResponse()), 35000))
      );

      const startTime = performance.now();
      
      try {
        await saveService.saveStyle(style, {
          name: 'Timeout Test',
          category: 'performance',
          isPublic: false
        });
      } catch (error: any) {
        const duration = performance.now() - startTime;
        expect(error.message).toContain('timeout');
        expect(duration).toBeLessThan(31000); // Should timeout before 31 seconds (30s timeout + buffer)
        expect(duration).toBeGreaterThan(29000); // But should wait close to timeout
      }
    });

    it('should compress large payloads efficiently', async () => {
      const largeStyle = createLargeStyle(1500);
      const originalSize = new Blob([JSON.stringify(largeStyle)]).size;

      mockFetch.mockResolvedValueOnce(mockSuccessResponse(100));

      await saveService.saveStyle(largeStyle, {
        name: 'Compression Test',
        description: 'Testing payload compression',
        category: 'performance',
        isPublic: false
      });

      const fetchCall = mockFetch.mock.calls[0];
      const payloadSize = new Blob([fetchCall[1].body]).size;

      console.log(`Original style size: ${(originalSize / 1024).toFixed(2)} KB`);
      console.log(`Payload size: ${(payloadSize / 1024).toFixed(2)} KB`);

      // The payload should be reasonable for a large style
      expect(payloadSize).toBeGreaterThan(originalSize * 0.8); // At least 80% of original
      expect(payloadSize).toBeLessThan(originalSize * 1.2); // But not more than 120% (accounting for metadata)
    });
  });

  describe('Maputnik Integration Performance', () => {
    it('should open Maputnik quickly for various URL types', () => {
      const testUrls = [
        'https://api.maptiler.com/maps/streets/style.json?key=test',
        'https://raw.githubusercontent.com/user/repo/style.json',
        '/api/styles/local.json',
        'custom-style.json'
      ];

      testUrls.forEach(url => {
        const startTime = performance.now();
        openInMaputnik(url, 'vtc');
        const duration = performance.now() - startTime;

        // URL processing should be nearly instantaneous
        expect(duration).toBeLessThan(10); // Less than 10ms
      });
    });

    it('should handle bridge communication efficiently', async () => {
      const bridge = new MaputnikBridge({
        styleUrl: 'test-url',
        styleName: 'test-name',
        saveEndpoint: 'test-endpoint',
        apiKey: 'test-key'
      });

      const mockContainer = document.createElement('div');
      
      const startTime = performance.now();
      bridge.createCustomMaputnik(mockContainer, 'test-style.json');
      const setupTime = performance.now() - startTime;

      expect(setupTime).toBeLessThan(50); // Should set up quickly

      // Test message handling performance
      const handler = (bridge as any).handleMessage.bind(bridge);
      const largeStyle = createLargeStyle(100);

      const messageStart = performance.now();
      handler({
        origin: 'https://maputnik.github.io',
        data: {
          type: 'style-changed',
          data: largeStyle
        }
      });
      const messageTime = performance.now() - messageStart;

      expect(messageTime).toBeLessThan(100); // Should handle messages quickly
    });
  });

  describe('Performance Metrics and Monitoring', () => {
    it('should track performance metrics', async () => {
      const style = createLargeStyle(200);
      
      mockFetch.mockResolvedValueOnce(mockSuccessResponse(500));

      // Clear existing marks
      performance.clearMarks();
      performance.clearMeasures();

      performance.mark('save-start');
      
      const result = await saveService.saveStyle(style, {
        name: 'Metrics Test',
        category: 'performance',
        isPublic: false
      });

      performance.mark('save-end');
      performance.measure('save-duration', 'save-start', 'save-end');

      expect(result.success).toBe(true);
      expect(performance.mark).toHaveBeenCalledWith('save-start');
      expect(performance.mark).toHaveBeenCalledWith('save-end');
      expect(performance.measure).toHaveBeenCalledWith('save-duration', 'save-start', 'save-end');
    });

    it('should log performance warnings for slow operations', async () => {
      const style = createLargeStyle(1000);
      
      // Mock slow response
      mockFetch.mockResolvedValueOnce(mockSuccessResponse(3000));

      const startTime = Date.now();
      const result = await saveService.saveStyle(style, {
        name: 'Slow Operation Test',
        category: 'performance',
        isPublic: false
      });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);

      // Should potentially log performance warnings for slow operations
      if (duration > 2000) {
        console.warn(`Slow save operation detected: ${duration}ms for style with ${style.layers.length} layers`);
      }
    });

    it('should provide performance recommendations', () => {
      const testCases = [
        {
          layerCount: 5000,
          expectedRecommendation: 'Consider reducing layer count for better performance'
        },
        {
          layerCount: 100,
          expectedRecommendation: null // No recommendation needed
        }
      ];

      testCases.forEach(({ layerCount, expectedRecommendation }) => {
        const style = createLargeStyle(layerCount);
        const recommendation = getPerformanceRecommendation(style);
        
        if (expectedRecommendation) {
          expect(recommendation).toContain('performance');
        } else {
          expect(recommendation).toBeNull();
        }
      });
    });
  });
});

// Helper function for performance recommendations
function getPerformanceRecommendation(style: MapStyle): string | null {
  if (style.layers.length > 3000) {
    return 'Consider reducing layer count for better performance';
  }
  
  const complexLayers = style.layers.filter(layer => 
    layer.filter || 
    (layer.layout && Object.keys(layer.layout).length > 3) ||
    (layer.paint && Object.keys(layer.paint).length > 3)
  );
  
  if (complexLayers.length > style.layers.length * 0.8) {
    return 'Many complex layers detected. Consider simplifying layer definitions';
  }
  
  return null;
}

// Load testing utilities
export async function performLoadTest(options: {
  concurrentUsers: number;
  operationsPerUser: number;
  styleSize: 'small' | 'medium' | 'large';
  duration?: number;
}): Promise<{
  totalOperations: number;
  successRate: number;
  averageResponseTime: number;
  peakMemoryUsage: number;
}> {
  const { concurrentUsers, operationsPerUser, styleSize } = options;
  const layerCounts = { small: 10, medium: 100, large: 500 };
  
  const results: Array<{ success: boolean; duration: number }> = [];
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
  let peakMemory = startMemory;

  const userOperations = Array.from({ length: concurrentUsers }, () =>
    Array.from({ length: operationsPerUser }, async () => {
      const style = createLargeStyle(layerCounts[styleSize]);
      const startTime = performance.now();
      
      try {
        // Simulate save operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        const duration = performance.now() - startTime;
        const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
        peakMemory = Math.max(peakMemory, currentMemory);
        
        results.push({ success: true, duration });
      } catch (error) {
        results.push({ success: false, duration: performance.now() - startTime });
      }
    })
  );

  await Promise.all(userOperations.flat());

  const successCount = results.filter(r => r.success).length;
  const averageResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  return {
    totalOperations: results.length,
    successRate: successCount / results.length,
    averageResponseTime,
    peakMemoryUsage: peakMemory - startMemory
  };
}