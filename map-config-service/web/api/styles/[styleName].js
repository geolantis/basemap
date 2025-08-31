// Vercel Serverless Function for serving map styles
// This will work in production on Vercel

export default async function handler(req, res) {
  const { styleName } = req.query;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  if (!styleName) {
    return res.status(400).json({ error: 'Style name is required' });
  }
  
  try {
    // For production, we'll use GitHub API to fetch from private repo
    // Or better: use pre-uploaded styles in Vercel's public directory
    
    // Option 1: Fetch from GitHub API (requires GitHub token)
    if (process.env.GITHUB_TOKEN) {
      const owner = 'your-github-username'; // Update this
      const repo = 'basemap';
      const path = `${styleName}.json`;
      
      const githubResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3.raw'
          }
        }
      );
      
      if (!githubResponse.ok) {
        throw new Error(`GitHub API returned ${githubResponse.status}`);
      }
      
      const styleJson = await githubResponse.json();
      const processedStyle = processStyleReferences(styleJson, req);
      
      return res.status(200).json(processedStyle);
    }
    
    // Option 2: Serve from static files (if you deploy styles with the app)
    // This requires copying style files to public/styles/ before deployment
    const styleUrl = `${process.env.VERCEL_URL || req.headers.host}/styles/${styleName}.json`;
    const response = await fetch(styleUrl);
    
    if (!response.ok) {
      return res.status(404).json({ error: `Style '${styleName}' not found` });
    }
    
    const styleJson = await response.json();
    const processedStyle = processStyleReferences(styleJson, req);
    
    res.status(200).json(processedStyle);
    
  } catch (error) {
    console.error('Error fetching style:', error);
    res.status(500).json({ error: 'Failed to fetch style', details: error.message });
  }
}

function processStyleReferences(styleJson, req) {
  const processed = { ...styleJson };
  const baseUrl = `https://${process.env.VERCEL_URL || req.headers.host}`;
  
  // Update sources that reference other styles
  if (processed.sources) {
    Object.keys(processed.sources).forEach(sourceId => {
      const source = processed.sources[sourceId];
      
      // Update style references
      if (source.url && source.url.endsWith('.json')) {
        const refStyleName = source.url.split('/').pop().replace('.json', '');
        source.url = `${baseUrl}/api/styles/${refStyleName}`;
      }
      
      // Update tile URLs to use proxy
      if (source.tiles) {
        source.tiles = source.tiles.map(tileUrl => {
          if (tileUrl.includes('kataster.bev.gv.at')) {
            return tileUrl; // Vercel will handle CORS headers
          }
          return tileUrl;
        });
      }
    });
  }
  
  return processed;
}