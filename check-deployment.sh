#!/bin/bash

echo "🔍 Checking Vercel Deployment Status..."
echo ""

# Check if the site is accessible
echo "1️⃣ Checking if site is accessible..."
if curl -s -o /dev/null -w "%{http_code}" https://mapconfig.geolantis.com | grep -q "200"; then
    echo "✅ Site is accessible (HTTP 200)"
else
    echo "⚠️ Site returned non-200 status code"
fi

echo ""
echo "2️⃣ Checking deployment info..."
echo "GitHub Repo: https://github.com/geolantis/basemap"
echo "Latest commit: $(git rev-parse --short HEAD)"
echo "Commit message: $(git log -1 --pretty=%B | head -1)"

echo ""
echo "3️⃣ Vercel Dashboard:"
echo "Visit: https://vercel.com/dashboard"
echo "Check the deployment status for 'basemap' project"

echo ""
echo "📝 Deployment Configuration:"
echo "- Build Command: cd map-config-service/web && npm install && npm run build"
echo "- Output Directory: map-config-service/web/dist"
echo "- Production URL: https://mapconfig.geolantis.com"

echo ""
echo "✅ Push successful! Vercel should now be deploying automatically."
echo "Check the Vercel dashboard for real-time deployment status."