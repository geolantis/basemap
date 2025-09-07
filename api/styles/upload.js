const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

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

    for (let i = 0; i < styleObject.layers.length; i++) {
      const layer = styleObject.layers[i];
      if (!layer.id || !layer.type) {
        return { valid: false, error: `Layer ${i} missing required 'id' or 'type' property` };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Style validation error: ${error.message}` };
  }
}

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
    // Parse multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: function ({ mimetype }) {
        // Only accept JSON files or undefined mimetype (for some browsers)
        return !mimetype || mimetype === 'application/json' || mimetype === 'text/plain';
      }
    });

    const [fields, files] = await form.parse(req);
    
    // Get the uploaded file
    const uploadedFile = files.styleFile?.[0] || files.style?.[0] || files.file?.[0];
    
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a JSON file.'
      });
    }

    // Read and parse the file
    const fileContent = fs.readFileSync(uploadedFile.filepath, 'utf8');
    let styleObject;
    
    try {
      styleObject = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON file. Please ensure the file contains valid JSON.'
      });
    }

    // Validate the style
    const validation = validateMapboxStyle(styleObject);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: `Invalid Mapbox/MapLibre style: ${validation.error}`
      });
    }

    // Extract form fields
    const name = fields.name?.[0] || uploadedFile.originalFilename?.replace('.json', '') || 'custom-style';
    const label = fields.label?.[0] || name;
    const country = fields.country?.[0] || 'Global';
    const type = fields.type?.[0] || 'vtc';
    const mapCategory = fields.map_category?.[0] || 'background';
    const description = fields.description?.[0] || '';

    // Generate filename
    const timestamp = Date.now();
    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedName}-${timestamp}.json`;
    
    // Save to public/styles directory
    const stylesDir = path.join(process.cwd(), 'public', 'styles');
    
    // Ensure directory exists
    if (!fs.existsSync(stylesDir)) {
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

    // If Supabase is configured, save to database
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL,
          process.env.VITE_SUPABASE_ANON_KEY
        );

        const { data, error } = await supabase
          .from('map_configs')
          .insert({
            ...config,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
        } else if (data) {
          config.id = data.id;
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Continue without database save
      }
    }

    // Clean up temporary file
    try {
      fs.unlinkSync(uploadedFile.filepath);
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError);
    }

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
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

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

// Export config for Vercel
module.exports.config = {
  api: {
    bodyParser: false,
  },
};