import { vi } from 'vitest'
import type { StyleUploadResponse, MapConfig } from '../../types'

export const mockMapConfigService = {
  getInstance: vi.fn(() => ({
    uploadStyle: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn()
  }))
}

export const createMockUploadResponse = (overrides?: Partial<StyleUploadResponse>): StyleUploadResponse => ({
  success: true,
  message: 'Style uploaded successfully',
  config: {
    id: 'test-id',
    name: 'test-style',
    label: 'Test Style',
    type: 'vtc',
    style: 'http://localhost:3001/custom-styles/test-style.json',
    country: 'de',
    flag: '🇩🇪',
    version: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as MapConfig,
  styleUrl: 'http://localhost:3001/custom-styles/test-style.json',
  ...overrides
})

export const createMockFile = (name: string, content: string, type = 'application/json'): File => {
  const file = new File([content], name, { type })
  
  // Mock file size
  Object.defineProperty(file, 'size', {
    value: content.length,
    writable: false
  })
  
  // Ensure text() method returns the content
  file.text = vi.fn().mockResolvedValue(content)
  
  return file
}