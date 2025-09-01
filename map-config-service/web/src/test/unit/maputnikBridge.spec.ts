import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  MaputnikBridge, 
  createMaputnikBookmarklet,
  browserExtensionScript,
  type MaputnikConfig 
} from '../../utils/maputnikBridge';

// Mock environment
vi.stubEnv('VITE_CUSTOM_MAPUTNIK_URL', 'https://custom-maputnik.example.com/');

// Mock window methods
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
const mockPostMessage = vi.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true
});

// Mock sessionStorage
const mockSessionStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Mock DOM methods
document.createElement = vi.fn().mockImplementation((tagName: string) => {
  const element = {
    tagName,
    src: '',
    style: {},
    appendChild: vi.fn(),
    remove: vi.fn(),
    contentWindow: {
      postMessage: mockPostMessage
    }
  };
  return element as any;
});

describe('MaputnikBridge', () => {
  let bridge: MaputnikBridge;
  let config: MaputnikConfig;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.setItem.mockClear();
    mockSessionStorage.getItem.mockClear();
    mockSessionStorage.removeItem.mockClear();

    config = {
      styleUrl: 'https://example.com/style.json',
      styleName: 'Test Style',
      saveEndpoint: 'https://api.example.com/save',
      apiKey: 'test-api-key'
    };

    bridge = new MaputnikBridge(config);

    mockContainer = {
      appendChild: vi.fn()
    } as any;

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://example.com'
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with provided config', () => {
      expect(bridge).toBeInstanceOf(MaputnikBridge);
      expect((bridge as any).config).toEqual(config);
    });
  });

  describe('openMaputnik', () => {
    it('should return correct Maputnik URL', () => {
      const url = bridge.openMaputnik({
        styleFile: 'test-style.json',
        onSave: vi.fn()
      });

      expect(url).toBe('https://maputnik.github.io/editor/#https://example.com/styles/test-style.json');
    });

    it('should store save callback', () => {
      const onSave = vi.fn();
      bridge.openMaputnik({
        styleFile: 'test-style.json',
        onSave
      });

      expect((bridge as any).saveCallback).toBe(onSave);
    });

    it('should encode style URL correctly', () => {
      const url = bridge.openMaputnik({
        styleFile: 'complex style.json'
      });

      expect(url).toBe('https://maputnik.github.io/editor/#https://example.com/styles/complex style.json');
    });
  });

  describe('createCustomMaputnik', () => {
    it('should create iframe element', () => {
      bridge.createCustomMaputnik(mockContainer, 'test-style.json');

      expect(document.createElement).toHaveBeenCalledWith('iframe');
      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should set up message listener', () => {
      bridge.createCustomMaputnik(mockContainer, 'test-style.json');

      expect(mockAddEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should configure iframe properties', () => {
      const mockElement = {
        src: '',
        style: {},
        appendChild: vi.fn(),
        remove: vi.fn(),
        contentWindow: { postMessage: mockPostMessage }
      };

      (document.createElement as any).mockReturnValue(mockElement);

      bridge.createCustomMaputnik(mockContainer, 'test-style.json');

      expect(mockElement.style).toMatchObject({
        width: '100%',
        height: '100%',
        border: 'none'
      });
      expect(mockElement.src).toContain('https://custom-maputnik.example.com/');
    });
  });

  describe('buildCustomMaputnikUrl', () => {
    it('should build URL with encoded config', () => {
      const bridge = new MaputnikBridge(config);
      const url = (bridge as any).buildCustomMaputnikUrl('test-style.json');

      expect(url).toContain('https://custom-maputnik.example.com/');
      expect(url).toContain('#config=');
      
      // Decode and verify config
      const encodedConfig = url.split('#config=')[1];
      const decodedConfig = JSON.parse(atob(encodedConfig));
      
      expect(decodedConfig).toMatchObject({
        style: 'https://example.com/styles/test-style.json',
        webhook: {
          url: 'https://example.com/api/styles/test-style.json',
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }
        },
        autoSave: true,
        autoSaveInterval: 30000
      });
    });

    it('should use default Maputnik URL if custom not set', () => {
      vi.stubEnv('VITE_CUSTOM_MAPUTNIK_URL', undefined);
      
      const bridge = new MaputnikBridge(config);
      const url = (bridge as any).buildCustomMaputnikUrl('test-style.json');

      expect(url).toContain('https://maputnik.github.io/editor/');
    });
  });

  describe('handleMessage', () => {
    let bridge: MaputnikBridge;

    beforeEach(() => {
      bridge = new MaputnikBridge(config);
      bridge.createCustomMaputnik(mockContainer, 'test-style.json');
    });

    it('should ignore messages from non-Maputnik origins', () => {
      const handler = (bridge as any).handleMessage.bind(bridge);
      const event = {
        origin: 'https://evil.com',
        data: { type: 'test' }
      };

      expect(() => handler(event)).not.toThrow();
    });

    it('should handle style-changed messages', () => {
      const handler = (bridge as any).handleMessage.bind(bridge);
      const styleData = { version: 8, layers: [] };
      const event = {
        origin: 'https://maputnik.github.io',
        data: { type: 'style-changed', data: styleData }
      };

      handler(event);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'maputnik-current-style',
        JSON.stringify(styleData)
      );
    });

    it('should handle save-requested messages', async () => {
      const mockSaveCallback = vi.fn().mockResolvedValue(undefined);
      (bridge as any).saveCallback = mockSaveCallback;

      const handler = (bridge as any).handleMessage.bind(bridge);
      const styleData = { version: 8, layers: [] };
      const event = {
        origin: 'https://maputnik.github.io',
        data: { type: 'save-requested', data: styleData }
      };

      await handler(event);

      expect(mockSaveCallback).toHaveBeenCalledWith(styleData);
    });

    it('should handle maputnik-ready messages', () => {
      const sendToMaputnikSpy = vi.spyOn(bridge as any, 'sendToMaputnik');
      
      const handler = (bridge as any).handleMessage.bind(bridge);
      const event = {
        origin: 'https://maputnik.github.io',
        data: { type: 'maputnik-ready' }
      };

      handler(event);

      expect(sendToMaputnikSpy).toHaveBeenCalledWith('configure', {
        webhook: config.saveEndpoint,
        autoSave: true
      });
    });
  });

  describe('saveStyle', () => {
    it('should use custom save callback if provided', async () => {
      const mockSaveCallback = vi.fn().mockResolvedValue(undefined);
      (bridge as any).saveCallback = mockSaveCallback;
      
      const styleData = { version: 8, layers: [] };
      await (bridge as any).saveStyle(styleData);

      expect(mockSaveCallback).toHaveBeenCalledWith(styleData);
    });

    it('should use default fetch implementation if no callback', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
      global.fetch = mockFetch;

      const styleData = { version: 8, layers: [] };
      await (bridge as any).saveStyle(styleData);

      expect(mockFetch).toHaveBeenCalledWith(config.saveEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(styleData)
      });
    });

    it('should throw error on failed save', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      });
      global.fetch = mockFetch;

      const styleData = { version: 8, layers: [] };

      await expect((bridge as any).saveStyle(styleData)).rejects.toThrow('Failed to save style');
    });

    it('should send save-complete message after successful save', async () => {
      const mockSaveCallback = vi.fn().mockResolvedValue(undefined);
      (bridge as any).saveCallback = mockSaveCallback;
      
      const sendToMaputnikSpy = vi.spyOn(bridge as any, 'sendToMaputnik');

      const styleData = { version: 8, layers: [] };
      await (bridge as any).saveStyle(styleData);

      expect(sendToMaputnikSpy).toHaveBeenCalledWith('save-complete', { success: true });
    });
  });

  describe('sendToMaputnik', () => {
    it('should post message to iframe', () => {
      bridge.createCustomMaputnik(mockContainer, 'test-style.json');
      
      (bridge as any).sendToMaputnik('test-type', { data: 'test' });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'test-type',
        data: { data: 'test' }
      }, '*');
    });

    it('should not crash if iframe is not available', () => {
      expect(() => {
        (bridge as any).sendToMaputnik('test-type', { data: 'test' });
      }).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should clean up event listeners and remove iframe', () => {
      bridge.createCustomMaputnik(mockContainer, 'test-style.json');
      const mockIframe = (bridge as any).iframe;
      
      bridge.destroy();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockIframe.remove).toHaveBeenCalled();
      expect((bridge as any).iframe).toBeNull();
    });

    it('should not crash if no iframe exists', () => {
      expect(() => bridge.destroy()).not.toThrow();
    });
  });
});

