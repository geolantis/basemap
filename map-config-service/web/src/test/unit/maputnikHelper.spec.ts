import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  openInMaputnik, 
  canOpenInMaputnik, 
  getStyleInfo 
} from '../../utils/maputnikHelper';

// Mock window.open and alert
const mockWindowOpen = vi.fn();
const mockAlert = vi.fn();

Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true
});

Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true
});

describe('MaputnikHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockReturnValue({});
    
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

  describe('openInMaputnik', () => {
    it('should reject invalid style URLs', () => {
      openInMaputnik(undefined, 'vtc');
      expect(mockAlert).toHaveBeenCalledWith('Maputnik editor requires a valid style JSON URL. Received: undefined');
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('should reject tiles type URLs', () => {
      openInMaputnik('tiles', 'vtc');
      expect(mockAlert).toHaveBeenCalledWith('Maputnik editor requires a valid style JSON URL. Received: tiles');
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('should handle GitHub raw URLs correctly', () => {
      const styleUrl = 'https://raw.githubusercontent.com/user/repo/main/style.json';
      openInMaputnik(styleUrl, 'vtc');

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://maputnik.github.io/editor/#${styleUrl}`,
        '_blank'
      );
    });

    it('should handle MapTiler URLs with API key', () => {
      const styleUrl = 'https://api.maptiler.com/maps/streets/style.json?key=abc123';
      openInMaputnik(styleUrl, 'vtc');

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://maputnik.github.io/editor/#${styleUrl}`,
        '_blank'
      );
    });

    it('should warn about MapTiler URLs without API key', () => {
      const styleUrl = 'https://api.maptiler.com/maps/streets/style.json';
      openInMaputnik(styleUrl, 'vtc');

      expect(mockAlert).toHaveBeenCalledWith('MapTiler styles require an API key. Please add your key to the URL.');
      expect(mockWindowOpen).toHaveBeenCalled();
    });

    it('should handle Clockwork Micro URLs with API key', () => {
      const styleUrl = 'https://maps.clockworkmicro.com/style.json?x-api-key=xyz789';
      openInMaputnik(styleUrl, 'vtc');

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://maputnik.github.io/editor/#${styleUrl}`,
        '_blank'
      );
    });

    it('should warn about Clockwork Micro URLs without API key', () => {
      const styleUrl = 'https://maps.clockworkmicro.com/style.json';
      openInMaputnik(styleUrl, 'vtc');

      expect(mockAlert).toHaveBeenCalledWith('Clockwork Micro styles require an API key. The style may not load properly.');
      expect(mockWindowOpen).toHaveBeenCalled();
    });

    it('should handle government service URLs', () => {
      const styleUrl = 'https://gis.ktn.gv.at/styles/basemap.json';
      openInMaputnik(styleUrl, 'vtc');

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://maputnik.github.io/editor/#${styleUrl}`,
        '_blank'
      );
    });

    it('should convert relative URLs to absolute in development', () => {
      const styleUrl = 'basemap.json';
      openInMaputnik(styleUrl, 'vtc');

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://maputnik.github.io/editor/#http://localhost:3001/api/styles/basemap',
        '_blank'
      );
    });

    it('should convert relative URLs to absolute in production', () => {
      // Mock production environment
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'example.com',
          origin: 'https://example.com'
        },
        writable: true
      });

      const styleUrl = 'basemap.json';
      openInMaputnik(styleUrl, 'vtc');

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://maputnik.github.io/editor/#https://basemap-styles.vercel.app/api/styles/basemap',
        '_blank'
      );
    });

    it('should handle paths starting with /', () => {
      const styleUrl = '/api/styles/custom.json';
      openInMaputnik(styleUrl, 'vtc');

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://maputnik.github.io/editor/#http://localhost:3000/api/styles/custom.json',
        '_blank'
      );
    });

    it('should handle popup blocking', () => {
      mockWindowOpen.mockReturnValue(null);
      const styleUrl = 'https://example.com/style.json';
      
      openInMaputnik(styleUrl, 'vtc');

      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Popup blocked! Please allow popups for this site or copy this URL:')
      );
    });

    it('should log debug information', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const styleUrl = 'test-style.json';
      
      openInMaputnik(styleUrl, 'vtc');

      expect(consoleSpy).toHaveBeenCalledWith('=== MAPUTNIK DEBUG ===');
      expect(consoleSpy).toHaveBeenCalledWith('Received styleUrl:', styleUrl);
      expect(consoleSpy).toHaveBeenCalledWith('Received configType:', 'vtc');
      
      consoleSpy.mockRestore();
    });
  });

  describe('canOpenInMaputnik', () => {
    it('should return true for configs with valid style URL', () => {
      const config = {
        style: 'https://example.com/style.json',
        type: 'vtc'
      };
      
      expect(canOpenInMaputnik(config)).toBe(true);
    });

    it('should return true for configs with originalStyle fallback', () => {
      const config = {
        originalStyle: 'https://example.com/style.json',
        type: 'vtc'
      };
      
      expect(canOpenInMaputnik(config)).toBe(true);
    });

    it('should return false for configs without style URL', () => {
      const config = {
        type: 'vtc'
      };
      
      expect(canOpenInMaputnik(config)).toBe(false);
    });

    it('should return false for configs with tiles type', () => {
      const config = {
        style: 'tiles',
        type: 'vtc'
      };
      
      expect(canOpenInMaputnik(config)).toBe(false);
    });

    it('should return false for configs with non-string style', () => {
      const config = {
        style: 123,
        type: 'vtc'
      };
      
      expect(canOpenInMaputnik(config)).toBe(false);
    });

    it('should work for any config type, not just vtc', () => {
      const config = {
        style: 'https://example.com/style.json',
        type: 'raster'
      };
      
      expect(canOpenInMaputnik(config)).toBe(true);
    });
  });

  describe('getStyleInfo', () => {
    it('should identify MapTiler provider correctly', () => {
      const result = getStyleInfo('https://api.maptiler.com/maps/streets/style.json');
      
      expect(result.provider).toBe('MapTiler');
      expect(result.needsApiKey).toBe(true);
      expect(result.corsIssues).toBe(false);
    });

    it('should identify MapTiler with API key', () => {
      const result = getStyleInfo('https://api.maptiler.com/maps/streets/style.json?key=abc123');
      
      expect(result.provider).toBe('MapTiler');
      expect(result.needsApiKey).toBe(false);
      expect(result.corsIssues).toBe(false);
    });

    it('should identify Clockwork Micro provider', () => {
      const result = getStyleInfo('https://maps.clockworkmicro.com/style.json');
      
      expect(result.provider).toBe('Clockwork Micro');
      expect(result.needsApiKey).toBe(true);
      expect(result.corsIssues).toBe(false);
    });

    it('should identify Clockwork Micro with API key', () => {
      const result = getStyleInfo('https://maps.clockworkmicro.com/style.json?x-api-key=xyz789');
      
      expect(result.provider).toBe('Clockwork Micro');
      expect(result.needsApiKey).toBe(false);
      expect(result.corsIssues).toBe(false);
    });

    it('should identify GitHub provider', () => {
      const result = getStyleInfo('https://raw.githubusercontent.com/user/repo/main/style.json');
      
      expect(result.provider).toBe('GitHub');
      expect(result.needsApiKey).toBe(false);
      expect(result.corsIssues).toBe(false);
    });

    it('should identify Kärnten GIS provider', () => {
      const result = getStyleInfo('https://gis.ktn.gv.at/styles/basemap.json');
      
      expect(result.provider).toBe('Kärnten GIS');
      expect(result.needsApiKey).toBe(false);
      expect(result.corsIssues).toBe(true);
    });

    it('should identify BKG Germany provider', () => {
      const result = getStyleInfo('https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_gry.json');
      
      expect(result.provider).toBe('BKG Germany');
      expect(result.needsApiKey).toBe(false);
      expect(result.corsIssues).toBe(true);
    });

    it('should handle unknown providers', () => {
      const result = getStyleInfo('https://unknown.example.com/style.json');
      
      expect(result.provider).toBe('unknown');
      expect(result.needsApiKey).toBe(false);
      expect(result.corsIssues).toBe(false);
    });
  });

  describe('Environment Detection', () => {
    it('should detect development environment correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      openInMaputnik('test.json', 'vtc');
      
      expect(consoleSpy).toHaveBeenCalledWith('Environment:', 'Development');
      expect(consoleSpy).toHaveBeenCalledWith('Styles server URL:', 'http://localhost:3001/api/styles');
      
      consoleSpy.mockRestore();
    });

    it('should detect production environment correctly', () => {
      // Mock production environment
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'production.example.com',
          origin: 'https://production.example.com'
        },
        writable: true
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      openInMaputnik('test.json', 'vtc');
      
      expect(consoleSpy).toHaveBeenCalledWith('Environment:', 'Production');
      expect(consoleSpy).toHaveBeenCalledWith('Styles server URL:', 'https://basemap-styles.vercel.app/api/styles');
      
      consoleSpy.mockRestore();
    });

    it('should handle 127.0.0.1 as development', () => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: '127.0.0.1',
          origin: 'http://127.0.0.1:3000'
        },
        writable: true
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      openInMaputnik('test.json', 'vtc');
      
      expect(consoleSpy).toHaveBeenCalledWith('Environment:', 'Development');
      
      consoleSpy.mockRestore();
    });
  });

  describe('URL Construction', () => {
    it('should construct correct Maputnik URLs for external URLs', () => {
      const styleUrl = 'https://example.com/style.json';
      openInMaputnik(styleUrl, 'vtc');

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://maputnik.github.io/editor/#${styleUrl}`,
        '_blank'
      );
    });

    it('should log alternative URL formats', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const styleUrl = 'https://example.com/style.json';
      
      openInMaputnik(styleUrl, 'vtc');

      expect(consoleSpy).toHaveBeenCalledWith('Alternative URL format:', 
        `https://maputnik.github.io/editor?style=${encodeURIComponent(styleUrl)}`);
      
      consoleSpy.mockRestore();
    });

    it('should provide helpful instructions when opening successfully', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const styleUrl = 'https://example.com/style.json';
      
      openInMaputnik(styleUrl, 'vtc');

      expect(consoleSpy).toHaveBeenCalledWith('=== MAPUTNIK OPENED ===');
      expect(consoleSpy).toHaveBeenCalledWith('If the style doesn\'t load automatically:');
      expect(consoleSpy).toHaveBeenCalledWith('Common issues:');
      
      consoleSpy.mockRestore();
    });
  });
});