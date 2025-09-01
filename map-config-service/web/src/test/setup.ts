import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.URL.createObjectURL for file upload tests
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mocked-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
})

// Mock DataTransfer for drag and drop tests
global.DataTransfer = class {
  items = []
  files = []
  constructor() {
    this.items = []
    this.files = []
  }
}

// Mock DragEvent for drag and drop tests
global.DragEvent = class extends Event {
  dataTransfer: DataTransfer
  
  constructor(type: string, eventInitDict: any = {}) {
    super(type, eventInitDict)
    this.dataTransfer = eventInitDict.dataTransfer || new DataTransfer()
  }
}

// Mock File constructor with text() method
global.File = class extends Blob {
  name: string
  lastModified: number
  
  constructor(chunks: any[], filename: string, options: any = {}) {
    super(chunks, options)
    this.name = filename
    this.lastModified = Date.now()
  }
  
  text(): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsText(this)
    })
  }
}

// Mock FileReader
global.FileReader = class {
  result: string | ArrayBuffer | null = null
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  
  readAsText(blob: Blob) {
    setTimeout(() => {
      if (blob instanceof Blob) {
        // Convert blob to text
        const reader = new (globalThis as any).FileReader()
        if (reader) {
          blob.arrayBuffer().then(buffer => {
            this.result = new TextDecoder().decode(buffer)
            if (this.onload) {
              this.onload({} as ProgressEvent<FileReader>)
            }
          })
        } else {
          // Fallback for test environment
          this.result = blob.toString()
          if (this.onload) {
            this.onload({} as ProgressEvent<FileReader>)
          }
        }
      }
    }, 0)
  }
  
  readAsDataURL(blob: Blob) {
    setTimeout(() => {
      this.result = 'data:application/json;base64,eyJ0ZXN0IjoidGVzdCJ9'
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>)
      }
    }, 0)
  }
}

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock performance.now for timing tests
if (!global.performance) {
  global.performance = {
    now: vi.fn(() => Date.now())
  } as any
}