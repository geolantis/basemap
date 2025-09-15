# Basemap Configuration Service

## Overview
The Basemap Configuration Service provides centralized map configuration management for Geolantis360 applications.

## Components

### map-config-service/web
The main web application for map configuration management.
- **URL**: https://mapconfig.geolantis.com
- **Technology**: Vue 3 + Vite + TypeScript
- **Database**: Supabase

### API
RESTful API endpoints for map service delivery and proxy functionality.

## Development

```bash
# Install dependencies
cd map-config-service/web
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Deployment

The service is automatically deployed to Vercel when changes are pushed to the main branch via GitHub Actions.

### Deployment Status
- **Production URL**: https://mapconfig.geolantis.com
- **CI/CD**: Fully automated via GitHub Actions
- **Last Updated**: November 2024
- **Auto-Deploy**: Enabled via GitHub integration

### CI/CD Pipeline
- ✅ Automated testing on push
- ✅ Security scanning
- ✅ Build verification
- ✅ Automatic deployment to production
- ✅ Release tagging

## Documentation

- [Map Config Service Documentation](map-config-service/web/CLAUDE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Testing Guide](TESTING_GUIDE.md)

## License

© 2024 Geolantis360. All rights reserved.