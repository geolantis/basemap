# Deployment Guide - Map Configuration Service

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): `npm i -g vercel`
3. **Git Repository**: Push your code to GitHub/GitLab/Bitbucket

## 🚀 Quick Deploy with Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Select the `map-config-service/web` directory as root

2. **Configure Build Settings**
   - Framework Preset: `Vue.js`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   Click "Environment Variables" and add:
   ```
   VITE_SUPABASE_URL=https://wphrytrrikfkwehwahqc.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   API_KEYS=production-key-1,production-key-2
   ALLOWED_ORIGINS=https://your-domain.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

### Option 2: Deploy via CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd map-config-service/web
   vercel
   ```

4. **Follow prompts**
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N` (first time)
   - Project name? `map-config-service`
   - Directory? `./`
   - Override settings? `N`

5. **Set Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add API_KEYS
   vercel env add ALLOWED_ORIGINS
   ```

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbG...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_CLAUDE_API_KEY` | Claude API key for AI search | (empty) |
| `API_KEYS` | Comma-separated API keys for 3rd party access | `development-key` |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | `*` |

## 📂 Important Files

### Files Included in Deployment

- `/public/styles/` - All map style JSON files (25 files)
- `/dist/` - Built Vue application
- `/api/` - Serverless API functions
- `vercel.json` - Deployment configuration

### Files NOT Deployed

- `.env.local` - Local environment variables
- `node_modules/` - Dependencies (installed during build)
- Source code - Only built files are deployed

## 🌐 Post-Deployment

### 1. Verify Deployment

Your app will be available at:
- Production: `https://map-config-service.vercel.app`
- Preview: `https://map-config-service-[branch].vercel.app`

### 2. Test Key Features

- [ ] Map gallery loads (94 maps)
- [ ] Style files accessible at `/styles/*.json`
- [ ] API endpoint works: `/api/maps`
- [ ] Maputnik integration opens
- [ ] Search and filtering work
- [ ] Config editor (if password protected)

### 3. Configure Custom Domain (Optional)

1. Go to Vercel Dashboard > Settings > Domains
2. Add your domain (e.g., `maps.yourdomain.com`)
3. Update DNS records as instructed

### 4. Set Up API Access

For 3rd party apps to access your maps:

1. Generate API keys:
   ```bash
   vercel env add API_KEYS production
   # Enter: key1,key2,key3
   ```

2. Share with developers:
   ```javascript
   fetch('https://your-domain.vercel.app/api/maps', {
     headers: {
       'X-API-Key': 'your-api-key'
     }
   })
   ```

## 🔄 Updating

### Deploy Updates

```bash
# Automatic (via Git)
git add .
git commit -m "Update maps"
git push origin main

# Manual (via CLI)
vercel --prod
```

### Update Style Files

1. Upload new styles via Config Editor
2. Or add to `public/styles/` and redeploy

### Update Environment Variables

```bash
# Via Dashboard
Vercel Dashboard > Settings > Environment Variables

# Via CLI
vercel env rm VARIABLE_NAME
vercel env add VARIABLE_NAME
```

## 🐛 Troubleshooting

### Build Fails

- Check `vercel.json` configuration
- Ensure all dependencies in `package.json`
- Review build logs in Vercel Dashboard

### Styles Not Loading

- Verify files in `public/styles/`
- Check URLs use `/styles/` prefix
- Confirm CORS headers in `vercel.json`

### API Not Working

- Check environment variables are set
- Verify API functions in `/api/` directory
- Review function logs in Vercel Dashboard

### Supabase Connection Issues

- Verify Supabase URL and key are correct
- Check Supabase project is active
- Review RLS policies in Supabase

## 📊 Monitoring

### Analytics

- View in Vercel Dashboard > Analytics
- Track page views, API calls, performance

### Logs

- Function logs: Dashboard > Functions
- Build logs: Dashboard > Deployments
- Error tracking: Dashboard > Monitoring

## 🔒 Security Checklist

- [x] API keys removed from client code
- [x] Environment variables properly set
- [x] CORS configured for your domains
- [x] Style files served with cache headers
- [x] Sensitive routes password protected
- [ ] Rate limiting configured (optional)
- [ ] Custom domain with SSL (automatic)

## 📞 Support

- **Vercel Issues**: [vercel.com/support](https://vercel.com/support)
- **Build Problems**: Check [Vercel Docs](https://vercel.com/docs)
- **Application Issues**: Review this repository's issues

## 🎉 Success!

Once deployed, your map configuration service will be:
- ✅ Globally distributed via Vercel's CDN
- ✅ Automatically scaled based on traffic
- ✅ Protected with SSL certificates
- ✅ Optimized for performance
- ✅ Ready for 3rd party integrations

---

**Next Steps:**
1. Share your deployment URL
2. Test all features
3. Configure custom domain
4. Set up monitoring
5. Share API documentation with developers