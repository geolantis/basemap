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
      },
      // General proxy for tile requests to handle CORS issues
      '/tile-proxy': {
        target: 'http://localhost:3000', // This will be overridden dynamically
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Extract the actual URL from the query parameter
            const urlParam = new URL(req.url || '', `http://localhost:5173`).searchParams.get('url');
            if (urlParam) {
              const targetUrl = new URL(decodeURIComponent(urlParam));
              proxyReq.setHeader('host', targetUrl.host);
              proxyReq.path = targetUrl.pathname + targetUrl.search;
              
              // Update the proxy target dynamically
              const protocol = targetUrl.protocol.replace(':', '');
              const port = targetUrl.port || (protocol === 'https' ? 443 : 80);
              proxyReq.agent = protocol === 'https' 
                ? require('https').globalAgent 
                : require('http').globalAgent;
              proxyReq.host = targetUrl.hostname;
              proxyReq.port = port;
              proxyReq.protocol = protocol + ':';
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, OPTIONS';
          });
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  }
})