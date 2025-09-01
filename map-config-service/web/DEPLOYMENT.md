# 🚀 Deployment Guide - Basemap Config Editor

This guide covers all deployment options for the Basemap Configuration Editor, including Vercel, Docker, and self-hosted setups.

## 📋 Table of Contents

- [Quick Deploy to Vercel](#quick-deploy-to-vercel)
- [Comprehensive Deployment Options](#comprehensive-deployment-options)
- [Environment Variables](#environment-variables)
- [CI/CD Pipeline](#cicd-pipeline)
- [Docker Deployment](#docker-deployment)
- [Monitoring & Security](#monitoring--security)

## ⚡ Quick Deploy to Vercel

### Step 1: Create Supabase User
1. Go to Supabase Dashboard: https://app.supabase.com/project/pelicancorp
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** → **"Create new user"**
4. Enter your admin email and password
5. Click **"Create User"**

### Step 2: Run Database Migration
Go to SQL Editor and run:
```sql
-- Add is_public column
ALTER TABLE map_configs 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Set existing configs as public
UPDATE map_configs 
SET is_public = true 
WHERE is_public IS NULL;

-- Enable RLS
ALTER TABLE map_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Public configs are viewable by everyone" ON map_configs;
CREATE POLICY "Public configs are viewable by everyone" 
  ON map_configs FOR SELECT 
  USING (is_active = true AND (is_public = true OR is_public IS NULL));

DROP POLICY IF EXISTS "Authenticated users can manage configs" ON map_configs;
CREATE POLICY "Authenticated users can manage configs" 
  ON map_configs FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

### Step 3: Set Vercel Environment Variables

Go to: https://vercel.com/geolantis-projects/web/settings/environment-variables

Add these variables for **Production**, **Preview**, and **Development**:

```
VITE_SUPABASE_URL=https://wphrytrrikfkwehwahqc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHJ5dHJyaWtma3dlaHdhaHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTI5NzUsImV4cCI6MjA3MjEyODk3NX0.8E7_6gTc4guWSB2lI-hFQfGSEs6ziLmIT3P8xPbmz_k
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHJ5dHJyaWtma3dlaHdhaHFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU1Mjk3NSwiZXhwIjoyMDcyMTI4OTc1fQ.gqZvkZAhCP9jk-6m6YDys2vjGuY_ZElu752gsF-n-bg
JWT_SECRET=mCPU6GLtOaFXr9r5isVqVXHT1oiFzhgAmS43r27GhrI=
MAPTILER_API_KEY=ldV32HV5eBdmgfE7vZJI
CLOCKWORK_API_KEY=9G4F5b99xO28esL8tArIO2Bbp8sGhURW5qIieYTy
```

### Step 4: Deploy to Production

```bash
vercel --prod
```

## 🌟 Comprehensive Deployment Options

### Automatic Deployment (Recommended)

1. **Connect Repository to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Link project to Vercel
   vercel link
   
   # Set additional environment variables
   vercel env add VITE_MAPUTNIK_WEBHOOK_URL
   vercel env add VITE_STYLES_SERVER_URL
   ```

2. **GitHub Integration:**
   - Push to `main` branch triggers production deployment
   - Pull requests create preview deployments
   - Automatic domain assignment

### Domain Configuration

```bash
# Add custom domain
vercel domains add your-domain.com

# Configure DNS (add CNAME record)
# CNAME: your-domain.com -> cname.vercel-dns.com
```

## 🐳 Docker Deployment

### Development Environment

```bash
# Start development environment
docker-compose --profile development up

# Available at: http://localhost:5173
```

### Production Environment

```bash
# Build and start production containers
docker-compose --profile production up --build

# With API server
docker-compose --profile production --profile api up --build

# Available at: http://localhost:80
```

### Docker Build Options

```bash
# Build development image
docker build --target dev -t basemap-editor:dev .

# Build production image
docker build --target production -t basemap-editor:prod .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t basemap-editor:latest .
```

## 🔄 CI/CD Pipeline

### GitHub Actions Setup

The pipeline includes:

1. **Quality Checks:**
   - TypeScript compilation
   - Linting and formatting
   - Unit tests with coverage
   - Security scanning

2. **Build Process:**
   - Optimized production build
   - Asset compression
   - Source maps generation

3. **Deployment:**
   - Preview deployments for PRs
   - Production deployment on main
   - Automatic versioning

### Required GitHub Secrets

```bash
# Vercel secrets
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Environment variables (same as Vercel environment variables above)
```

## 🔒 Security & Monitoring

### Security Headers

The application includes comprehensive security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Performance Monitoring

- Lighthouse CI integration
- Core Web Vitals tracking
- Bundle size analysis
- Performance budgets

### Health Checks

```bash
# API health check
curl https://your-domain.com/api/health

# Application health
curl https://your-domain.com/health
```

## 📱 API Endpoints

### Public API (No Auth Required)
- **Production:** `https://web-tawny-five-75.vercel.app/api/public/mapconfig`
- **Preview:** `https://web-fap5q6jlr-geolantis-projects.vercel.app/api/public/mapconfig`

Mobile apps can use these endpoints without authentication.

### Admin Portal
- **Production:** `https://web-tawny-five-75.vercel.app/login`
- **Preview:** `https://web-fap5q6jlr-geolantis-projects.vercel.app/login`

Login with the user you created in Supabase.

## 🔐 Security Summary

1. **Public API** (`/api/public/mapconfig`)
   - No authentication required
   - Returns sanitized data only
   - Cached for performance
   - Perfect for mobile apps

2. **Admin Portal** 
   - Protected by Supabase Auth
   - Secure session management
   - Full CRUD operations
   - Audit logging ready

## 🧪 Testing

### Test Public API:
```bash
curl https://web-tawny-five-75.vercel.app/api/public/mapconfig
```

### Test Admin Login:
1. Go to: https://web-tawny-five-75.vercel.app/login
2. Login with your Supabase user credentials
3. You should be redirected to the dashboard

## 📝 Notes

- The public API endpoint works without any authentication
- Mobile apps don't need to be updated - they can continue using the public endpoint
- All sensitive keys are hidden from public responses
- Admin access is fully protected with Supabase Auth