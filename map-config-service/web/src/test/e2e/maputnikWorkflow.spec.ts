import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';

// Import components and services
import MapConfigList from '../../components/MapConfigList.vue';
import StyleUploadModal from '../../components/StyleUploadModal.vue';
import SaveStyleDialog from '../../components/SaveStyleDialog.vue';
import LoginModal from '../../components/LoginModal.vue';

import { useMapConfigStore } from '../../stores/mapConfig';
import { useAuthStore } from '../../stores/auth';
import { useSaveStore } from '../../stores/save';

import { MapConfigService } from '../../services/mapConfigService';
import { SaveService } from '../../services/saveService';
import { AuthService } from '../../services/authService';

import { openInMaputnik, canOpenInMaputnik } from '../../utils/maputnikHelper';
import { MaputnikBridge } from '../../utils/maputnikBridge';

// Mock external dependencies
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

// Mock URL.createObjectURL
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-blob-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true
});

describe('Maputnik E2E Workflow', () => {
  let pinia: any;
  let mapConfigStore: any;
  let authStore: any;
  let saveStore: any;

  const sampleMapConfig = {
    id: 'test-vtc-style',
    name: 'test-vtc-style',
    label: 'Test VTC Style',
    type: 'vtc',
    style: 'https://api.maptiler.com/maps/streets/style.json?key=test123',
    country: 'de',
    flag: '🇩🇪'
  };

  const sampleMaputnikStyle = {
    version: 8,
    name: 'Custom Maputnik Style',
    metadata: {
      'maputnik:renderer': 'mlgl',
      'maputnik:openmaptiles_access_token': 'test-token'
    },
    sources: {
      'openmaptiles': {
        type: 'vector',
        url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=test123'
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#f8f4f0' }
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: { 'fill-color': '#a8d8ea' }
      }
    ],
    glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=test123',
    sprite: 'https://api.maptiler.com/maps/streets/sprite?key=test123'
  };

  beforeAll(() => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockWindowOpen.mockReturnValue({});
    mockAlert.mockClear();

    // Reset storage mocks
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    mockSessionStorage.getItem.mockReturnValue(null);
    mockSessionStorage.setItem.mockClear();

    // Set up Pinia
    pinia = createPinia();
    setActivePinia(pinia);

    // Initialize stores
    mapConfigStore = useMapConfigStore();
    authStore = useAuthStore();
    saveStore = useSaveStore();

    // Set up environment
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('Complete Workflow: Browse -> Open in Maputnik -> Edit -> Save', () => {
    it('should complete the full workflow successfully', async () => {
      // Step 1: Mock loading map configurations
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ configs: [sampleMapConfig] })
      });

      const listWrapper = mount(MapConfigList, {
        global: { plugins: [pinia] }
      });

      // Wait for configs to load
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(listWrapper.text()).toContain('Test VTC Style');

      // Step 2: User clicks "Edit in Maputnik" button
      const editButton = listWrapper.find('[data-testid="edit-maputnik"]');
      
      if (editButton.exists()) {
        await editButton.trigger('click');
        
        expect(mockWindowOpen).toHaveBeenCalledWith(
          expect.stringContaining('maputnik.github.io'),
          '_blank'
        );
      }

      // Step 3: Simulate user authentication for saving
      // Mock login flow
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'jwt-token-12345',
          refreshToken: 'refresh-token-12345',
          expiresAt: Date.now() + (24 * 60 * 60 * 1000),
          user: {
            id: 'user-123',
            email: 'designer@example.com',
            name: 'Map Designer',
            role: 'user'
          }
        })
      });

      const loginWrapper = mount(LoginModal, {
        props: {
          visible: true,
          message: 'Please log in to save your Maputnik edits'
        },
        global: { plugins: [pinia] }
      });

      const emailInput = loginWrapper.find('input[type="email"]');
      const passwordInput = loginWrapper.find('input[type="password"]');
      const loginButton = loginWrapper.find('button[type="submit"]');

      await emailInput.setValue('designer@example.com');
      await passwordInput.setValue('password123');
      await loginButton.trigger('click');

      // Wait for login to complete
      await nextTick();
      expect(authStore.isAuthenticated).toBe(true);

      // Step 4: Simulate saving style from Maputnik
      // Mock style validation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          errors: [],
          warnings: ['No terrain source defined']
        })
      });

      // Mock style save
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          styleId: 'maputnik-custom-123',
          url: 'http://localhost:3001/api/styles/maputnik-custom-123/download',
          message: 'Style saved successfully',
          metadata: {
            name: 'Custom Maputnik Style',
            description: 'Edited with Maputnik editor',
            category: 'maputnik',
            isPublic: false,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
          }
        })
      });

      const saveWrapper = mount(SaveStyleDialog, {
        props: {
          visible: true,
          styleData: sampleMaputnikStyle,
          suggestedName: 'Custom Maputnik Style'
        },
        global: { plugins: [pinia] }
      });

      const nameInput = saveWrapper.find('input[id="styleName"]');
      const descriptionInput = saveWrapper.find('textarea[id="description"]');
      const categorySelect = saveWrapper.find('select[id="category"]');
      const saveButton = saveWrapper.find('button[type="submit"]');

      await nameInput.setValue('Custom Maputnik Style');
      await descriptionInput.setValue('Edited with Maputnik editor');
      await categorySelect.setValue('maputnik');
      await saveButton.trigger('click');

      // Wait for save to complete
      await nextTick();
      expect(saveStore.lastSavedId).toBe('maputnik-custom-123');
      expect(saveWrapper.emitted('style-saved')).toBeTruthy();
    });

    it('should handle errors in the workflow gracefully', async () => {
      // Step 1: Mock authentication failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Invalid credentials'
        })
      });

      const loginWrapper = mount(LoginModal, {
        props: {
          visible: true,
          message: 'Authentication required'
        },
        global: { plugins: [pinia] }
      });

      const emailInput = loginWrapper.find('input[type="email"]');
      const passwordInput = loginWrapper.find('input[type="password"]');
      const loginButton = loginWrapper.find('button[type="submit"]');

      await emailInput.setValue('user@example.com');
      await passwordInput.setValue('wrongpassword');
      await loginButton.trigger('click');

      await nextTick();

      // Should show error message
      expect(loginWrapper.text()).toContain('Invalid credentials');
      expect(authStore.isAuthenticated).toBe(false);

      // Step 2: Mock network error during save
      // First authenticate successfully
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'valid-token',
          user: { id: 'user-123', email: 'user@example.com', role: 'user' },
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        })
      });

      await loginButton.trigger('click');
      await nextTick();

      // Then mock network failure on save
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      const saveWrapper = mount(SaveStyleDialog, {
        props: {
          visible: true,
          styleData: sampleMaputnikStyle
        },
        global: { plugins: [pinia] }
      });

      const saveButton = saveWrapper.find('button[type="submit"]');
      await saveButton.trigger('click');

      await nextTick();

      // Should handle network error gracefully
      expect(saveWrapper.text()).toContain('Network error');
    });
  });

  describe('Style Upload Workflow', () => {
    it('should allow users to upload custom Maputnik styles', async () => {
      // Mock file upload
      const mockFile = new File(
        [JSON.stringify(sampleMaputnikStyle)],
        'custom-style.json',
        { type: 'application/json' }
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Style uploaded successfully',
          config: {
            id: 'uploaded-style-123',
            name: 'custom-maputnik-style',
            label: 'Custom Maputnik Style',
            type: 'vtc',
            style: 'http://localhost:3001/api/styles/custom-maputnik-style.json',
            country: 'de',
            flag: '🇩🇪'
          }
        })
      });

      const uploadWrapper = mount(StyleUploadModal, {
        props: { visible: true },
        global: { plugins: [pinia] }
      });

      // Simulate file selection
      const fileInput = uploadWrapper.find('input[type="file"]');
      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        configurable: true
      });

      await fileInput.trigger('change');
      await nextTick();

      // Fill in form details
      const nameInput = uploadWrapper.find('input[placeholder*="Enter style name"]');
      const labelInput = uploadWrapper.find('input[placeholder*="Display label"]');
      const countrySelect = uploadWrapper.find('select');
      const typeSelect = uploadWrapper.find('select[data-testid="style-type"]');

      await nameInput.setValue('custom-maputnik-style');
      await labelInput.setValue('Custom Maputnik Style');
      await countrySelect.setValue('de');
      
      if (typeSelect.exists()) {
        await typeSelect.setValue('vtc');
      }

      // Submit upload
      const uploadButton = uploadWrapper.find('button[type="submit"]');
      await uploadButton.trigger('click');

      await nextTick();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );

      expect(uploadWrapper.emitted('upload-success')).toBeTruthy();
    });

    it('should validate Maputnik style format during upload', async () => {
      const invalidStyle = {
        // Missing required fields for Mapbox GL style
        name: 'Invalid Style',
        layers: []
      };

      const mockFile = new File(
        [JSON.stringify(invalidStyle)],
        'invalid-style.json',
        { type: 'application/json' }
      );

      const uploadWrapper = mount(StyleUploadModal, {
        props: { visible: true },
        global: { plugins: [pinia] }
      });

      const fileInput = uploadWrapper.find('input[type="file"]');
      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        configurable: true
      });

      await fileInput.trigger('change');
      await nextTick();

      // Should show validation error
      expect(uploadWrapper.text()).toContain('Invalid Mapbox style format');
      expect(uploadWrapper.vm.selectedFile).toBeNull();
    });
  });

  describe('Maputnik Integration Features', () => {
    it('should detect Maputnik-compatible styles correctly', () => {
      const testCases = [
        {
          config: { style: 'https://api.maptiler.com/maps/streets/style.json?key=test' },
          expected: true,
          description: 'MapTiler style with API key'
        },
        {
          config: { style: 'https://raw.githubusercontent.com/user/repo/style.json' },
          expected: true,
          description: 'GitHub raw style'
        },
        {
          config: { style: '/api/styles/custom.json' },
          expected: true,
          description: 'Local style endpoint'
        },
        {
          config: { style: 'tiles', type: 'raster' },
          expected: false,
          description: 'Raster tiles (not compatible)'
        },
        {
          config: { originalStyle: 'https://example.com/style.json' },
          expected: true,
          description: 'Using originalStyle fallback'
        }
      ];

      testCases.forEach(({ config, expected, description }) => {
        const result = canOpenInMaputnik(config);
        expect(result).toBe(expected);
      });
    });

    it('should open Maputnik with correct parameters', () => {
      const testUrls = [
        {
          input: 'https://api.maptiler.com/maps/streets/style.json?key=abc123',
          expectedUrl: 'https://maputnik.github.io/editor/#https://api.maptiler.com/maps/streets/style.json?key=abc123'
        },
        {
          input: 'basemap.json',
          expectedUrl: 'https://maputnik.github.io/editor/#http://localhost:3001/api/styles/basemap'
        },
        {
          input: '/api/styles/custom.json',
          expectedUrl: 'https://maputnik.github.io/editor/#http://localhost:3000/api/styles/custom.json'
        }
      ];

      testUrls.forEach(({ input, expectedUrl }) => {
        mockWindowOpen.mockClear();
        openInMaputnik(input, 'vtc');
        expect(mockWindowOpen).toHaveBeenCalledWith(expectedUrl, '_blank');
      });
    });

    it('should handle popup blocking gracefully', () => {
      mockWindowOpen.mockReturnValue(null); // Simulate blocked popup

      openInMaputnik('https://example.com/style.json', 'vtc');

      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Popup blocked!')
      );
    });
  });

  describe('Bridge Communication', () => {
    it('should establish communication with Maputnik iframe', () => {
      const bridge = new MaputnikBridge({
        styleUrl: 'http://localhost:3001/api/styles/test.json',
        styleName: 'Test Style',
        saveEndpoint: 'http://localhost:3001/api/save',
        apiKey: 'test-key'
      });

      const mockContainer = document.createElement('div');
      bridge.createCustomMaputnik(mockContainer, 'test-style.json');

      expect(window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should handle style changes from embedded Maputnik', () => {
      const bridge = new MaputnikBridge({
        styleUrl: 'test-url',
        styleName: 'test-name',
        saveEndpoint: 'test-endpoint',
        apiKey: 'test-key'
      });

      const mockContainer = document.createElement('div');
      bridge.createCustomMaputnik(mockContainer, 'test-style.json');

      // Simulate message from Maputnik
      const handler = (bridge as any).handleMessage.bind(bridge);
      const styleData = { version: 8, name: 'Modified', layers: [], sources: {} };
      
      handler({
        origin: 'https://maputnik.github.io',
        data: {
          type: 'style-changed',
          data: styleData
        }
      });

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'maputnik-current-style',
        JSON.stringify(styleData)
      );
    });
  });

  describe('Error Handling and User Experience', () => {
    it('should provide helpful error messages for common issues', async () => {
      const errorScenarios = [
        {
          mockResponse: {
            ok: false,
            status: 413,
            json: async () => ({ message: 'File too large' })
          },
          expectedMessage: 'File too large'
        },
        {
          mockResponse: {
            ok: false,
            status: 422,
            json: async () => ({ 
              message: 'Invalid style format',
              details: { missingFields: ['version', 'sources'] }
            })
          },
          expectedMessage: 'Invalid style format'
        },
        {
          mockError: new TypeError('Network error'),
          expectedMessage: 'Network error'
        }
      ];

      for (const scenario of errorScenarios) {
        mockFetch.mockClear();
        
        if (scenario.mockResponse) {
          mockFetch.mockResolvedValueOnce(scenario.mockResponse);
        } else if (scenario.mockError) {
          mockFetch.mockRejectedValueOnce(scenario.mockError);
        }

        const saveWrapper = mount(SaveStyleDialog, {
          props: {
            visible: true,
            styleData: sampleMaputnikStyle
          },
          global: { plugins: [pinia] }
        });

        const saveButton = saveWrapper.find('button[type="submit"]');
        await saveButton.trigger('click');
        await nextTick();

        expect(saveWrapper.text()).toContain(scenario.expectedMessage);
      }
    });

    it('should handle authentication expiry during workflow', async () => {
      // Set up expired token
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'expired-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
        expiresAt: Date.now() - 1000 // Expired
      }));

      const saveWrapper = mount(SaveStyleDialog, {
        props: {
          visible: true,
          styleData: sampleMaputnikStyle
        },
        global: { plugins: [pinia] }
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Token expired' })
      });

      const saveButton = saveWrapper.find('button[type="submit"]');
      await saveButton.trigger('click');
      await nextTick();

      // Should prompt for re-authentication
      expect(authStore.isAuthenticated).toBe(false);
      expect(saveWrapper.emitted('auth-required')).toBeTruthy();
    });

    it('should maintain user data during authentication flow', async () => {
      const saveWrapper = mount(SaveStyleDialog, {
        props: {
          visible: true,
          styleData: sampleMaputnikStyle,
          suggestedName: 'Test Style'
        },
        global: { plugins: [pinia] }
      });

      // Fill in form data
      const nameInput = saveWrapper.find('input[id="styleName"]');
      const descriptionInput = saveWrapper.find('textarea[id="description"]');

      await nameInput.setValue('My Custom Style');
      await descriptionInput.setValue('Created with Maputnik');

      // Trigger authentication requirement
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Authentication required' })
      });

      const saveButton = saveWrapper.find('button[type="submit"]');
      await saveButton.trigger('click');
      await nextTick();

      // Form data should be preserved
      expect(nameInput.element.value).toBe('My Custom Style');
      expect(descriptionInput.element.value).toBe('Created with Maputnik');
    });
  });

  describe('Performance and Usability', () => {
    it('should provide visual feedback during operations', async () => {
      const saveWrapper = mount(SaveStyleDialog, {
        props: {
          visible: true,
          styleData: sampleMaputnikStyle
        },
        global: { plugins: [pinia] }
      });

      // Mock slow response
      let resolvePromise: any;
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(slowPromise);

      const saveButton = saveWrapper.find('button[type="submit"]');
      await saveButton.trigger('click');
      await nextTick();

      // Should show loading state
      expect(saveWrapper.text()).toContain('Saving');
      expect(saveButton.attributes('disabled')).toBeDefined();

      // Resolve the promise
      resolvePromise({
        ok: true,
        json: async () => ({
          styleId: 'test-id',
          url: 'test-url',
          message: 'Saved successfully'
        })
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Loading state should be cleared
      expect(saveWrapper.text()).toContain('Saved successfully');
      expect(saveButton.attributes('disabled')).toBeUndefined();
    });

    it('should handle large files with progress indication', async () => {
      const uploadWrapper = mount(StyleUploadModal, {
        props: { visible: true },
        global: { plugins: [pinia] }
      });

      // Create large mock file
      const largeStyleData = {
        ...sampleMaputnikStyle,
        layers: Array.from({ length: 1000 }, (_, i) => ({
          id: `layer-${i}`,
          type: 'fill',
          source: 'openmaptiles',
          'source-layer': 'test',
          paint: { 'fill-color': '#000000' }
        }))
      };

      const largeFile = new File(
        [JSON.stringify(largeStyleData)],
        'large-style.json',
        { type: 'application/json' }
      );

      const fileInput = uploadWrapper.find('input[type="file"]');
      Object.defineProperty(fileInput.element, 'files', {
        value: [largeFile],
        configurable: true
      });

      await fileInput.trigger('change');
      await nextTick();

      // Should show file size and processing indication
      expect(uploadWrapper.text()).toMatch(/\d+(\.\d+)?\s*(KB|MB)/); // File size
      expect(uploadWrapper.vm.selectedFile).toBe(largeFile);
    });
  });
});