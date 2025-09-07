// Simple upload handler that works with Vercel's constraints
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Read the request body
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const data = Buffer.concat(buffers);

    // Get content type and boundary
    const contentType = req.headers['content-type'] || '';
    
    // Handle JSON upload (direct style JSON)
    if (contentType.includes('application/json')) {
      const styleObject = JSON.parse(data.toString());
      
      // Basic validation
      if (!styleObject.version || !styleObject.sources || !styleObject.layers) {
        return res.status(400).json({
          success: false,
          error: 'Invalid style: missing required fields (version, sources, layers)'
        });
      }

      // Generate a temporary URL (in production, this would save to a database or cloud storage)
      const timestamp = Date.now();
      const filename = `custom-style-${timestamp}.json`;
      
      // Return the style configuration
      return res.status(200).json({
        success: true,
        config: {
          name: `custom-style-${timestamp}`,
          label: styleObject.name || 'Custom Style',
          type: 'vtc',
          style: `/api/styles/temp/${filename}`, // Temporary URL
          originalStyle: `/api/styles/temp/${filename}`,
          country: 'Global',
          flag: '🌍',
          map_category: 'background',
          metadata: {
            uploadedAt: new Date().toISOString(),
            filename: filename,
            styleData: styleObject // Include the actual style data
          },
          isActive: true,
          version: '1.0.0'
        },
        url: `/api/styles/temp/${filename}`,
        filename: filename,
        message: 'Style processed successfully! Note: This is a temporary upload.',
        styleData: styleObject
      });
    }
    
    // Handle multipart form data
    if (contentType.includes('multipart/form-data')) {
      const boundary = contentType.split('boundary=')[1];
      if (!boundary) {
        throw new Error('No boundary found in multipart data');
      }

      // Parse multipart data
      const parts = data.toString('binary').split(`--${boundary}`);
      let styleContent = null;
      let fileName = 'style.json';
      
      for (const part of parts) {
        if (part.includes('Content-Disposition: form-data')) {
          // Check if this part contains a file
          if (part.includes('filename=')) {
            const filenameMatch = part.match(/filename="([^"]+)"/);
            if (filenameMatch) {
              fileName = filenameMatch[1];
            }
            
            // Extract content
            const contentStart = part.indexOf('\r\n\r\n') + 4;
            const contentEnd = part.lastIndexOf('\r\n');
            if (contentEnd > contentStart) {
              styleContent = part.substring(contentStart, contentEnd);
            }
          }
        }
      }

      if (!styleContent) {
        return res.status(400).json({
          success: false,
          error: 'No file content found in upload'
        });
      }

      // Parse the style JSON
      let styleObject;
      try {
        styleObject = JSON.parse(styleContent);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in uploaded file'
        });
      }

      // Basic validation
      if (!styleObject.version || !styleObject.sources || !styleObject.layers) {
        return res.status(400).json({
          success: false,
          error: 'Invalid style: missing required fields (version, sources, layers)'
        });
      }

      // Generate response
      const timestamp = Date.now();
      const processedFileName = fileName.replace('.json', '') + `-${timestamp}.json`;
      
      return res.status(200).json({
        success: true,
        config: {
          name: fileName.replace('.json', '') + `-${timestamp}`,
          label: styleObject.name || fileName.replace('.json', ''),
          type: 'vtc',
          style: `/api/styles/temp/${processedFileName}`,
          originalStyle: `/api/styles/temp/${processedFileName}`,
          country: 'Global',
          flag: '🌍',
          map_category: 'background',
          metadata: {
            uploadedAt: new Date().toISOString(),
            filename: processedFileName,
            styleData: styleObject // Include the actual style data
          },
          isActive: true,
          version: '1.0.0'
        },
        url: `/api/styles/temp/${processedFileName}`,
        filename: processedFileName,
        message: 'Style processed successfully! Note: This is a temporary upload.',
        styleData: styleObject
      });
    }

    // Unsupported content type
    return res.status(400).json({
      success: false,
      error: `Unsupported content type: ${contentType}. Use multipart/form-data or application/json.`
    });

  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process upload',
      details: error.message
    });
  }
};

// Disable body parsing to handle raw data
module.exports.config = {
  api: {
    bodyParser: false,
  },
};