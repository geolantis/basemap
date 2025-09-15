import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      // Proxy for tile CORS issues - handles /api/proxy-tiles
      '/api/proxy-tiles': {
        target: 'http://localhost:5173', // dummy target, we'll override it
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', async (proxyReq, req, res) => {
            const url = new URL(req.url || '', 'http://localhost:5173');
            const targetUrl = url.searchParams.get('url');
            
            if (!targetUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing URL parameter' }));
              return;
            }
            
            try {
              const decodedUrl = decodeURIComponent(targetUrl);
              console.log(`Proxying tile: ${decodedUrl}`);
              
              // Fetch the tile directly
              const fetch = (await import('node-fetch')).default;
              const response = await fetch(decodedUrl, {
                headers: {
                  'User-Agent': 'MapConfigService/1.0',
                  'Accept': 'image/*,*/*'
                }
              });
              
              if (!response.ok) {
                res.statusCode = response.status;
                res.end(`Proxy failed: ${response.statusText}`);
                return;
              }
              
              const buffer = await response.buffer();
              const contentType = response.headers.get('content-type') || 'image/png';
              
              res.setHeader('Content-Type', contentType);
              res.setHeader('Cache-Control', 'public, max-age=86400');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(buffer);
              
              // Prevent the normal proxy from continuing
              proxyReq.abort();
            } catch (error) {
              console.error('Proxy error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Proxy failed' }));
              proxyReq.abort();
            }
          });
        }
      },
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