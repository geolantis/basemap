export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  return res.status(200).json({
    endpoint: 'version',
    timestamp: new Date().toISOString(),
    deployment: 'v5-2025-01-10-vercel-fix',
    handlers: {
      upload: 'v4-2025-01-10-final',
      testDeploy: 'v4-final-fixes'
    },
    vercelConfig: {
      root: 'map-config-service/web',
      functionsPattern: 'api/**/*.js'
    },
    message: 'Deployment successful with fixed Vercel configuration'
  });
}