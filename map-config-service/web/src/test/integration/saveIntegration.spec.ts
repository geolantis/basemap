import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { SaveService, SaveError } from '../../services/saveService';
import { AuthService } from '../../services/authService';
import { useSaveStore } from '../../stores/save';
import { useAuthStore } from '../../stores/auth';
import SaveStyleDialog from '../../components/SaveStyleDialog.vue';
import LoginModal from '../../components/LoginModal.vue';
import type { MapStyle } from '../../types/save';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = mockLocalStorage as any;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.sessionStorage = mockSessionStorage as any;

// Sample valid Mapbox GL style
const validMapboxStyle: MapStyle = {
  version: 8,
  name: 'Test Style',
  sources: {
    'test-source': {
      type: 'vector',
      url: 'mapbox://test.tiles'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#ffffff'
      }
    },
    {
      id: 'test-layer',
      type: 'fill',
      source: 'test-source',
      'source-layer': 'test',
      paint: {
        'fill-color': '#0080ff'
      }
    }
  ]
};

describe('Maputnik Save Integration', () => {
  let pinia: any;
  let saveService: SaveService;
  let authService: AuthService;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    // Reset mocks
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockSessionStorage.getItem.mockReset();
    mockSessionStorage.setItem.mockReset();

    // Set up environment variables
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_JWT_SECRET', 'test-secret');

    saveService = SaveService.getInstance({
      baseUrl: 'http://localhost:3001'
    });

    authService = AuthService.getInstance({
      baseUrl: 'http://localhost:3001'
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('SaveService', () => {
    it('should validate Mapbox GL styles correctly', async () => {
      // Mock validation endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          errors: [],
          warnings: ['Style has no glyphs defined']
        })
      });

      const result = await saveService.validateStyle(validMapboxStyle);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain('Style has no glyphs defined');
    });

    it('should handle style validation errors', async () => {
      const invalidStyle = {
        // Missing required version field
        sources: {},
        layers: []
      } as MapStyle;

      const result = await saveService.validateStyle(invalidStyle);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Style version is required');
    });

    it('should save styles successfully', async () => {
      // Mock authentication
      mockLocalStorage.getItem.mockReturnValue('mock-jwt-token');

      // Mock save endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          styleId: 'test-style-id',
          url: 'http://localhost:3001/api/styles/test-style-id/download',
          message: 'Style saved successfully',
          metadata: {
            name: 'Test Style',
            description: 'A test style',
            category: 'custom',
            isPublic: false,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
          }
        })
      });

      const result = await saveService.saveStyle(validMapboxStyle, {
        name: 'Test Style',
        description: 'A test style',
        category: 'custom',
        isPublic: false
      });

      expect(result.success).toBe(true);
      expect(result.styleId).toBe('test-style-id');
      expect(result.message).toBe('Style saved successfully');
    });

    it('should handle save errors appropriately', async () => {
      // Mock authentication
      mockLocalStorage.getItem.mockReturnValue('mock-jwt-token');

      // Mock save endpoint error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          message: 'Style name already exists',
          code: 'DUPLICATE_NAME'
        })
      });

      await expect(saveService.saveStyle(validMapboxStyle, {
        name: 'Existing Style',
        description: 'This name already exists',
        category: 'custom',
        isPublic: false
      })).rejects.toThrow('Style name already exists');
    });

    it('should handle network errors', async () => {
      mockLocalStorage.getItem.mockReturnValue('mock-jwt-token');
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      await expect(saveService.saveStyle(validMapboxStyle, {
        name: 'Test Style',
        description: 'Test description',
        category: 'custom',
        isPublic: false
      })).rejects.toThrow('Network error. Please check your connection.');
    });

    it('should handle timeout errors', async () => {
      mockLocalStorage.getItem.mockReturnValue('mock-jwt-token');
      mockFetch.mockRejectedValueOnce(new DOMException('Timeout', 'TimeoutError'));

      await expect(saveService.saveStyle(validMapboxStyle, {
        name: 'Test Style',
        description: 'Test description',
        category: 'custom',
        isPublic: false
      })).rejects.toThrow('Request timed out. Please try again.');
    });
  });

  describe('AuthService', () => {
    it('should login successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: Date.now() + (24 * 60 * 60 * 1000),
          user: {
            id: 'user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user'
          }
        })
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });

    it('should handle login errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Invalid credentials'
        })
      });

      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should register successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: Date.now() + (24 * 60 * 60 * 1000),
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
            name: 'New User',
            role: 'user'
          }
        })
      });

      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'SecurePass123',
        name: 'New User'
      });

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('newuser@example.com');
    });

    it('should refresh tokens', async () => {
      // Mock stored token
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        token: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 1000,
        user: { id: 'user-id', email: 'test@example.com', name: 'Test User', role: 'user' }
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'new-jwt-token',
          refreshToken: 'new-refresh-token',
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        })
      });

      const result = await authService.refreshToken();

      expect(result?.token).toBe('new-jwt-token');
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Save Store Integration', () => {
    it('should manage save state correctly', async () => {
      const saveStore = useSaveStore();

      expect(saveStore.isLoading).toBe(false);
      expect(saveStore.isDirty).toBe(false);
      expect(saveStore.canSave).toBe(true);

      saveStore.markDirty();
      expect(saveStore.isDirty).toBe(true);
      expect(saveStore.hasUnsavedChanges).toBe(true);

      saveStore.markClean();
      expect(saveStore.isDirty).toBe(false);
      expect(saveStore.hasUnsavedChanges).toBe(false);
    });

    it('should handle save operations', async () => {
      const saveStore = useSaveStore();
      const authStore = useAuthStore();

      // Mock authenticated user
      authStore.user = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user'
      } as any;

      // Mock successful save
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ valid: true, errors: [], warnings: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            styleId: 'saved-style-id',
            url: 'http://localhost:3001/api/styles/saved-style-id/download',
            message: 'Style saved successfully'
          })
        });

      const success = await saveStore.saveStyle(validMapboxStyle, {
        name: 'Test Style',
        description: 'Test description',
        category: 'custom',
        isPublic: false,
        overwrite: false
      });

      expect(success).toBe(true);
      expect(saveStore.lastSavedId).toBe('saved-style-id');
      expect(saveStore.isDirty).toBe(false);
    });
  });

  describe('UI Components', () => {
    it('should render SaveStyleDialog correctly', () => {
      const wrapper = mount(SaveStyleDialog, {
        props: {
          visible: true,
          styleData: validMapboxStyle,
          suggestedName: 'Test Style'
        },
        global: {
          plugins: [pinia]
        }
      });

      expect(wrapper.find('input[id="styleName"]').exists()).toBe(true);
      expect(wrapper.find('textarea[id="description"]').exists()).toBe(true);
      expect(wrapper.find('select[id="category"]').exists()).toBe(true);
    });

    it('should render LoginModal correctly', () => {
      const wrapper = mount(LoginModal, {
        props: {
          visible: true,
          message: 'Please log in to save styles'
        },
        global: {
          plugins: [pinia]
        }
      });

      expect(wrapper.find('input[type="email"]').exists()).toBe(true);
      expect(wrapper.find('input[type="password"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('Please log in to save styles');
    });
  });
});

describe('Integration Error Handling', () => {
  it('should handle API validation errors gracefully', async () => {
    const saveService = SaveService.getInstance();
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        message: 'Style validation failed',
        errors: ['Missing required layers'],
        code: 'VALIDATION_ERROR'
      })
    });

    try {
      await saveService.saveStyle({} as MapStyle, {
        name: 'Invalid Style',
        description: '',
        category: 'custom',
        isPublic: false
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SaveError);
      expect((error as SaveError).code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Style validation failed');
    }
  });

  it('should handle quota exceeded errors', async () => {
    const saveService = SaveService.getInstance();
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, errors: [], warnings: [] })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          message: 'Maximum styles limit reached (50). Please delete some styles first.',
          code: 'QUOTA_EXCEEDED'
        })
      });

    try {
      await saveService.saveStyle(validMapboxStyle, {
        name: 'Over Quota Style',
        description: '',
        category: 'custom',
        isPublic: false
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SaveError);
      expect((error as SaveError).code).toBe('QUOTA_EXCEEDED');
    }
  });
});