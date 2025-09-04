const axios = require('axios');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Get the URL to proxy from query parameters
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    try {
        // Decode the URL
        const targetUrl = decodeURIComponent(url);
        
        // Make the request to the target URL
        const response = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'MapConfig-Converter/1.0',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate'
            }
        });
        
        // Forward the content type
        const contentType = response.headers['content-type'];
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }
        
        // Cache tiles for better performance
        if (targetUrl.includes('.pbf')) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
        
        // Send the response
        res.status(200).send(response.data);
        
    } catch (error) {
        console.error('Proxy error:', error.message);
        
        if (error.response) {
            res.status(error.response.status).json({ 
                error: 'Proxy request failed',
                status: error.response.status,
                message: error.message
            });
        } else {
            res.status(500).json({ 
                error: 'Proxy request failed',
                message: error.message
            });
        }
    }
};