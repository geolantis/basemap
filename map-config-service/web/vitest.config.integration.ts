import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    globals: true,
    include: ['src/test/integration/**/*.spec.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    testTimeout: 30000, // Longer timeout for integration tests
    hookTimeout: 30000,
    reporters: ['default', 'json'],
    outputFile: {
      json: 'test-reports/integration-results.json'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})