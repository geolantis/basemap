# 🚀 Production Deployment Guide for Map Styles

## Current Status
- ✅ Local development working with style server on port 3001
- ✅ Style files prepared in `public/styles/` directory
- ✅ Vercel configuration updated with proxy rewrites
- ✅ API endpoint created for dynamic style serving

## Deployment Options

### Option 1: Static Files (Recommended for Production)
Styles are served as static files from `/styles/` directory.

**Pros:**
- Fast CDN delivery
- No serverless function overhead
- Better caching
- Lower costs

**Cons:**
- Need to redeploy when styles change
- Larger deployment size

### Option 2: API Endpoint
Styles are served dynamically through `/api/styles/[styleName]`

**Pros:**
- Can fetch from GitHub or other sources
- Dynamic updates possible
- Smaller deployment size

**Cons:**
- Serverless function overhead
- Slightly slower

## 🎯 Quick Deployment Steps

### 1. Prepare for Deployment
```bash
# Copy all style files to public directory
npm run prepare:styles

# Test the build locally
npm run build
npm run preview
```

### 2. Update Vercel Configuration
The `vercel.json` is already configured with:
- ✅ Proxy rewrites for Kataster and KTN tiles
- ✅ CORS headers for styles
- ✅ Caching configuration

### 3. Commit Changes
```bash
git add .
git commit -m "Add production style serving with Vercel

- Added style files to public/styles
- Configured Vercel proxy for tile servers
- Added API endpoint for dynamic style serving
- Updated database URLs for production"
git push
```

### 4. Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# Or if you have automatic deployments enabled, just push to main
git push origin main
```

### 5. Update Database for Production
After deployment, get your Vercel URL and update the database:

```bash
# Set your Vercel URL
export VERCEL_URL=https://your-app.vercel.app

# Update database with production URLs
node scripts/update-to-production.js --prod
```

## 📊 What Gets Deployed

### Files Structure
```
web/
├── api/
│   └── styles/
│       └── [styleName].js      # API endpoint (optional)
├── public/
│   └── styles/                 # Static style files
│       ├── basemap.json
│       ├── kataster-bev2.json
│       └── ... (22 files total)
├── dist/                        # Built Vue app
└── vercel.json                  # Vercel configuration
```

### URL Structure in Production
```
# Static files (faster, recommended)
https://your-app.vercel.app/styles/basemap.json
https://your-app.vercel.app/styles/kataster-bev2.json

# API endpoint (optional, dynamic)
https://your-app.vercel.app/api/styles/basemap
https://your-app.vercel.app/api/styles/kataster-bev2

# Proxy endpoints (for tiles)
https://your-app.vercel.app/proxy/kataster/...
https://your-app.vercel.app/proxy/ktn/...
```

## 🔧 Environment Variables

No additional environment variables needed for style serving. The existing Supabase variables are sufficient.

## ✅ Post-Deployment Checklist

1. **Test Style Loading**
   ```bash
   curl https://your-app.vercel.app/styles/basemap.json
   curl https://your-app.vercel.app/api/styles/kataster-bev2
   ```

2. **Test Proxy Endpoints**
   - Check that tile requests through `/proxy/kataster/` work
   - Verify CORS headers are present

3. **Test in Application**
   - Open your deployed app
   - Load a map with overlays
   - Verify vector tiles display correctly

4. **Update Database**
   - Run the production update script
   - Verify maps load with new URLs

## 🔄 Rollback Plan

If issues occur, you can quickly rollback:

```bash
# Switch back to localhost URLs
node scripts/update-to-style-server.js

# Or restore previous deployment in Vercel dashboard
```

## 📝 Important Notes

1. **Style References**: Files like `basemap7.json` that reference `bm.json` will work automatically
2. **CORS**: All configured in `vercel.json` - no additional setup needed
3. **Caching**: Styles are cached for 5 minutes (API) or 1 hour (static)
4. **Tile Proxy**: Kataster and KTN tiles are proxied to avoid CORS issues

## 🎉 Success Indicators

You'll know deployment is successful when:
- ✅ Styles load without CORS errors
- ✅ Vector tile overlays display correctly
- ✅ Style references (like basemap7 → bm.json) resolve properly
- ✅ Tile requests work through proxy endpoints

## 🆘 Troubleshooting

### Styles not loading
- Check Vercel function logs
- Verify files exist in `public/styles/`
- Check browser console for CORS errors

### Tiles not displaying
- Verify proxy rewrites in `vercel.json`
- Check network tab for failed tile requests
- Ensure original tile servers are accessible

### Database not updating
- Verify Supabase credentials
- Check that map names match exactly
- Review error messages in update script

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review browser console errors
3. Test endpoints with curl
4. Verify database updates in Supabase dashboard

---

**Ready to deploy? Run `npm run build:prod && vercel --prod` 🚀**