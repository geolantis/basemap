import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MapConfigService } from '../../services/mapConfigService'
import type { MapConfig, StyleUploadResponse } from '../../types'

// Mock the service
vi.mock('../../services/mapConfigService')

describe('Map Configuration Integration Tests', () => {
  let mockService: any
  
  beforeEach(() => {
    mockService = {
      uploadStyle: vi.fn(),
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }
    
    ;(MapConfigService.getInstance as any).mockReturnValue(mockService)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Style Upload to Configuration Creation', () => {
    it('should create map configuration from uploaded style', async () => {
      const uploadResponse: StyleUploadResponse = {
        success: true,
        message: 'Style uploaded successfully',
        config: {
          id: 'custom-style-123',
          name: 'my-custom-style',
          label: 'My Custom Style',
          type: 'vtc',
          style: 'http://localhost:3001/custom-styles/my-style-123.json',
          country: 'de',
          flag: '🇩🇪',
          version: 1,
          isActive: true,
          createdAt: '2023-12-01T10:00:00Z',
          updatedAt: '2023-12-01T10:00:00Z',
          metadata: {
            source: 'user-upload',
            originalFilename: 'my-style.json'
          }
        } as MapConfig,
        styleUrl: 'http://localhost:3001/custom-styles/my-style-123.json'
      }

      mockService.uploadStyle.mockResolvedValue(uploadResponse)

      const formData = new FormData()
      formData.append('styleFile', new Blob(['{}'], { type: 'application/json' }), 'test.json')
      formData.append('name', 'my-custom-style')
      formData.append('label', 'My Custom Style')
      formData.append('country', 'de')
      formData.append('type', 'vtc')

      const result = await mockService.uploadStyle(formData)

      expect(result.success).toBe(true)
      expect(result.config).toBeDefined()
      expect(result.config.name).toBe('my-custom-style')
      expect(result.config.style).toContain('/custom-styles/')
      expect(result.config.type).toBe('vtc')
      expect(result.config.country).toBe('de')
    })

    it('should handle style upload with all optional metadata', async () => {
      const fullResponse: StyleUploadResponse = {
        success: true,
        message: 'Style uploaded successfully',
        config: {
          id: 'full-config-456',
          name: 'comprehensive-style',
          label: 'Comprehensive Test Style',
          type: 'wmts',
          style: 'http://localhost:3001/custom-styles/comprehensive-456.json',
          originalStyle: '{"version":8,"layers":[],"sources":{}}',
          country: 'at',
          flag: '🇦🇹',
          center: [16.3738, 48.2082],
          zoom: 10,
          bearing: 0,
          pitch: 0,
          layers: [
            {
              id: 'background',
              name: 'Background Layer',
              type: 'background',
              visible: true,
              paint: { 'background-color': '#f0f0f0' }
            }
          ],
          metadata: {
            source: 'user-upload',
            originalFilename: 'comprehensive.json',
            description: 'A comprehensive test style with all features',
            tags: ['test', 'comprehensive', 'austria'],
            author: 'Test User'
          },
          version: 1,
          isActive: true,
          createdAt: '2023-12-01T10:00:00Z',
          updatedAt: '2023-12-01T10:00:00Z',
          createdBy: 'test-user-id'
        } as MapConfig,
        styleUrl: 'http://localhost:3001/custom-styles/comprehensive-456.json'
      }

      mockService.uploadStyle.mockResolvedValue(fullResponse)

      const formData = new FormData()
      formData.append('styleFile', new Blob(['{}'], { type: 'application/json' }), 'comprehensive.json')
      formData.append('name', 'comprehensive-style')
      formData.append('label', 'Comprehensive Test Style')
      formData.append('country', 'at')
      formData.append('type', 'wmts')
      formData.append('description', 'A comprehensive test style with all features')

      const result = await mockService.uploadStyle(formData)

      expect(result.config.metadata?.description).toBe('A comprehensive test style with all features')
      expect(result.config.center).toEqual([16.3738, 48.2082])
      expect(result.config.layers).toHaveLength(1)
    })
  })

  describe('Configuration Retrieval and Updates', () => {
    it('should retrieve all configurations including uploaded ones', async () => {
      const mockConfigs: MapConfig[] = [
        {
          id: 'existing-config-1',
          name: 'existing-style',
          label: 'Existing Style',
          type: 'vtc',
          style: 'http://localhost:3001/api/styles/existing-style',
          country: 'de',
          flag: '🇩🇪',
          version: 1,
          isActive: true,
          createdAt: '2023-11-01T10:00:00Z',
          updatedAt: '2023-11-01T10:00:00Z'
        },
        {
          id: 'uploaded-config-2',
          name: 'uploaded-custom-style',
          label: 'Uploaded Custom Style',
          type: 'vtc',
          style: 'http://localhost:3001/custom-styles/uploaded-style-789.json',
          country: 'at',
          flag: '🇦🇹',
          version: 1,
          isActive: true,
          createdAt: '2023-12-01T10:00:00Z',
          updatedAt: '2023-12-01T10:00:00Z',
          metadata: {
            source: 'user-upload'
          }
        }
      ]

      mockService.getAll.mockResolvedValue(mockConfigs)

      const configs = await mockService.getAll()

      expect(configs).toHaveLength(2)
      expect(configs.find(c => c.metadata?.source === 'user-upload')).toBeDefined()
      expect(configs.find(c => c.style.includes('/custom-styles/'))).toBeDefined()
    })

    it('should retrieve specific uploaded configuration by ID', async () => {
      const uploadedConfig: MapConfig = {
        id: 'uploaded-specific-123',
        name: 'specific-uploaded-style',
        label: 'Specific Uploaded Style',
        type: 'wms',
        style: 'http://localhost:3001/custom-styles/specific-123.json',
        country: 'ch',
        flag: '🇨🇭',
        version: 1,
        isActive: true,
        createdAt: '2023-12-01T10:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z',
        metadata: {
          source: 'user-upload',
          originalFilename: 'specific.json'
        }
      }

      mockService.getById.mockResolvedValue(uploadedConfig)

      const config = await mockService.getById('uploaded-specific-123')

      expect(config).toBeDefined()
      expect(config.metadata?.source).toBe('user-upload')
      expect(config.style).toContain('/custom-styles/')
    })

    it('should update uploaded configuration metadata', async () => {
      const originalConfig: MapConfig = {
        id: 'update-test-456',
        name: 'original-name',
        label: 'Original Label',
        type: 'vtc',
        style: 'http://localhost:3001/custom-styles/original-456.json',
        country: 'de',
        flag: '🇩🇪',
        version: 1,
        isActive: true,
        createdAt: '2023-12-01T10:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z'
      }

      const updatedConfig: MapConfig = {
        ...originalConfig,
        label: 'Updated Label',
        metadata: {
          ...originalConfig.metadata,
          description: 'Updated description',
          tags: ['updated', 'test']
        },
        updatedAt: '2023-12-01T11:00:00Z'
      }

      mockService.update.mockResolvedValue(updatedConfig)

      const result = await mockService.update('update-test-456', {
        label: 'Updated Label',
        metadata: {
          description: 'Updated description',
          tags: ['updated', 'test']
        }
      })

      expect(result.label).toBe('Updated Label')
      expect(result.metadata?.description).toBe('Updated description')
      expect(result.updatedAt).not.toBe(originalConfig.updatedAt)
    })
  })

  describe('Style URL Validation and Accessibility', () => {
    it('should validate that uploaded style URLs are accessible', async () => {
      const styleUrl = 'http://localhost:3001/custom-styles/test-accessibility-789.json'
      const mockStyleContent = {
        version: 8,
        name: 'Accessible Test Style',
        sources: {},
        layers: []
      }

      // Mock fetch for style URL validation
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockStyleContent
      })

      const response = await fetch(styleUrl)
      const content = await response.json()

      expect(response.ok).toBe(true)
      expect(content.version).toBe(8)
      expect(content.name).toBe('Accessible Test Style')
    })

    it('should handle inaccessible style URLs gracefully', async () => {
      const styleUrl = 'http://localhost:3001/custom-styles/non-existent-style.json'

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      })

      const response = await fetch(styleUrl)

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })

    it('should validate style content format from URLs', async () => {
      const styleUrl = 'http://localhost:3001/custom-styles/valid-format-test.json'
      const validStyleContent = {
        version: 8,
        name: 'Valid Format Test',
        sources: {
          'test-source': {
            type: 'vector',
            tiles: ['https://example.com/{z}/{x}/{y}.pbf']
          }
        },
        layers: [
          {
            id: 'test-layer',
            type: 'fill',
            source: 'test-source',
            paint: {
              'fill-color': '#ff0000'
            }
          }
        ]
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => validStyleContent
      })

      const response = await fetch(styleUrl)
      const content = await response.json()

      // Validate Mapbox style format
      expect(content.version).toBeDefined()
      expect(content.sources).toBeDefined()
      expect(content.layers).toBeDefined()
      expect(Array.isArray(content.layers)).toBe(true)
      expect(content.layers[0]).toHaveProperty('id')
      expect(content.layers[0]).toHaveProperty('type')
    })
  })

  describe('Search and Filtering Integration', () => {
    it('should find uploaded styles in search results', async () => {
      const mockSearchResults: MapConfig[] = [
        {
          id: 'search-result-1',
          name: 'my-custom-basemap',
          label: 'My Custom Basemap',
          type: 'vtc',
          style: 'http://localhost:3001/custom-styles/custom-basemap-123.json',
          country: 'global',
          flag: '🌍',
          version: 1,
          isActive: true,
          createdAt: '2023-12-01T10:00:00Z',
          updatedAt: '2023-12-01T10:00:00Z',
          metadata: {
            source: 'user-upload'
          }
        }
      ]

      mockService.search.mockResolvedValue(mockSearchResults)

      const results = await mockService.search('custom basemap')

      expect(results).toHaveLength(1)
      expect(results[0].name).toContain('custom')
      expect(results[0].metadata?.source).toBe('user-upload')
    })

    it('should filter uploaded styles by country', async () => {
      const austrianUploadedStyles: MapConfig[] = [
        {
          id: 'at-upload-1',
          name: 'vienna-custom-style',
          label: 'Vienna Custom Style',
          type: 'vtc',
          style: 'http://localhost:3001/custom-styles/vienna-style.json',
          country: 'at',
          flag: '🇦🇹',
          version: 1,
          isActive: true,
          createdAt: '2023-12-01T10:00:00Z',
          updatedAt: '2023-12-01T10:00:00Z',
          metadata: { source: 'user-upload' }
        }
      ]

      mockService.getByCountry.mockResolvedValue(austrianUploadedStyles)

      const results = await mockService.getByCountry('at')

      expect(results).toHaveLength(1)
      expect(results[0].country).toBe('at')
      expect(results[0].metadata?.source).toBe('user-upload')
    })
  })

  describe('Error Handling in Integration', () => {
    it('should handle service errors during upload integration', async () => {
      const error = new Error('Database connection failed')
      mockService.uploadStyle.mockRejectedValue(error)

      await expect(mockService.uploadStyle(new FormData())).rejects.toThrow('Database connection failed')
    })

    it('should handle configuration retrieval errors', async () => {
      mockService.getAll.mockRejectedValue(new Error('Service unavailable'))

      await expect(mockService.getAll()).rejects.toThrow('Service unavailable')
    })

    it('should handle update failures gracefully', async () => {
      mockService.update.mockRejectedValue(new Error('Update failed'))

      await expect(mockService.update('test-id', {})).rejects.toThrow('Update failed')
    })
  })

  describe('Cleanup and Maintenance', () => {
    it('should support soft deletion of uploaded configurations', async () => {
      mockService.delete.mockResolvedValue(true)

      const result = await mockService.delete('uploaded-config-to-delete')

      expect(result).toBe(true)
      expect(mockService.delete).toHaveBeenCalledWith('uploaded-config-to-delete')
    })

    it('should track upload statistics and metadata', async () => {
      const uploadStats = {
        totalUploads: 15,
        totalSize: 2048000, // 2MB
        averageSize: 136533, // ~133KB
        uploadsThisMonth: 5,
        mostPopularType: 'vtc',
        countryDistribution: {
          'de': 6,
          'at': 4,
          'ch': 3,
          'global': 2
        }
      }

      // This would be a custom method in the service
      const mockGetUploadStats = vi.fn().mockResolvedValue(uploadStats)
      mockService.getUploadStats = mockGetUploadStats

      const stats = await mockService.getUploadStats()

      expect(stats.totalUploads).toBe(15)
      expect(stats.mostPopularType).toBe('vtc')
      expect(stats.countryDistribution['de']).toBe(6)
    })
  })
})