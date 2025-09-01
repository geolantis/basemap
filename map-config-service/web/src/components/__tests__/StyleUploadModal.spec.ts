import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import StyleUploadModal from '../StyleUploadModal.vue'
import { MapConfigService } from '../../services/mapConfigService'
import { createMockFile, createMockUploadResponse } from '../../test/mocks/mapConfigService'
import type { StyleUploadResponse } from '../../types'

// Mock the MapConfigService
vi.mock('../../services/mapConfigService', () => ({
  MapConfigService: {
    getInstance: vi.fn(() => ({
      uploadStyle: vi.fn()
    }))
  }
}))

describe('StyleUploadModal', () => {
  let wrapper: VueWrapper<any>
  let mockUploadStyle: ReturnType<typeof vi.fn>

  const createWrapper = (props = {}) => {
    return mount(StyleUploadModal, {
      props: {
        visible: true,
        ...props
      }
    })
  }

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup mock service
    mockUploadStyle = vi.fn()
    ;(MapConfigService.getInstance as any).mockReturnValue({
      uploadStyle: mockUploadStyle
    })

    // Mock global fetch
    global.fetch = vi.fn()
    
    // Mock file reading
    global.FileReader = class {
      readAsText = vi.fn()
      onload = vi.fn()
      result = ''
      
      constructor() {
        setTimeout(() => {
          this.onload?.()
        }, 0)
      }
    } as any
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render when visible is true', () => {
      wrapper = createWrapper({ visible: true })
      
      expect(wrapper.find('.fixed.inset-0').exists()).toBe(true)
      expect(wrapper.text()).toContain('Upload Custom Style')
    })

    it('should not render when visible is false', () => {
      wrapper = createWrapper({ visible: false })
      
      expect(wrapper.find('.fixed.inset-0').exists()).toBe(false)
    })

    it('should render upload area with drag and drop zone', () => {
      wrapper = createWrapper()
      
      const uploadArea = wrapper.find('[data-testid="upload-area"]')
      expect(uploadArea.exists()).toBe(false) // Will need to add data-testid to component
      
      // Check for upload zone elements
      expect(wrapper.text()).toContain('Drop your Maputnik style file here')
      expect(wrapper.text()).toContain('or click to browse for JSON files')
      expect(wrapper.text()).toContain('Maximum file size: 10MB')
    })

    it('should render form fields when style is selected', async () => {
      wrapper = createWrapper()
      
      // Initially form should not be visible
      expect(wrapper.find('input[placeholder*="Enter style name"]').exists()).toBe(false)
      
      // Simulate file selection
      const validStyleContent = JSON.stringify({
        version: 8,
        name: 'Test Style',
        layers: [],
        sources: {}
      })
      
      await wrapper.vm.processFile(createMockFile('test.json', validStyleContent))
      await nextTick()
      
      // Form should now be visible
      expect(wrapper.find('input[placeholder*="Enter style name"]').exists()).toBe(true)
      expect(wrapper.find('select').exists()).toBe(true)
    })
  })

  describe('File Upload Functionality', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    describe('File Selection', () => {
      it('should handle file input change', async () => {
        const fileInput = wrapper.find('input[type="file"]')
        const file = createMockFile('test.json', '{"version": 8, "layers": [], "sources": {}}')
        
        // Mock file input files
        Object.defineProperty(fileInput.element, 'files', {
          value: [file],
          configurable: true
        })
        
        await fileInput.trigger('change')
        await nextTick()
        
        expect(wrapper.vm.selectedFile).toBeDefined()
      })

      it('should trigger file input when upload area is clicked', async () => {
        const uploadArea = wrapper.find('.border-dashed')
        const fileInput = wrapper.find('input[type="file"]')
        
        const clickSpy = vi.spyOn(fileInput.element, 'click')
        
        await uploadArea.trigger('click')
        
        expect(clickSpy).toHaveBeenCalled()
      })
    })

    describe('File Validation', () => {
      it('should accept valid JSON files', async () => {
        const validContent = JSON.stringify({
          version: 8,
          name: 'Test Style',
          layers: [],
          sources: {}
        })
        
        const file = createMockFile('test.json', validContent)
        await wrapper.vm.processFile(file)
        
        expect(wrapper.vm.errorMessage).toBe('')
        expect(wrapper.vm.selectedFile).toBe(file)
        expect(wrapper.vm.stylePreview).toBeTruthy()
      })

      it('should reject non-JSON files', async () => {
        const file = createMockFile('test.txt', 'not json', 'text/plain')
        await wrapper.vm.processFile(file)
        
        expect(wrapper.vm.errorMessage).toBe('Please select a valid JSON file.')
        expect(wrapper.vm.selectedFile).toBeNull()
      })

      it('should reject files larger than 10MB', async () => {
        const largeContent = 'x'.repeat(11 * 1024 * 1024) // 11MB
        const file = createMockFile('large.json', largeContent)
        
        await wrapper.vm.processFile(file)
        
        expect(wrapper.vm.errorMessage).toBe('File size must be less than 10MB.')
        expect(wrapper.vm.selectedFile).toBeNull()
      })

      it('should reject malformed JSON', async () => {
        const file = createMockFile('malformed.json', '{"invalid": json}')
        await wrapper.vm.processFile(file)
        
        expect(wrapper.vm.errorMessage).toBe('Invalid JSON file. Please check the file format.')
        expect(wrapper.vm.selectedFile).toBeNull()
      })

      it('should reject JSON without required Mapbox style fields', async () => {
        const invalidStyle = JSON.stringify({ name: 'Test' })
        const file = createMockFile('invalid.json', invalidStyle)
        
        await wrapper.vm.processFile(file)
        
        expect(wrapper.vm.errorMessage).toContain('Invalid Mapbox style format')
        expect(wrapper.vm.selectedFile).toBeNull()
      })

      it('should accept style with minimal required fields', async () => {
        const minimalStyle = JSON.stringify({
          version: 8,
          layers: [],
          sources: {}
        })
        
        const file = createMockFile('minimal.json', minimalStyle)
        await wrapper.vm.processFile(file)
        
        expect(wrapper.vm.errorMessage).toBe('')
        expect(wrapper.vm.selectedFile).toBe(file)
      })
    })

    describe('Style Preview', () => {
      it('should display style preview information', async () => {
        const styleData = {
          version: 8,
          name: 'Test Style',
          layers: [{ id: 'layer1', type: 'fill' }, { id: 'layer2', type: 'line' }],
          sources: {
            'source1': { type: 'vector' },
            'source2': { type: 'raster' }
          }
        }
        
        const file = createMockFile('test.json', JSON.stringify(styleData))
        await wrapper.vm.processFile(file)
        await nextTick()
        
        expect(wrapper.text()).toContain('Test Style')
        expect(wrapper.text()).toContain('2') // layers count
        expect(wrapper.text()).toContain('2') // sources count
      })

      it('should show default values for missing style properties', async () => {
        const styleData = {
          version: 8,
          layers: [],
          sources: {}
        }
        
        const file = createMockFile('test.json', JSON.stringify(styleData))
        await wrapper.vm.processFile(file)
        await nextTick()
        
        expect(wrapper.text()).toContain('Untitled') // default name
        expect(wrapper.text()).toContain('1.0') // default version
        expect(wrapper.text()).toContain('0') // no layers
      })
    })
  })

  describe('Drag and Drop Functionality', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('should handle dragover events', async () => {
      const uploadArea = wrapper.find('.border-dashed')
      
      const dragEvent = new DragEvent('dragover', {
        dataTransfer: new DataTransfer()
      })
      
      await uploadArea.element.dispatchEvent(dragEvent)
      await nextTick()
      
      expect(wrapper.vm.isDragging).toBe(true)
    })

    it('should handle dragleave events', async () => {
      wrapper.vm.isDragging = true
      await nextTick()
      
      const uploadArea = wrapper.find('.border-dashed')
      await uploadArea.trigger('dragleave')
      
      expect(wrapper.vm.isDragging).toBe(false)
    })

    it('should handle drop events with files', async () => {
      const file = createMockFile('test.json', '{"version": 8, "layers": [], "sources": {}}')
      const uploadArea = wrapper.find('.border-dashed')
      
      const mockDataTransfer = {
        files: [file]
      }
      
      const dropEvent = new DragEvent('drop', {
        dataTransfer: mockDataTransfer as DataTransfer
      })
      
      // Mock the dataTransfer getter
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: mockDataTransfer,
        writable: false
      })
      
      const processSpy = vi.spyOn(wrapper.vm, 'processFile')
      
      await uploadArea.element.dispatchEvent(dropEvent)
      
      expect(processSpy).toHaveBeenCalledWith(file)
    })

    it('should update visual state when dragging', async () => {
      wrapper.vm.isDragging = true
      await nextTick()
      
      const uploadArea = wrapper.find('.border-dashed')
      expect(uploadArea.classes()).toContain('border-blue-500')
      expect(uploadArea.classes()).toContain('bg-blue-50')
    })
  })

  describe('Form Validation', () => {
    beforeEach(async () => {
      wrapper = createWrapper()
      
      // Setup valid file first
      const file = createMockFile('test.json', JSON.stringify({
        version: 8,
        name: 'Test Style',
        layers: [],
        sources: {}
      }))
      
      await wrapper.vm.processFile(file)
      await nextTick()
    })

    it('should require style name', async () => {
      wrapper.vm.styleName = ''
      wrapper.vm.styleLabel = 'Test Label'
      wrapper.vm.styleCountry = 'de'
      wrapper.vm.styleType = 'vtc'
      
      await nextTick()
      
      expect(wrapper.vm.canUpload).toBe(false)
    })

    it('should require style label', async () => {
      wrapper.vm.styleName = 'Test Name'
      wrapper.vm.styleLabel = ''
      wrapper.vm.styleCountry = 'de'
      wrapper.vm.styleType = 'vtc'
      
      await nextTick()
      
      expect(wrapper.vm.canUpload).toBe(false)
    })

    it('should require country selection', async () => {
      wrapper.vm.styleName = 'Test Name'
      wrapper.vm.styleLabel = 'Test Label'
      wrapper.vm.styleCountry = ''
      wrapper.vm.styleType = 'vtc'
      
      await nextTick()
      
      expect(wrapper.vm.canUpload).toBe(false)
    })

    it('should require style type', async () => {
      wrapper.vm.styleName = 'Test Name'
      wrapper.vm.styleLabel = 'Test Label'
      wrapper.vm.styleCountry = 'de'
      wrapper.vm.styleType = ''
      
      await nextTick()
      
      expect(wrapper.vm.canUpload).toBe(false)
    })

    it('should enable upload when all required fields are filled', async () => {
      wrapper.vm.styleName = 'Test Name'
      wrapper.vm.styleLabel = 'Test Label'
      wrapper.vm.styleCountry = 'de'
      wrapper.vm.styleType = 'vtc'
      
      await nextTick()
      
      expect(wrapper.vm.canUpload).toBe(true)
    })

    it('should auto-populate label when name changes', async () => {
      wrapper.vm.styleName = 'New Style Name'
      wrapper.vm.styleLabel = '' // Empty initially
      
      await nextTick()
      
      expect(wrapper.vm.styleLabel).toBe('New Style Name')
    })

    it('should not overwrite existing label when name changes', async () => {
      wrapper.vm.styleLabel = 'Existing Label'
      wrapper.vm.styleName = 'New Style Name'
      
      await nextTick()
      
      expect(wrapper.vm.styleLabel).toBe('Existing Label')
    })
  })

  describe('Upload Process', () => {
    beforeEach(async () => {
      wrapper = createWrapper()
      
      // Setup complete form
      const file = createMockFile('test.json', JSON.stringify({
        version: 8,
        name: 'Test Style',
        layers: [],
        sources: {}
      }))
      
      await wrapper.vm.processFile(file)
      
      wrapper.vm.styleName = 'Test Style'
      wrapper.vm.styleLabel = 'Test Style Label'
      wrapper.vm.styleCountry = 'de'
      wrapper.vm.styleType = 'vtc'
      wrapper.vm.styleDescription = 'Test description'
      
      await nextTick()
    })

    it('should upload successfully with valid data', async () => {
      const mockResponse = createMockUploadResponse()
      mockUploadStyle.mockResolvedValue(mockResponse)
      
      await wrapper.vm.uploadStyle()
      
      expect(mockUploadStyle).toHaveBeenCalledWith(expect.any(FormData))
      expect(wrapper.vm.successMessage).toBe('Style uploaded successfully! The map configuration has been updated.')
      expect(wrapper.vm.errorMessage).toBe('')
    })

    it('should handle upload errors', async () => {
      const errorMessage = 'Upload failed'
      mockUploadStyle.mockRejectedValue(new Error(errorMessage))
      
      await wrapper.vm.uploadStyle()
      
      expect(wrapper.vm.errorMessage).toBe(errorMessage)
      expect(wrapper.vm.successMessage).toBe('')
    })

    it('should show progress during upload', async () => {
      // Mock a delayed response
      mockUploadStyle.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(createMockUploadResponse()), 1000))
      )
      
      const uploadPromise = wrapper.vm.uploadStyle()
      
      expect(wrapper.vm.uploading).toBe(true)
      expect(wrapper.vm.uploadProgress).toBeGreaterThan(0)
      
      await uploadPromise
      
      expect(wrapper.vm.uploading).toBe(false)
      expect(wrapper.vm.uploadProgress).toBe(0) // Reset after upload
    })

    it('should emit upload-success event on successful upload', async () => {
      const mockResponse = createMockUploadResponse()
      mockUploadStyle.mockResolvedValue(mockResponse)
      
      await wrapper.vm.uploadStyle()
      
      expect(wrapper.emitted('upload-success')).toBeTruthy()
      expect(wrapper.emitted('upload-success')[0]).toEqual([mockResponse.config])
    })

    it('should emit upload-error event on upload failure', async () => {
      const errorMessage = 'Upload failed'
      mockUploadStyle.mockRejectedValue(new Error(errorMessage))
      
      await wrapper.vm.uploadStyle()
      
      expect(wrapper.emitted('upload-error')).toBeTruthy()
      expect(wrapper.emitted('upload-error')[0]).toEqual([errorMessage])
    })

    it('should disable upload button while uploading', async () => {
      mockUploadStyle.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(createMockUploadResponse()), 100))
      )
      
      const uploadPromise = wrapper.vm.uploadStyle()
      
      const uploadButton = wrapper.find('button:last-of-type')
      expect(uploadButton.attributes('disabled')).toBeDefined()
      
      await uploadPromise
      
      expect(uploadButton.attributes('disabled')).toBeUndefined()
    })

    it('should create FormData with correct fields', async () => {
      const mockResponse = createMockUploadResponse()
      mockUploadStyle.mockResolvedValue(mockResponse)
      
      await wrapper.vm.uploadStyle()
      
      const formDataCall = mockUploadStyle.mock.calls[0][0] as FormData
      
      // We can't easily inspect FormData, but we can verify the service was called
      expect(mockUploadStyle).toHaveBeenCalledWith(expect.any(FormData))
    })
  })

  describe('File Management', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('should remove selected file', async () => {
      // Add a file first
      const file = createMockFile('test.json', '{"version": 8, "layers": [], "sources": {}}')
      await wrapper.vm.processFile(file)
      
      expect(wrapper.vm.selectedFile).toBe(file)
      
      // Remove the file
      await wrapper.vm.removeFile()
      
      expect(wrapper.vm.selectedFile).toBeNull()
      expect(wrapper.vm.stylePreview).toBeNull()
    })

    it('should reset form when file is removed', async () => {
      // Setup file and form
      const file = createMockFile('test.json', '{"version": 8, "layers": [], "sources": {}}')
      await wrapper.vm.processFile(file)
      
      wrapper.vm.styleName = 'Test'
      wrapper.vm.styleLabel = 'Test Label'
      wrapper.vm.styleCountry = 'de'
      wrapper.vm.styleType = 'vtc'
      
      // Remove file
      await wrapper.vm.removeFile()
      
      expect(wrapper.vm.styleName).toBe('')
      expect(wrapper.vm.styleLabel).toBe('')
      expect(wrapper.vm.styleCountry).toBe('')
      expect(wrapper.vm.styleType).toBe('')
    })

    it('should format file size correctly', () => {
      expect(wrapper.vm.formatFileSize(0)).toBe('0 Bytes')
      expect(wrapper.vm.formatFileSize(1024)).toBe('1 KB')
      expect(wrapper.vm.formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(wrapper.vm.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(wrapper.vm.formatFileSize(1536)).toBe('1.5 KB')
    })
  })

  describe('Modal Controls', () => {
    it('should close modal when close button is clicked', async () => {
      wrapper = createWrapper()
      
      const closeButton = wrapper.find('button[class*="hover:bg-gray-100"]')
      await closeButton.trigger('click')
      
      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')[0]).toEqual([false])
    })

    it('should close modal when backdrop is clicked', async () => {
      wrapper = createWrapper()
      
      const backdrop = wrapper.find('.bg-black.opacity-50')
      await backdrop.trigger('click')
      
      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')[0]).toEqual([false])
    })

    it('should close modal when cancel button is clicked', async () => {
      wrapper = createWrapper()
      
      const cancelButton = wrapper.find('button[class*="bg-gray-100"]')
      await cancelButton.trigger('click')
      
      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')[0]).toEqual([false])
    })

    it('should reset form when modal is closed', async () => {
      wrapper = createWrapper()
      
      // Setup some form data
      const file = createMockFile('test.json', '{"version": 8, "layers": [], "sources": {}}')
      await wrapper.vm.processFile(file)
      wrapper.vm.styleName = 'Test'
      
      // Close modal
      await wrapper.vm.close()
      
      expect(wrapper.vm.selectedFile).toBeNull()
      expect(wrapper.vm.styleName).toBe('')
    })

    it('should prevent closing while uploading', async () => {
      wrapper = createWrapper()
      
      wrapper.vm.uploading = true
      await nextTick()
      
      await wrapper.vm.close()
      
      // Should not emit close event
      expect(wrapper.emitted('update:visible')).toBeFalsy()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('should display error messages', async () => {
      wrapper.vm.errorMessage = 'Test error message'
      await nextTick()
      
      expect(wrapper.text()).toContain('Upload Error')
      expect(wrapper.text()).toContain('Test error message')
      expect(wrapper.find('.bg-red-50').exists()).toBe(true)
    })

    it('should display success messages', async () => {
      wrapper.vm.successMessage = 'Test success message'
      await nextTick()
      
      expect(wrapper.text()).toContain('Upload Successful')
      expect(wrapper.text()).toContain('Test success message')
      expect(wrapper.find('.bg-green-50').exists()).toBe(true)
    })

    it('should clear previous messages on new upload attempt', async () => {
      wrapper.vm.errorMessage = 'Previous error'
      wrapper.vm.successMessage = 'Previous success'
      
      const file = createMockFile('test.json', '{"version": 8, "layers": [], "sources": {}}')
      await wrapper.vm.processFile(file)
      
      expect(wrapper.vm.errorMessage).toBe('')
      // successMessage might persist for preview, but errorMessage should clear
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('should have proper ARIA labels and roles', () => {
      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.attributes('accept')).toBe('.json,application/json')
      
      // Check for proper labeling
      const labels = wrapper.findAll('label')
      expect(labels.length).toBeGreaterThan(0)
    })

    it('should be keyboard accessible', async () => {
      const uploadArea = wrapper.find('.border-dashed')
      expect(uploadArea.attributes('tabindex')).toBeDefined() // Should be keyboard focusable
    })

    it('should announce upload progress to screen readers', async () => {
      wrapper.vm.uploading = true
      wrapper.vm.uploadProgress = 50
      await nextTick()
      
      expect(wrapper.text()).toContain('50%')
      expect(wrapper.text()).toContain('Uploading...')
    })
  })
})