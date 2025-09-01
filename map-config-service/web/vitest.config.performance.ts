import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node', // Performance tests don't need DOM
    globals: true,
    include: ['src/test/performance/**/*.spec.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    testTimeout: 120000, // 2 minutes for performance tests
    hookTimeout: 120000,
    reporters: ['default', 'json'],
    outputFile: {
      json: 'test-reports/performance-results.json'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})