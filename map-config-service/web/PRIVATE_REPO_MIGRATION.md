# Private Repository Migration Strategy

## Problem
After making the `geolantis/basemap` repository private, all style URLs like:
- `https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster-bev2.json`

are no longer publicly accessible, breaking map configurations.

## Solution 1: Self-Host Style Files (Recommended)

### Implementation Steps

1. **Create a public styles directory in your Vercel deployment**
   ```
   web/
   ├── public/
   │   └── styles/
   │       ├── kataster-bev2.json
   │       ├── basemap-ortho.json
   │       ├── osmliberty.json
   │       └── ... (all other style files)
   ```

2. **Update all style URLs in the configuration**
   - From: `https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/style.json`
   - To: `https://your-domain.vercel.app/styles/style.json`

3. **Benefits**
   - ✅ Full control over style files
   - ✅ No dependency on GitHub availability
   - ✅ Can modify styles without updating repo
   - ✅ Better performance (served from same domain)
   - ✅ Works with private repository

## Solution 2: GitHub Personal Access Token

### For Internal/Authenticated Users Only

1. **Create a GitHub Personal Access Token**
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Create token with `repo` scope
   - Store in environment variable

2. **Create API Proxy Endpoint**
   ```typescript
   // api/github-style/[...path].ts
   export default async function handler(req: Request) {
     const path = req.url.split('/api/github-style/')[1];
     const response = await fetch(
       `https://api.github.com/repos/geolantis/basemap/contents/${path}`,
       {
         headers: {
           'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
           'Accept': 'application/vnd.github.v3.raw'
         }
       }
     );
     const content = await response.text();
     return new Response(content, {
       headers: { 'Content-Type': 'application/json' }
     });
   }
   ```

3. **Update URLs**
   - From: `https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/style.json`
   - To: `https://your-domain.vercel.app/api/github-style/style.json`

## Solution 3: CDN/Cloud Storage

### For Public Access

1. **Upload style files to a CDN or cloud storage**
   - AWS S3 with CloudFront
   - Cloudflare R2
   - Azure Blob Storage
   - Google Cloud Storage

2. **Update URLs to CDN endpoints**
   - From: `https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/style.json`
   - To: `https://cdn.your-domain.com/styles/style.json`

## Solution 4: GitHub Pages (Separate Public Repo)

1. **Create a separate public repository** for style files only
   - `geolantis/basemap-styles` (public)
   - Enable GitHub Pages

2. **Access via GitHub Pages**
   - `https://geolantis.github.io/basemap-styles/kataster-bev2.json`

## Solution 5: Dynamic Style Generation

### For Advanced Use Cases

1. **Store style configurations in database**
2. **Generate styles dynamically via API**
   ```typescript
   // api/styles/[styleId].ts
   export default async function handler(req: Request) {
     const styleId = req.url.split('/api/styles/')[1];
     const style = await generateStyleFromDatabase(styleId);
     return new Response(JSON.stringify(style), {
       headers: { 'Content-Type': 'application/json' }
     });
   }
   ```

## Recommended Approach

For your use case, I recommend **Solution 1 (Self-Hosting)** because:

1. **Simplicity**: Easy to implement and maintain
2. **Performance**: Styles served from same domain
3. **Reliability**: No external dependencies
4. **Security**: Can control access if needed
5. **Cost-effective**: Uses existing Vercel deployment

## Migration Script

```javascript
// scripts/migrate-styles.js
import fs from 'fs';
import path from 'path';

const STYLE_URLS = [
  'kataster-bev2.json',
  'basemap-ortho.json',
  'osmliberty.json',
  // ... add all style file names
];

async function downloadStyles() {
  const publicDir = path.join(process.cwd(), 'public', 'styles');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  for (const styleFile of STYLE_URLS) {
    // If you have local copies, copy them
    // Otherwise, you'll need to download them while repo is still public
    // or access them with authentication
    
    console.log(`Processing ${styleFile}...`);
    // Copy or download logic here
  }
}

// Update configuration to use new URLs
function updateConfiguration() {
  const config = JSON.parse(fs.readFileSync('src/data/mapconfig-full.json', 'utf8'));
  
  // Update all style URLs
  config.forEach(map => {
    if (map.style && map.style.includes('raw.githubusercontent.com/geolantis/basemap')) {
      const filename = map.style.split('/').pop();
      map.style = `/styles/${filename}`;
    }
  });
  
  fs.writeFileSync('src/data/mapconfig-full.json', JSON.stringify(config, null, 2));
}
```

## Environment Variables Update

```env
# .env.production
PUBLIC_URL=https://your-domain.vercel.app

# If using GitHub token approach
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_REPO=geolantis/basemap
```

## Immediate Action Items

1. **Download all style files** from the private repo while you have access
2. **Choose migration strategy** based on your needs
3. **Update all style URLs** in your configuration
4. **Test all map styles** to ensure they load correctly
5. **Deploy changes** to production

## Security Considerations

- ✅ Style files typically don't contain sensitive data
- ✅ Self-hosting gives you full control
- ⚠️ If styles contain API keys, use server-side proxy
- ⚠️ Monitor bandwidth usage if serving many style files