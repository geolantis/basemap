# Domain Setup Guide for mapconfig.geolantis.com

## Current Deployment Status ✅

Your MapConfig converter service is successfully deployed and running at:
- **Production URL**: https://mapconfig-converter-geolantis-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/geolantis-projects/mapconfig-converter

## Setting Up Custom Domain (mapconfig.geolantis.com)

### Option 1: DNS Configuration (Recommended)

Add these DNS records to your domain provider (where geolantis.com is registered):

#### A Records (for root domain if needed)
```
Type: A
Name: @
Value: 76.76.21.21
```

#### CNAME Record (for subdomain)
```
Type: CNAME
Name: mapconfig
Value: cname.vercel-dns.com
```

### Option 2: Via Vercel Dashboard

1. Go to: https://vercel.com/geolantis-projects/mapconfig-converter/settings/domains
2. Click "Add Domain"
3. Enter: `mapconfig.geolantis.com`
4. Follow Vercel's instructions for DNS configuration

### Option 3: Using Vercel CLI (after DNS is configured)

```bash
# First add domain to project
vercel domains add mapconfig.geolantis.com

# Then assign to deployment
vercel alias set mapconfig-converter-geolantis-projects.vercel.app mapconfig.geolantis.com
```

## DNS Providers Configuration

### Cloudflare
1. Log in to Cloudflare Dashboard
2. Select your domain (geolantis.com)
3. Go to DNS settings
4. Add CNAME record:
   - Type: CNAME
   - Name: mapconfig
   - Target: cname.vercel-dns.com
   - Proxy status: DNS only (gray cloud)

### Namecheap
1. Log in to Namecheap
2. Domain List → Manage → Advanced DNS
3. Add new record:
   - Type: CNAME
   - Host: mapconfig
   - Value: cname.vercel-dns.com
   - TTL: Automatic

### GoDaddy
1. Log in to GoDaddy
2. My Products → DNS → Manage
3. Add → CNAME:
   - Name: mapconfig
   - Value: cname.vercel-dns.com
   - TTL: 1 hour

### Google Domains
1. Log in to Google Domains
2. My domains → Manage → DNS
3. Custom records → Create new record:
   - Type: CNAME
   - Host name: mapconfig
   - Data: cname.vercel-dns.com
   - TTL: 3600

## Verification

After DNS propagation (5-30 minutes), verify:

```bash
# Check DNS resolution
dig mapconfig.geolantis.com

# Test with curl
curl -I https://mapconfig.geolantis.com

# Or open in browser
open https://mapconfig.geolantis.com
```

## SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt once DNS is configured.

## Alternative Deployment Options

If you prefer not to use Vercel, the service can be deployed to:

### 1. Your Own Server (Docker)
```bash
# On your server
git clone https://github.com/geolantis/basemap.git
cd basemap/mapconfig-service
docker-compose up -d
```

Then configure nginx/Apache to proxy to port 3000.

### 2. DigitalOcean App Platform
```bash
# Using DO CLI
doctl apps create --spec app.yaml
```

### 3. AWS EC2 with PM2
```bash
# On EC2 instance
./deploy.sh pm2
```

### 4. Heroku
```bash
heroku create mapconfig-geolantis
git push heroku main
```

## Current Features Available

Once domain is configured, users can access:

- **Web Interface**: https://mapconfig.geolantis.com
- **API Endpoint**: https://mapconfig.geolantis.com/api/convert
- **Health Check**: https://mapconfig.geolantis.com/api/health
- **Examples**: https://mapconfig.geolantis.com/api/examples

## Support

For issues or questions:
- GitHub: https://github.com/geolantis/basemap/issues
- Current deployment: https://mapconfig-converter-geolantis-projects.vercel.app

---

Last updated: $(date)