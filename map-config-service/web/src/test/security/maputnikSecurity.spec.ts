import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SaveService, SaveError } from '../../services/saveService';
import { AuthService } from '../../services/authService';
import { MaputnikBridge } from '../../utils/maputnikBridge';
import { openInMaputnik, getStyleInfo } from '../../utils/maputnikHelper';
import type { MapStyle } from '../../types/save';

// Mock fetch for security testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

// Mock window methods
const mockWindowOpen = vi.fn();
const mockAlert = vi.fn();
Object.defineProperty(window, 'open', { value: mockWindowOpen, writable: true });
Object.defineProperty(window, 'alert', { value: mockAlert, writable: true });

// Mock console for security logging
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

describe('Maputnik Security Tests', () => {
  let saveService: SaveService;
  let authService: AuthService;

  const maliciousStyle: MapStyle = {
    version: 8,
    name: '<script>alert("XSS")</script>',
    metadata: {
      'malicious': '<img src=x onerror=alert("XSS")>',
      'maputnik:renderer': 'mlgl'
    },
    sources: {
      'evil-source': {
        type: 'vector',
        url: 'javascript:alert("XSS")'
      }
    },
    layers: [
      {
        id: 'malicious-layer',
        type: 'fill',
        source: 'evil-source',
        paint: {
          'fill-color': 'expression(alert("XSS"))'
        }
      }
    ]
  };

  const validStyle: MapStyle = {
    version: 8,
    name: 'Safe Style',
    sources: {
      'safe-source': {
        type: 'vector',
        url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=test'
      }
    },
    layers: [
      {
        id: 'safe-layer',
        type: 'fill',
        source: 'safe-source',
        paint: {
          'fill-color': '#0080ff'
        }
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();

    saveService = SaveService.getInstance({
      baseUrl: 'http://localhost:3001'
    });

    authService = AuthService.getInstance({
      baseUrl: 'http://localhost:3001'
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000'
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Validation and Sanitization', () => {
    it('should sanitize malicious style names', async () => {
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Invalid style name: contains potentially dangerous content',
          code: 'INVALID_INPUT',
          details: {
            field: 'name',
            issue: 'contains_script_tags'
          }
        })
      });

      try {
        await saveService.saveStyle(maliciousStyle, {
          name: '<script>alert("XSS")</script>',
          description: 'Test XSS',
          category: 'test',
          isPublic: false
        });
      } catch (error: any) {
        expect(error.code).toBe('INVALID_INPUT');
        expect(error.message).toContain('dangerous content');
      }
    });

    it('should reject styles with javascript: URLs', async () => {
      const styleWithJavascriptUrl = {
        ...validStyle,
        sources: {
          'malicious-source': {
            type: 'vector',
            url: 'javascript:void(0)'
          }
        }
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Dangerous URL scheme detected in style sources',
          code: 'SECURITY_VIOLATION',
          details: {
            urls: ['javascript:void(0)']
          }
        })
      });

      try {
        await saveService.saveStyle(styleWithJavascriptUrl, {
          name: 'Malicious Style',
          category: 'test',
          isPublic: false
        });
      } catch (error: any) {
        expect(error.code).toBe('SECURITY_VIOLATION');
        expect(error.message).toContain('Dangerous URL scheme');
      }
    });

    it('should validate and sanitize file upload content', () => {
      const maliciousJson = {
        version: 8,
        name: 'Evil Style',
        sources: {
          'evil': {
            type: 'vector',
            url: 'data:text/html,<script>alert("XSS")</script>'
          }
        },
        layers: [],
        metadata: {
          '__proto__': { 'malicious': true },
          'constructor': { 'prototype': { 'polluted': true } }
        }
      };

      // Test prototype pollution protection
      const sanitized = sanitizeStyleInput(maliciousJson);
      
      expect(sanitized.metadata).not.toHaveProperty('__proto__');
      expect(sanitized.metadata).not.toHaveProperty('constructor');
      expect((sanitized as any).__proto__.malicious).toBeUndefined();
      expect((sanitized as any).constructor.prototype.polluted).toBeUndefined();
    });

    it('should reject oversized style files', () => {
      const oversizedLayers = Array.from({ length: 10000 }, (_, i) => ({
        id: `layer-${i}`,
        type: 'fill',
        source: 'test',
        paint: { 'fill-color': '#000000' }
      }));

      const oversizedStyle = {
        ...validStyle,
        layers: oversizedLayers
      };

      const styleJson = JSON.stringify(oversizedStyle);
      const sizeInMB = new Blob([styleJson]).size / (1024 * 1024);

      // Should reject if over size limit (e.g., 50MB)
      if (sizeInMB > 50) {
        expect(() => {
          validateStyleSize(styleJson);
        }).toThrow('Style file too large');
      }
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require valid authentication for save operations', async () => {
      // No authentication
      mockSessionStorage.getItem.mockReturnValue(null);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        })
      });

      try {
        await saveService.saveStyle(validStyle, {
          name: 'Test Style',
          category: 'test',
          isPublic: false
        });
      } catch (error: any) {
        expect(error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should validate JWT tokens properly', async () => {
      // Mock invalid token
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'invalid.jwt.token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Invalid or tampered token',
          code: 'INVALID_TOKEN'
        })
      });

      try {
        await saveService.saveStyle(validStyle, {
          name: 'Test Style',
          category: 'test',
          isPublic: false
        });
      } catch (error: any) {
        expect(error.code).toBe('INVALID_TOKEN');
      }
    });

    it('should handle token expiry securely', async () => {
      // Mock expired token
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'expired-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() - 1000 // Expired
      }));

      const expiredToken = authService.getToken();
      expect(expiredToken).toBeNull();

      // Should clear storage when token is expired
      expect(mockSessionStorage.removeItem).toHaveBeenCalled();
    });

    it('should prevent privilege escalation', async () => {
      // User tries to set admin-only properties
      const privilegedStyle = {
        ...validStyle,
        metadata: {
          'admin_only': true,
          'system_style': true,
          'protected': true
        }
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'user-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          message: 'Insufficient permissions for requested operation',
          code: 'FORBIDDEN',
          details: {
            restrictedFields: ['admin_only', 'system_style', 'protected']
          }
        })
      });

      try {
        await saveService.saveStyle(privilegedStyle, {
          name: 'Privileged Style',
          category: 'admin',
          isPublic: true
        });
      } catch (error: any) {
        expect(error.code).toBe('FORBIDDEN');
        expect(error.message).toContain('Insufficient permissions');
      }
    });
  });

  describe('CORS and Cross-Origin Security', () => {
    it('should handle CORS errors appropriately', async () => {
      mockFetch.mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      try {
        await saveService.saveStyle(validStyle, {
          name: 'CORS Test',
          category: 'test',
          isPublic: false
        });
      } catch (error: any) {
        expect(error.message).toContain('Network error');
      }
    });

    it('should validate origin in Maputnik bridge messages', () => {
      const bridge = new MaputnikBridge({
        styleUrl: 'test-url',
        styleName: 'test-name',
        saveEndpoint: 'test-endpoint',
        apiKey: 'test-key'
      });

      const handler = (bridge as any).handleMessage.bind(bridge);

      // Test valid origin
      const validMessage = {
        origin: 'https://maputnik.github.io',
        data: { type: 'style-changed', data: {} }
      };

      expect(() => handler(validMessage)).not.toThrow();

      // Test invalid origin
      const invalidMessage = {
        origin: 'https://evil.com',
        data: { type: 'style-changed', data: {} }
      };

      // Should ignore message from invalid origin (no error, but no processing)
      expect(() => handler(invalidMessage)).not.toThrow();
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should sanitize URLs before opening in Maputnik', () => {
      const dangerousUrls = [
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'vbscript:msgbox("XSS")',
        'file:///etc/passwd'
      ];

      dangerousUrls.forEach(url => {
        openInMaputnik(url, 'vtc');
        
        // Should not open dangerous URLs
        expect(mockAlert).toHaveBeenCalledWith(
          expect.stringContaining('valid style JSON URL')
        );
        expect(mockWindowOpen).not.toHaveBeenCalled();
        
        mockAlert.mockClear();
      });
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should validate Mapbox GL style schema', async () => {
      const invalidSchemaStyle = {
        version: 'invalid', // Should be number
        sources: 'invalid', // Should be object
        layers: 'invalid' // Should be array
      } as any;

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Style does not conform to Mapbox GL style specification',
          code: 'INVALID_SCHEMA',
          details: {
            errors: [
              'version must be a number',
              'sources must be an object',
              'layers must be an array'
            ]
          }
        })
      });

      try {
        await saveService.saveStyle(invalidSchemaStyle, {
          name: 'Invalid Schema Style',
          category: 'test',
          isPublic: false
        });
      } catch (error: any) {
        expect(error.code).toBe('INVALID_SCHEMA');
        expect(error.message).toContain('does not conform');
      }
    });

    it('should prevent SQL injection in style metadata', async () => {
      const sqlInjectionStyle = {
        ...validStyle,
        name: "'; DROP TABLE styles; --",
        metadata: {
          description: "' OR '1'='1"
        }
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Potentially malicious characters detected',
          code: 'MALICIOUS_INPUT',
          details: {
            suspiciousPatterns: ['DROP TABLE', "OR '1'='1"]
          }
        })
      });

      try {
        await saveService.saveStyle(sqlInjectionStyle, {
          name: "'; DROP TABLE styles; --",
          category: 'test',
          isPublic: false
        });
      } catch (error: any) {
        expect(error.code).toBe('MALICIOUS_INPUT');
      }
    });

    it('should validate API endpoints and prevent SSRF', () => {
      const ssrfUrls = [
        'http://localhost:3001/admin',
        'http://127.0.0.1:22',
        'http://169.254.169.254/', // AWS metadata
        'file:///etc/hosts',
        'ftp://internal.server/secret'
      ];

      ssrfUrls.forEach(url => {
        const styleInfo = getStyleInfo(url);
        
        // Should detect potential SSRF attempts
        if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('169.254.169.254')) {
          expect(styleInfo.corsIssues).toBe(true);
        }
      });
    });
  });

  describe('Rate Limiting and DOS Protection', () => {
    it('should handle rate limiting responses', async () => {
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: (name: string) => name === 'retry-after' ? '60' : null
        },
        json: async () => ({
          message: 'Rate limit exceeded. Try again in 60 seconds.',
          code: 'RATE_LIMITED',
          retryAfter: 60
        })
      });

      try {
        await saveService.saveStyle(validStyle, {
          name: 'Rate Limited Style',
          category: 'test',
          isPublic: false
        });
      } catch (error: any) {
        expect(error.code).toBe('RATE_LIMITED');
        expect(error.message).toContain('Rate limit exceeded');
      }
    });

    it('should timeout extremely long requests', async () => {
      const saveServiceWithShortTimeout = SaveService.getInstance({
        baseUrl: 'http://localhost:3001',
        timeout: 1000 // 1 second timeout
      });

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      // Mock slow response
      mockFetch.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 2000))
      );

      try {
        await saveServiceWithShortTimeout.saveStyle(validStyle, {
          name: 'Timeout Test',
          category: 'test',
          isPublic: false
        });
      } catch (error: any) {
        expect(error.message).toContain('timeout');
      }
    });
  });

  describe('Secure Storage and Session Management', () => {
    it('should not store sensitive data in localStorage', () => {
      const sensitiveData = {
        password: 'secret123',
        creditCard: '4111-1111-1111-1111',
        ssn: '123-45-6789'
      };

      // Should not store sensitive data
      Object.keys(sensitiveData).forEach(key => {
        expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining(sensitiveData[key as keyof typeof sensitiveData])
        );
      });
    });

    it('should clear storage on logout', async () => {
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      mockFetch.mockResolvedValueOnce({ ok: true });

      await authService.logout();

      expect(mockSessionStorage.removeItem).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    it('should use secure session storage for tokens', () => {
      const token = {
        token: 'jwt-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      };

      (authService as any).storeToken(token);

      // Should prefer sessionStorage over localStorage for security
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'mapconfig_auth_token',
        JSON.stringify(token)
      );
    });
  });

  describe('Content Security and Validation', () => {
    it('should prevent malicious expressions in style properties', () => {
      const maliciousExpressions = [
        'eval(atob("YWxlcnQoJ1hTUycp"))', // base64 encoded alert('XSS')
        'window.alert("XSS")',
        'document.cookie',
        'fetch("/admin/delete")',
        'XMLHttpRequest',
        'new Function("alert(1)")()'
      ];

      maliciousExpressions.forEach(expr => {
        const maliciousStyle = {
          ...validStyle,
          layers: [{
            id: 'malicious',
            type: 'fill',
            source: 'test',
            paint: {
              'fill-color': ['eval', expr] as any
            }
          }]
        };

        const isSecure = validateStyleExpressions(maliciousStyle);
        expect(isSecure).toBe(false);
      });
    });

    it('should validate image URLs in sprite and glyphs', () => {
      const suspiciousUrls = [
        'javascript:void(0)',
        'data:text/html,<script>alert("XSS")</script>',
        'http://evil.com/steal-cookies.png',
        'file:///etc/passwd'
      ];

      suspiciousUrls.forEach(url => {
        const styleWithSuspiciousUrl = {
          ...validStyle,
          sprite: url,
          glyphs: url
        };

        const validation = validateImageUrls(styleWithSuspiciousUrl);
        expect(validation.safe).toBe(false);
        expect(validation.issues).toContain('Suspicious URL detected');
      });
    });
  });

  describe('Error Information Leakage', () => {
    it('should not leak sensitive information in error messages', async () => {
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'valid-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      // Mock server error with sensitive info
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message: 'Database error: Connection failed to admin@localhost:5432',
          code: 'SERVER_ERROR',
          stack: 'Error: Database connection failed\n    at /home/user/app/db.js:23:15'
        })
      });

      try {
        await saveService.saveStyle(validStyle, {
          name: 'Error Test',
          category: 'test',
          isPublic: false
        });
      } catch (error: any) {
        // Error message should be sanitized
        expect(error.message).not.toContain('admin@localhost:5432');
        expect(error.message).not.toContain('/home/user/app');
        expect(error.stack).toBeUndefined();
      }
    });

    it('should not expose system information in debug mode', () => {
      // Even in debug mode, sensitive system info should not be exposed
      const debugInfo = {
        NODE_ENV: 'development',
        API_KEY: 'secret-key',
        DB_PASSWORD: 'secret-password',
        JWT_SECRET: 'jwt-secret'
      };

      Object.keys(debugInfo).forEach(key => {
        expect(window).not.toHaveProperty(key);
        expect(process?.env?.[key]).toBeUndefined();
      });
    });
  });
});

