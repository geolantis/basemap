# Style Server Solution for Private Repository

## Overview
Since the GitHub repository is now private and raw URLs don't work, we've implemented a local style server that serves the style JSON files directly from your private basemap repository.

## ✅ Solution Implemented

### 1. Style Server (`server.js`)
- Express server running on port 3001
- Serves style JSON files from `/Users/michael/Development/basemap/`
- Automatically resolves style references (e.g., basemap7.json → bm.json)
- Provides proxy endpoints for tile servers to avoid CORS issues

### 2. Key Features
- **Direct file serving**: Reads style files from your local/private repository
- **Reference resolution**: Automatically updates style references to use the API
- **CORS handling**: Full CORS support for cross-origin requests
- **Tile proxying**: Routes for Kataster and KTN tiles to avoid CORS issues
- **Caching**: 5-minute cache headers for better performance

## 🚀 How to Use

### Start the Style Server
```bash
# Start the style server
npm run styles:server

# Or run both Vite dev server and style server
npm run dev:all  # (requires concurrently package)
```

### Server Endpoints
- `GET http://localhost:3001/api/styles` - List all available styles
- `GET http://localhost:3001/api/styles/basemap` - Get specific style
- `GET http://localhost:3001/api/styles/kataster-bev2` - Get Kataster style
- `GET http://localhost:3001/proxy/kataster/*` - Proxy for Kataster tiles
- `GET http://localhost:3001/proxy/ktn/*` - Proxy for KTN tiles

### Test Page
Open http://localhost:5173/test-style-server.html to test the style server with interactive buttons.

## 📦 Files Created

1. **`server.js`** - Express server that serves styles
2. **`test-style-server.html`** - Interactive test page
3. **`update-to-style-server.js`** - Script to update Supabase URLs
4. **`setup-styles-repo.sh`** - Alternative: Create public repo (if needed)

## 🔧 Configuration

### Database Updates
All map configurations in Supabase have been updated to use the style server:
- Style URLs now point to `http://localhost:3001/api/styles/[style-name]`
- Metadata includes `useStyleServer: true` flag
- References between styles are automatically resolved

### Example Style URL Updates
```
Before: https://raw.githubusercontent.com/geolantis/basemap/main/kataster-bev2.json
After:  http://localhost:3001/api/styles/kataster-bev2
```

## 🎯 Benefits

1. **No External Dependencies**: Works with private repository
2. **Automatic Reference Resolution**: Handles style dependencies
3. **CORS-Free**: All served from same origin or proxied
4. **Local Development**: Perfect for development environment
5. **Easy Deployment**: Can be deployed as standalone service

## 🚀 Production Deployment

For production, you have several options:

### Option 1: Deploy Style Server
1. Deploy the server.js to a cloud service (Vercel, Heroku, etc.)
2. Update STYLE_SERVER_URL in your configuration
3. Ensure style files are accessible to the server

### Option 2: Use Supabase Storage
1. Upload style files to Supabase Storage
2. Serve them through Supabase's CDN
3. Update URLs in map_configs

### Option 3: Create Public Repository
1. Run `bash scripts/setup-styles-repo.sh`
2. Create new public GitHub repo for styles only
3. Use GitHub raw URLs

## 📝 Notes

- The style server must be running for maps to load properly
- Style files are read directly from `/Users/michael/Development/basemap/`
- All style references (like basemap7 → bm.json) are automatically resolved
- Tile URLs are proxied to avoid CORS issues
- The server includes comprehensive error handling and logging

## 🔍 Troubleshooting

### If styles don't load:
1. Check style server is running: `npm run styles:server`
2. Verify file exists in basemap directory
3. Check browser console for errors
4. Test API directly: `curl http://localhost:3001/api/styles/basemap`

### If tiles don't load:
1. Check proxy configuration in server.js
2. Verify original tile server is accessible
3. Check for CORS errors in browser console

## 🎉 Result

You now have a fully functional style server that:
- Serves styles from your private repository
- Resolves all style references automatically
- Handles CORS for tiles
- Works seamlessly with your existing setup

The vector tile overlays should now work correctly with this setup!