import { vi } from 'vitest'

/**
 * Test helper utilities for the Style Upload feature tests
 */

// File creation helpers
export const createMockFile = (name: string, content: string, type = 'application/json'): File => {
  const blob = new Blob([content], { type })
  const file = new File([blob], name, { type, lastModified: Date.now() })
  
  // Mock file size
  Object.defineProperty(file, 'size', {
    value: content.length,
    writable: false
  })
  
  return file
}

export const createLargeFile = (name: string, sizeMB: number): File => {
  const content = 'x'.repeat(sizeMB * 1024 * 1024)
  return createMockFile(name, content)
}

// Style content helpers
export const createValidMapboxStyle = (overrides?: any) => ({
  version: 8,
  name: 'Test Style',
  sources: {
    'test-source': {
      type: 'vector',
      tiles: ['https://example.com/{z}/{x}/{y}.pbf']
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#f0f0f0' }
    }
  ],
  ...overrides
})

export const createInvalidMapboxStyle = () => ({
  name: 'Invalid Style',
  // Missing version, sources, layers
})

// Event helpers
export const createDragEvent = (type: string, files: File[] = []): DragEvent => {
  const event = new DragEvent(type, {
    bubbles: true,
    cancelable: true
  })
  
  const mockDataTransfer = {
    files,
    items: files.map(file => ({ kind: 'file', type: file.type })),
    types: ['Files']
  }
  
  Object.defineProperty(event, 'dataTransfer', {
    value: mockDataTransfer,
    writable: false
  })
  
  return event
}

// Fetch mocking helpers
export const mockFetchSuccess = (data: any) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
    headers: {
      get: (name: string) => {
        const headers: Record<string, string> = {
          'content-type': 'application/json',
          'access-control-allow-origin': '*'
        }
        return headers[name.toLowerCase()]
      }
    }
  })
}

export const mockFetchError = (status: number, error: string) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ error }),
    headers: { get: () => null }
  })
}

export const mockFetchNetworkError = (error: string) => {
  global.fetch = vi.fn().mockRejectedValue(new Error(error))
}

// Form data helpers
export const createFormDataMock = () => {
  const formData = new Map()
  
  return {
    append: vi.fn((key, value) => formData.set(key, value)),
    get: vi.fn((key) => formData.get(key)),
    has: vi.fn((key) => formData.has(key)),
    delete: vi.fn((key) => formData.delete(key)),
    entries: vi.fn(() => formData.entries()),
    keys: vi.fn(() => formData.keys()),
    values: vi.fn(() => formData.values()),
    _mockData: formData // For test inspection
  }
}

// Progress simulation
export const simulateProgress = async (callback: (progress: number) => void, durationMs = 1000) => {
  const steps = 10
  const stepDuration = durationMs / steps
  
  for (let i = 0; i <= steps; i++) {
    const progress = (i / steps) * 100
    callback(progress)
    
    if (i < steps) {
      await new Promise(resolve => setTimeout(resolve, stepDuration))
    }
  }
}

// Wait helpers
export const waitFor = (condition: () => boolean, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const check = () => {
      if (condition()) {
        resolve()
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`Timeout waiting for condition after ${timeout}ms`))
      } else {
        setTimeout(check, 100)
      }
    }
    
    check()
  })
}

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

// DOM helpers
export const expectElementToExist = (wrapper: any, selector: string) => {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  return element
}

export const expectElementToNotExist = (wrapper: any, selector: string) => {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(false)
}

export const expectElementToHaveText = (wrapper: any, selector: string, text: string) => {
  const element = expectElementToExist(wrapper, selector)
  expect(element.text()).toContain(text)
  return element
}

export const expectElementToHaveClass = (wrapper: any, selector: string, className: string) => {
  const element = expectElementToExist(wrapper, selector)
  expect(element.classes()).toContain(className)
  return element
}

// Error assertion helpers
export const expectToThrowAsync = async (asyncFn: () => Promise<any>, errorMessage?: string) => {
  let error: Error | undefined
  
  try {
    await asyncFn()
  } catch (e) {
    error = e as Error
  }
  
  expect(error).toBeDefined()
  
  if (errorMessage) {
    expect(error?.message).toContain(errorMessage)
  }
  
  return error
}

// Performance helpers
export const measureExecutionTime = async (fn: () => Promise<any>): Promise<{ result: any, timeMs: number }> => {
  const startTime = performance.now()
  const result = await fn()
  const endTime = performance.now()
  
  return {
    result,
    timeMs: endTime - startTime
  }
}

// Test data factories
export class TestDataFactory {
  static createMapConfig(overrides?: any) {
    return {
      id: `test-config-${Date.now()}`,
      name: 'test-style',
      label: 'Test Style',
      type: 'vtc' as const,
      style: 'http://localhost:3001/custom-styles/test-style.json',
      country: 'de',
      flag: '🇩🇪',
      version: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    }
  }
  
  static createUploadResponse(overrides?: any) {
    return {
      success: true,
      message: 'Style uploaded successfully',
      config: this.createMapConfig(),
      styleUrl: 'http://localhost:3001/custom-styles/test-style.json',
      ...overrides
    }
  }
  
  static createUser(overrides?: any) {
    return {
      id: `user-${Date.now()}`,
      email: 'test@example.com',
      name: 'Test User',
      role: 'editor' as const,
      createdAt: new Date().toISOString(),
      ...overrides
    }
  }
}

// Cleanup helpers
export const cleanupTestFiles = () => {
  // Reset global mocks
  vi.restoreAllMocks()
  
  // Clear any test data
  if (global.fetch && typeof global.fetch.mockClear === 'function') {
    global.fetch.mockClear()
  }
}

// Debug helpers
export const logTestState = (testName: string, state: any) => {
  if (process.env.NODE_ENV === 'test' && process.env.DEBUG_TESTS) {
    console.log(`[${testName}] State:`, JSON.stringify(state, null, 2))
  }
}

export const expectConsoleError = () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  return {
    expectCalled: () => expect(consoleSpy).toHaveBeenCalled(),
    expectCalledWith: (message: string) => expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(message)),
    restore: () => consoleSpy.mockRestore()
  }
}