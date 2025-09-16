const { formidable } = require('formidable');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client - use hardcoded values as fallback
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wphrytrrikfkwehwahqc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHJ5dHJyaWtma3dlaHdhaHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTI5NzUsImV4cCI6MjA3MjEyODk3NX0.8E7_6gTc4guWSB2lI-hFQfGSEs6ziLmIT3P8xPbmz_k';

console.log('Initializing Supabase with URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

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

function getCountryFlag(country) {
  const flags = {
    'global': '🌍',
    'Global': '🌍',
    'at': '🇦🇹',
    'Austria': '🇦🇹',
    'ch': '🇨🇭',
    'Switzerland': '🇨🇭',
    'de': '🇩🇪',
    'Germany': '🇩🇪',
    'fr': '🇫🇷',
    'France': '🇫🇷',
    'it': '🇮🇹',
    'Italy': '🇮🇹',
    'us': '🇺🇸',
    'USA': '🇺🇸',
    'uk': '🇬🇧',
    'UK': '🇬🇧'
  };
  return flags[country] || '🌍';
}

module.exports = async function handler(req, res) {
  console.log('=== UPLOAD HANDLER START ===');
  console.log('Handler Version: v7-vercel-commonjs');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Environment variables present:', {
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY
  });

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Add GET method for version check
  if (req.method === 'GET') {
    return res.status(200).json({
      handler: 'upload.js',
      version: 'v7-vercel-commonjs',
      location: 'map-config-service/web/api/styles/upload.js',
      deployedAt: new Date().toISOString(),
      environment: 'vercel',
      features: {
        countryConversion: true,
        correctStylePath: true,
        reducedMetadata: true,
        databaseStorage: true
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST to upload a style.'
    });
  }

  try {
    console.log('Starting form parsing...');

    // Parse multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true
    });

    const [fields, files] = await form.parse(req);

    console.log('Form parsed successfully');
    console.log('Fields received:', Object.keys(fields));
    console.log('Files received:', Object.keys(files));

    // Get the uploaded file
    const uploadedFile = files.styleFile?.[0] || files.style?.[0] || files.file?.[0];

    if (!uploadedFile) {
      console.error('No file found in upload');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a JSON file.'
      });
    }

    console.log('File found:', uploadedFile.originalFilename);

    // Read and parse the file
    const fileContent = fs.readFileSync(uploadedFile.filepath, 'utf8');
    let styleObject;

    try {
      styleObject = JSON.parse(fileContent);
      console.log('JSON parsed successfully');
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON file. Please check the file format.'
      });
    }

    // Validate the style
    const validation = validateMapboxStyle(styleObject);
    if (!validation.valid) {
      console.error('Style validation failed:', validation.error);
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    console.log('Style validated successfully');

    // Extract form fields with defaults from style object
    const name = fields.name?.[0] || styleObject.name || `custom-style-${Date.now()}`;
    const label = fields.label?.[0] || styleObject.name || 'Custom Style';
    let country = fields.country?.[0] || 'Global';

    // Convert country codes to full names
    const countryMap = {
      'at': 'Austria',
      'de': 'Germany',
      'ch': 'Switzerland',
      'fr': 'France',
      'it': 'Italy',
      'us': 'USA',
      'uk': 'UK',
      'global': 'Global'
    };
    if (countryMap[country.toLowerCase()]) {
      country = countryMap[country.toLowerCase()];
    }

    const type = fields.type?.[0] || 'vtc';
    const mapCategory = fields.map_category?.[0] || 'background';
    const description = fields.description?.[0] || '';

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${name.replace(/[^a-z0-9]/gi, '-')}-${timestamp}.json`;
    const styleUrl = `/styles/${filename}`;

    // Ensure unique name for database
    const uniqueName = `${name}-${timestamp}`;

    // Ensure the style object has all required fields for MapLibre
    const finalStyleObject = {
      ...styleObject,
      name: styleObject.name || label,
      metadata: {
        ...(styleObject.metadata || {}),
        generated: new Date().toISOString(),
        source: 'upload'
      }
    };

    // Prepare data for database insert
    const insertData = {
      name: uniqueName,
      label: label,
      type: type,
      style: styleUrl,
      original_style: styleUrl,
      country: country,
      flag: getCountryFlag(country),
      metadata: {
        uploadedAt: new Date().toISOString(),
        filename: filename,
        description: description,
        map_category: mapCategory,
        // Store the actual style JSON for serving
        styleJson: finalStyleObject,
        style_name: styleObject.name || label,
        sources_count: Object.keys(styleObject.sources || {}).length,
        layers_count: (styleObject.layers || []).length
      },
      is_active: true,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('=== ATTEMPTING DATABASE INSERT ===');
    console.log('Data to insert:', {
      name: insertData.name,
      label: insertData.label,
      type: insertData.type,
      country: insertData.country
    });

    // Try to save to Supabase
    let saveSuccessful = false;
    let savedData = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('map_configs')
          .insert([insertData])
          .select()
          .single();

        if (error) {
          console.error('=== SUPABASE INSERT ERROR ===');
          console.error('Error:', error);
          console.error('Error message:', error.message);
          console.error('Error details:', error.details);
          console.error('Error hint:', error.hint);

          // Return error response
          return res.status(500).json({
            success: false,
            error: 'Database save failed',
            details: error.message,
            hint: error.hint
          });
        } else if (data) {
          console.log('=== DATABASE INSERT SUCCESSFUL ===');
          console.log('Saved with ID:', data.id);
          savedData = data;
          saveSuccessful = true;
        }
      } catch (dbError) {
        console.error('=== DATABASE EXCEPTION ===');
        console.error('Exception:', dbError);

        return res.status(500).json({
          success: false,
          error: 'Database exception occurred',
          details: dbError.message
        });
      }
    } else {
      console.warn('Supabase client not initialized - skipping database save');
    }

    // On Vercel, we primarily store in database, but also try to write to public directory if possible
    try {
      const path = require('path');
      const stylesDir = path.join(process.cwd(), 'public', 'styles');
      if (fs.existsSync(stylesDir)) {
        const stylePath = path.join(stylesDir, filename);
        fs.writeFileSync(stylePath, JSON.stringify(finalStyleObject, null, 2));
        console.log('Style file saved to:', stylePath);
      }
    } catch (fileError) {
      console.log('Could not write to public directory (expected on Vercel):', fileError.message);
    }

    // Clean up temporary file
    if (uploadedFile.filepath && fs.existsSync(uploadedFile.filepath)) {
      fs.unlinkSync(uploadedFile.filepath);
    }

    // Return response based on save status
    if (saveSuccessful && savedData) {
      return res.status(200).json({
        success: true,
        config: {
          ...insertData,
          id: savedData.id
        },
        url: styleUrl,
        filename: filename,
        message: 'Style uploaded and saved to database successfully!',
        databaseSaved: true,
        recordId: savedData.id
      });
    } else {
      // Still return success if file was prepared but database failed
      return res.status(200).json({
        success: true,
        config: insertData,
        url: styleUrl,
        filename: filename,
        message: 'Style uploaded successfully! (Database save may have failed)',
        databaseSaved: false
      });
    }

  } catch (error) {
    console.error('=== UPLOAD HANDLER ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      success: false,
      error: 'Internal server error during upload',
      details: error.message
    });
  }
};
