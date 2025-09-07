const fs = require('fs');
const path = require('path');

// Helper to parse multipart form data manually
async function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    let data = Buffer.alloc(0);
    
    req.on('data', chunk => {
      data = Buffer.concat([data, chunk]);
    });
    
    req.on('end', () => {
      try {
        const boundary = req.headers['content-type'].split('boundary=')[1];
        if (!boundary) {
          throw new Error('No boundary found in multipart form');
        }
        
        const parts = data.toString('binary').split(`--${boundary}`);
        const result = { fields: {}, files: {} };
        
        for (const part of parts) {
          if (part.includes('Content-Disposition: form-data')) {
            const nameMatch = part.match(/name="([^"]+)"/);
            const filenameMatch = part.match(/filename="([^"]+)"/);
            
            if (nameMatch) {
              const fieldName = nameMatch[1];
              const contentStart = part.indexOf('\r\n\r\n') + 4;
              const contentEnd = part.lastIndexOf('\r\n');
              
              if (contentEnd > contentStart) {
                const content = part.substring(contentStart, contentEnd);
                
                if (filenameMatch) {
                  // It's a file
                  result.files[fieldName] = {
                    filename: filenameMatch[1],
                    content: content
                  };
                } else {
                  // It's a regular field
                  result.fields[fieldName] = content;
                }
              }
            }
          }
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    
    req.on('error', reject);
  });
}

// Validate Mapbox/MapLibre style
function validateMapboxStyle(styleObject) {
  try {
    const requiredFields = ['version', 'sources', 'layers'];
    const missingFields = requiredFields.filter(field => !(field in styleObject));
    
    if (missingFields.length > 0) {
      return { valid: false, error: `Missing required fields: ${missingFields.join(', ')}` };
    }

    if (typeof styleObject.version !== 'number' || styleObject.version < 8) {
      return { valid: false, error: 'Style version must be 8 or higher' };
    }

    if (typeof styleObject.sources !== 'object' || Array.isArray(styleObject.sources)) {
      return { valid: false, error: 'Sources must be an object' };
    }

    if (!Array.isArray(styleObject.layers)) {
      return { valid: false, error: 'Layers must be an array' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Style validation error: ${error.message}` };
  }
}

function getCountryFlag(country) {
  const flags = {
    'Global': '🌍',
    'Austria': '🇦🇹',
    'Switzerland': '🇨🇭',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Italy': '🇮🇹',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'New Zealand': '🇳🇿',
  };
  return flags[country] || '🌍';
}

module.exports = async function handler(req, res) {
  console.log('Upload endpoint called:', req.method);
  
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
    console.log('Parsing multipart form...');
    
    // Parse the multipart form data
    const formData = await parseMultipartForm(req);
    console.log('Form fields:', Object.keys(formData.fields));
    console.log('Files:', Object.keys(formData.files));
    
    // Find the uploaded file (try different field names)
    const fileData = formData.files.styleFile || 
                    formData.files.style || 
                    formData.files.file ||
                    Object.values(formData.files)[0]; // Get first file if field name is different
    
    if (!fileData) {
      console.log('No file found in upload');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a JSON file.'
      });
    }

    console.log('Processing file:', fileData.filename);
    
    // Parse the JSON content
    let styleObject;
    try {
      styleObject = JSON.parse(fileData.content);
    } catch (parseError) {
      console.log('JSON parse error:', parseError.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON file. Please ensure the file contains valid JSON.'
      });
    }

    // Validate the style
    const validation = validateMapboxStyle(styleObject);
    if (!validation.valid) {
      console.log('Style validation failed:', validation.error);
      return res.status(400).json({
        success: false,
        error: `Invalid Mapbox/MapLibre style: ${validation.error}`
      });
    }

    // Extract form fields with defaults
    const originalFilename = fileData.filename || 'style.json';
    const name = formData.fields.name || originalFilename.replace('.json', '') || 'custom-style';
    const label = formData.fields.label || name;
    const country = formData.fields.country || 'Global';
    const type = formData.fields.type || 'vtc';
    const mapCategory = formData.fields.map_category || 'background';
    const description = formData.fields.description || '';

    // Generate filename
    const timestamp = Date.now();
    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedName}-${timestamp}.json`;
    
    // Save to public/styles directory
    const stylesDir = path.join(process.cwd(), 'public', 'styles');
    
    // Ensure directory exists
    if (!fs.existsSync(stylesDir)) {
      console.log('Creating styles directory:', stylesDir);
      fs.mkdirSync(stylesDir, { recursive: true });
    }
    
    const filePath = path.join(stylesDir, filename);
    
    // Add metadata to style
    styleObject.metadata = {
      ...styleObject.metadata,
      uploadedAt: new Date().toISOString(),
      name: name,
      label: label,
      country: country
    };
    
    // Write the file
    console.log('Writing file to:', filePath);
    fs.writeFileSync(filePath, JSON.stringify(styleObject, null, 2));
    
    // Create map configuration object
    const config = {
      name: sanitizedName,
      label: label,
      type: type,
      style: `/styles/${filename}`,
      originalStyle: `/styles/${filename}`,
      country: country,
      flag: getCountryFlag(country),
      map_category: mapCategory,
      metadata: {
        description: description,
        uploadedAt: new Date().toISOString(),
        filename: filename
      },
      isActive: true,
      version: '1.0.0'
    };

    console.log('Upload successful:', filename);
    
    // Return success response
    return res.status(200).json({
      success: true,
      config: config,
      url: `/styles/${filename}`,
      filename: filename,
      message: 'Style uploaded successfully!'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during upload',
      details: error.message
    });
  }
};

// Export config for Vercel
module.exports.config = {
  api: {
    bodyParser: false,
  },
};