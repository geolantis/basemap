import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path
      },
      // Proxy for Austrian cadastral tiles
      '/kataster-tiles': {
        target: 'https://kataster.bev.gv.at',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kataster-tiles/, ''),
        secure: false
      },
      // Proxy for KTN tiles
      '/ktn-tiles': {
        target: 'https://gis.ktn.gv.at',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ktn-tiles/, ''),
        secure: false
      }
    }
  }
})
