// Comprehensive health check endpoint for monitoring
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'basemap-config-editor',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100
      }
    };

    // Check critical dependencies
    const checks = {
      supabase: false,
      database: false,
      styles_server: false
    };

    // Check Supabase connection
    try {
      if (process.env.VITE_SUPABASE_URL) {
        const supabaseResponse = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
            'User-Agent': 'basemap-config-health-check'
          }
        });
        checks.supabase = supabaseResponse.ok;
      }
    } catch (error) {
      console.warn('Supabase health check failed:', error.message);
    }

    // Check styles server
    try {
      if (process.env.VITE_STYLES_SERVER_URL) {
        const stylesResponse = await fetch(process.env.VITE_STYLES_SERVER_URL + '/health', {
          method: 'HEAD',
          timeout: 5000
        }).catch(() => ({ ok: false }));
        checks.styles_server = stylesResponse.ok;
      } else {
        checks.styles_server = true; // Not required if not configured
      }
    } catch (error) {
      console.warn('Styles server health check failed:', error.message);
    }

    // Database check is same as Supabase for this app
    checks.database = checks.supabase;

    // Determine overall health
    const criticalServices = ['database'];
    const isCriticalHealthy = criticalServices.every(service => checks[service] === true);
    
    const overallStatus = isCriticalHealthy ? 'healthy' : 'degraded';
    const statusCode = isCriticalHealthy ? 200 : 503;

    const response = {
      ...healthData,
      status: overallStatus,
      checks,
      details: {
        critical_services_healthy: isCriticalHealthy,
        all_services_healthy: Object.values(checks).every(check => check === true)
      }
    };

    // Set appropriate cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(statusCode).json(response);
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'basemap-config-editor',
      error: 'Internal health check error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}