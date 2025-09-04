#!/bin/bash

# MapConfig Deployment Script
# Usage: ./deploy.sh [vercel|docker|pm2]

set -e

echo "🚀 MapConfig Converter Deployment"
echo "================================="

case "$1" in
  vercel)
    echo "📦 Deploying to Vercel..."
    
    # Install Vercel CLI if not installed
    if ! command -v vercel &> /dev/null; then
      echo "Installing Vercel CLI..."
      npm i -g vercel
    fi
    
    # Deploy to Vercel
    echo "Deploying to Vercel (mapconfig.geolantis.com)..."
    vercel --prod
    
    echo "✅ Deployment complete!"
    echo "Visit: https://mapconfig.geolantis.com"
    ;;
    
  docker)
    echo "🐳 Deploying with Docker..."
    
    # Stop existing containers
    docker-compose down
    
    # Build and start containers
    docker-compose up -d --build
    
    echo "✅ Docker deployment complete!"
    echo "Service running on port 3000"
    
    # Show container status
    docker-compose ps
    ;;
    
  pm2)
    echo "⚡ Deploying with PM2..."
    
    # Install PM2 if not installed
    if ! command -v pm2 &> /dev/null; then
      echo "Installing PM2..."
      npm i -g pm2
    fi
    
    # Stop existing process
    pm2 stop mapconfig-converter 2>/dev/null || true
    pm2 delete mapconfig-converter 2>/dev/null || true
    
    # Install dependencies
    npm ci --only=production
    
    # Start with PM2
    pm2 start server.js --name mapconfig-converter --env production
    
    # Save PM2 config
    pm2 save
    pm2 startup
    
    echo "✅ PM2 deployment complete!"
    pm2 status
    ;;
    
  local)
    echo "🖥️  Starting local development server..."
    npm install
    npm run dev
    ;;
    
  *)
    echo "Usage: $0 [vercel|docker|pm2|local]"
    echo ""
    echo "Options:"
    echo "  vercel  - Deploy to Vercel cloud platform"
    echo "  docker  - Deploy using Docker Compose"
    echo "  pm2     - Deploy using PM2 process manager"
    echo "  local   - Start local development server"
    echo ""
    echo "Example:"
    echo "  ./deploy.sh vercel"
    exit 1
    ;;
esac