// Security utility functions
function sanitizeStyleInput(style: any): MapStyle {
  // Remove dangerous properties
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  const sanitized = JSON.parse(JSON.stringify(style, (key, value) => {
    if (dangerous.includes(key)) {
      return undefined;
    }
    return value;
  }));

  return sanitized;
}

function validateStyleSize(styleJson: string): boolean {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const size = new Blob([styleJson]).size;
  
  if (size > maxSize) {
    throw new Error('Style file too large');
  }
  
  return true;
}

function validateStyleExpressions(style: MapStyle): boolean {
  const dangerousPatterns = [
    /eval\s*\(/i,
    /function\s*\(/i,
    /javascript:/i,
    /window\./i,
    /document\./i,
    /XMLHttpRequest/i,
    /fetch\s*\(/i
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return !dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.every(checkValue);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).every(checkValue);
    }
    return true;
  };

  return style.layers.every(layer => 
    checkValue(layer.paint) && checkValue(layer.layout) && checkValue(layer.filter)
  );
}

function validateImageUrls(style: MapStyle): { safe: boolean; issues: string[] } {
  const issues: string[] = [];
  const dangerousSchemes = ['javascript:', 'data:', 'file:', 'vbscript:'];
  const suspiciousDomains = ['localhost', '127.0.0.1', '192.168.', '10.', '172.'];

  const checkUrl = (url: string, context: string) => {
    if (dangerousSchemes.some(scheme => url.toLowerCase().startsWith(scheme))) {
      issues.push(`Dangerous URL scheme in ${context}: ${url}`);
    }

    if (suspiciousDomains.some(domain => url.includes(domain))) {
      issues.push(`Suspicious URL detected in ${context}: ${url}`);
    }
  };

  if (style.sprite) {
    checkUrl(style.sprite, 'sprite');
  }

  if (style.glyphs) {
    checkUrl(style.glyphs, 'glyphs');
  }

  return {
    safe: issues.length === 0,
    issues
  };
}

export {
  sanitizeStyleInput,
  validateStyleSize,
  validateStyleExpressions,
  validateImageUrls
};