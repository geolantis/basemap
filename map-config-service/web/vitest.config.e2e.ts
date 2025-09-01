import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    globals: true,
    include: ['src/test/e2e/**/*.spec.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    testTimeout: 60000, // Even longer timeout for E2E tests
    hookTimeout: 60000,
    reporters: ['default', 'json'],
    outputFile: {
      json: 'test-reports/e2e-results.json'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})