describe('createMaputnikBookmarklet', () => {
  it('should create valid bookmarklet code', () => {
    const bookmarklet = createMaputnikBookmarklet(
      'https://api.example.com',
      'test-api-key'
    );

    expect(bookmarklet).toContain('javascript:');
    expect(bookmarklet).toContain('https://api.example.com');
    expect(bookmarklet).toContain('test-api-key');
    expect(bookmarklet).toContain('window.mapboxglMaputnik.store.getState().style.present');
  });

  it('should be properly minified', () => {
    const bookmarklet = createMaputnikBookmarklet(
      'https://api.example.com',
      'test-api-key'
    );

    // Should not contain excessive whitespace
    expect(bookmarklet).not.toContain('  '); // No double spaces
    expect(bookmarklet).not.toContain('\n');
    expect(bookmarklet).not.toContain('\t');
  });

  it('should include error handling', () => {
    const bookmarklet = createMaputnikBookmarklet(
      'https://api.example.com',
      'test-api-key'
    );

    expect(bookmarklet).toContain('alert(\'Style saved successfully!\')');
    expect(bookmarklet).toContain('alert(\'Failed to save style\')');
    expect(bookmarklet).toContain('.catch(');
  });
});

describe('browserExtensionScript', () => {
  it('should contain injection logic', () => {
    expect(browserExtensionScript).toContain('injectSaveButton');
    expect(browserExtensionScript).toContain('maputnik-toolbar');
    expect(browserExtensionScript).toContain('maputnik-button');
  });

  it('should include retry mechanism', () => {
    expect(browserExtensionScript).toContain('setTimeout(injectSaveButton, 1000)');
  });

  it('should check for Maputnik environment', () => {
    expect(browserExtensionScript).toContain('maputnik.github.io');
  });

  it('should include save functionality', () => {
    expect(browserExtensionScript).toContain('window.mapboxglMaputnik.store.getState().style.present');
    expect(browserExtensionScript).toContain('window.VERCEL_SAVE_ENDPOINT');
    expect(browserExtensionScript).toContain('window.VERCEL_API_KEY');
  });

  it('should have proper button styling', () => {
    expect(browserExtensionScript).toContain('Save to Vercel');
    expect(browserExtensionScript).toContain('maputnik-button');
  });
});

describe('Error Handling', () => {
  let bridge: MaputnikBridge;

  beforeEach(() => {
    bridge = new MaputnikBridge(config);
  });

  it('should handle message parsing errors gracefully', () => {
    const handler = (bridge as any).handleMessage.bind(bridge);
    const event = {
      origin: 'https://maputnik.github.io',
      data: null // This could cause issues
    };

    expect(() => handler(event)).not.toThrow();
  });

  it('should handle network errors in save operation', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    const styleData = { version: 8, layers: [] };

    await expect((bridge as any).saveStyle(styleData)).rejects.toThrow('Network error');
  });

  it('should handle malformed iframe content window', () => {
    const mockElement = {
      src: '',
      style: {},
      appendChild: vi.fn(),
      remove: vi.fn(),
      contentWindow: null // Malformed iframe
    };

    (document.createElement as any).mockReturnValue(mockElement);

    bridge.createCustomMaputnik(mockContainer, 'test-style.json');

    // Should not crash when trying to send messages
    expect(() => {
      (bridge as any).sendToMaputnik('test-type', {});
    }).not.toThrow();
  });
});