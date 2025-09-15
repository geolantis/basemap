# Deployment Guide - Vercel Automatic Deployment

## 🚀 Quick Start

**Simply push to GitHub → Vercel deploys automatically!**

- **Production**: Push to `main` branch → Deploys to https://mapconfig.geolantis.com
- **Preview**: Push to any other branch → Creates preview deployment

## Overview

This guide explains how to deploy the Map Configuration Service with secure API key management. All API keys are stored server-side and never exposed to clients.

## ⚠️ GitHub Actions Status

**GitHub Actions workflow has been DISABLED** to allow seamless Vercel deployments.
- File renamed to: `.github/workflows/ci-cd.yml.disabled`
- Vercel handles all building and deployment
- No CI/CD pipeline interference

## Security Architecture

### How It Works

1. **Client Request**: Browser requests a map style from `/api/proxy/style/nz-basemap-topographic`
2. **Proxy Layer**: Server-side proxy fetches the actual style from LINZ with API key
3. **URL Rewriting**: All tile/sprite/glyph URLs in the style are rewritten to use our proxy endpoints
4. **Secure Delivery**: Modified style is sent to client with no API keys exposed

### Protected Endpoints

- `/api/proxy/style/[provider]` - Proxies style JSON files
- `/api/proxy/tiles/[style]/[source]/[z]/[x]/[y]` - Proxies map tiles
- `/api/proxy/sprite/[style]/[encoded]/[variant]` - Proxies sprite sheets
- `/api/proxy/glyphs/[style]/[encoded]/[fontstack]/[range]` - Proxies font glyphs

## Environment Variables

### Required API Keys

Add these to your Vercel dashboard under Settings → Environment Variables:

```bash
# MapTiler API Key
MAPTILER_API_KEY=your_maptiler_key_here

# Clockwork Micro API Key
CLOCKWORK_API_KEY=your_clockwork_key_here

# BEV Austria API Key (optional)
BEV_API_KEY=your_bev_key_here

# LINZ New Zealand API Key
LINZ_API_KEY=your_linz_api_key_here

# Mapbox Access Token (for geocoding)
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

### Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the following naming:
   - Name: `LINZ_API_KEY` (exactly as shown)
   - Value: Your actual API key
   - Environment: Production (and optionally Preview/Development)

### Using Vercel CLI

```bash
# Set environment variables via CLI
vercel env add LINZ_API_KEY production
vercel env add MAPTILER_API_KEY production
vercel env add CLOCKWORK_API_KEY production
vercel env add MAPBOX_ACCESS_TOKEN production
```

## Supported LINZ Styles

The following New Zealand basemap styles are available through the secure proxy:

### 1. NZ Basemap Topographic
- ID: `nz-basemap-topographic`
- URL: `/api/proxy/style/nz-basemap-topographic`
- Description: Detailed topographic map with terrain features

### 2. NZ Basemap Topolite
- ID: `nz-basemap-topolite`
- URL: `/api/proxy/style/nz-basemap-topolite`
- Description: Simplified topographic style for better performance

### 3. NZ Basemap Aerial
- ID: `nz-basemap-aerial`
- URL: `/api/proxy/style/nz-basemap-aerial`
- Description: High-resolution aerial imagery

### 4. NZ Basemap Aerial Hybrid
- ID: `nz-basemap-aerial-hybrid`
- URL: `/api/proxy/style/nz-basemap-aerial-hybrid`
- Description: Aerial imagery with street labels overlay

## Client Usage

### MapLibre GL JS

```javascript
// Initialize map with proxied style (no API key needed)
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://mapconfig.geolantis.com/api/proxy/style/nz-basemap-topographic',
    center: [174.7633, -36.8485], // Auckland
    zoom: 10
});

// Switch to topolite style
map.setStyle('https://mapconfig.geolantis.com/api/proxy/style/nz-basemap-topolite');
```

### Direct API Usage

```javascript
// Fetch style JSON (no API key exposed)
const response = await fetch('https://mapconfig.geolantis.com/api/proxy/style/nz-basemap-topolite');
const styleJson = await response.json();

// All URLs in the style will use our proxy endpoints
// Example: tiles will be served from /api/proxy/tiles/...
```

## Testing

### Local Testing

1. Create `.env.local` file with your API keys
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open `test-nz-styles.html` in your browser
4. Check the console for any exposed API keys

### Production Testing

1. Deploy to Vercel:
   ```bash
   vercel --prod
   ```
2. Visit your deployment URL
3. Open browser DevTools → Network tab
4. Verify all requests go through `/api/proxy/` endpoints
5. Check that no API keys appear in any responses

## Security Checklist

- [ ] All API keys are in environment variables, not in code
- [ ] No API keys in client-side JavaScript
- [ ] All map provider requests go through proxy endpoints
- [ ] Style JSON URLs are rewritten to use proxy
- [ ] Tile URLs use `/api/proxy/tiles/` pattern
- [ ] Sprite URLs use `/api/proxy/sprite/` pattern
- [ ] Glyph URLs use `/api/proxy/glyphs/` pattern
- [ ] CORS headers are properly configured
- [ ] Rate limiting is implemented
- [ ] Error messages don't expose sensitive information

## Monitoring

### Check for API Key Exposure

```javascript
// Quick test to check if API keys are exposed
async function checkSecurity() {
    const response = await fetch('/api/proxy/style/nz-basemap-topographic');
    const text = await response.text();
    
    // Check for known API keys (these should NOT appear)
    const exposedKeys = [
        'c01j9kgtq3hq9yb59c22gnr6k64',  // LINZ key
        'ldV32HV5eBdmgfE7vZJI',          // MapTiler key
        // Add other keys to check
    ];
    
    for (const key of exposedKeys) {
        if (text.includes(key)) {
            console.error(`WARNING: API key exposed: ${key.substring(0, 10)}...`);
            return false;
        }
    }
    
    console.log('✅ All API keys are properly protected');
    return true;
}
```

## Troubleshooting

### Common Issues

1. **403 Forbidden on tiles**
   - Check that LINZ_API_KEY is set in Vercel environment variables
   - Verify the API key is valid and has not expired

2. **CORS errors**
   - Ensure all API endpoints have proper CORS headers
   - Check `vercel.json` configuration

3. **Styles not loading**
   - Verify proxy endpoints are correctly configured
   - Check browser console for specific error messages
   - Test the proxy endpoint directly in browser

4. **API key exposed warning**
   - Review the proxy rewriting logic in `/api/proxy/style/[provider].js`
   - Ensure all source URLs are being rewritten

## Additional Security Measures

### Rate Limiting

The proxy implements basic rate limiting:
- 100 requests per minute for styles
- 500 requests per minute for tiles
- Configurable in proxy endpoint files

### Caching

To reduce API calls and improve performance:
- Styles are cached for 1 hour
- Tiles are cached for 24 hours
- Sprites and glyphs are cached for 7 days

### IP Whitelisting (Optional)

For additional security, you can implement IP whitelisting in the proxy endpoints for production environments.

## Support

For issues or questions:
- Check the browser console for errors
- Review the Network tab in DevTools
- Verify environment variables are set correctly
- Test with the provided `test-nz-styles.html` file

---

Last Updated: 2024
Version: 1.0.0