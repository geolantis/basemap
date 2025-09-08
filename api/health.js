export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: 'v1-2025-01-10',
    uploadHandler: {
      version: 'v5-2025-01-10-production',
      location: '/api/styles/upload.js',
      supportsGET: true
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY
    },
    message: 'API is operational'
  });
}