import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wphrytrrikfkwehwahqc.supabase.co';
// Updated to use the current valid anon key
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHJ5dHJyaWtma3dlaHdhaHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTI5NzUsImV4cCI6MjA3MjEyODk3NX0.8E7_6gTc4guWSB2lI-hFQfGSEs6ziLmIT3P8xPbmz_k';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration for Vercel
export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll use formidable
  },
};

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
    'UK': '🇬🇧',
    'ca': '🇨🇦',
    'Canada': '🇨🇦',
    'au': '🇦🇺',
    'Australia': '🇦🇺',
    'nz': '🇳🇿',
    'New Zealand': '🇳🇿'
  };
  return flags[country] || '🌍';
}

export default async function handler(req, res) {
  console.log('=== UPLOAD HANDLER START ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  
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

    console.log('File found:', {
      originalFilename: uploadedFile.originalFilename,
      filepath: uploadedFile.filepath,
      mimetype: uploadedFile.mimetype,
      size: uploadedFile.size
    });

    // Read the file content
    const { readFileSync } = await import('fs');
    const fileContent = readFileSync(uploadedFile.filepath, 'utf8');
    console.log('File content length:', fileContent.length);
    
    // Parse JSON
    let styleObject;
    try {
      styleObject = JSON.parse(fileContent);
      console.log('JSON parsed successfully');
      console.log('Style name from JSON:', styleObject.name);
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

    // Extract form fields
    const name = fields.name?.[0] || styleObject.name || `custom-style-${Date.now()}`;
    const label = fields.label?.[0] || styleObject.name || 'Custom Style';
    const country = fields.country?.[0] || 'Global';
    const type = fields.type?.[0] || 'vtc';
    const mapCategory = fields.map_category?.[0] || 'background';
    const description = fields.description?.[0] || '';

    console.log('Form field values:', {
      name: name,
      label: label,
      country: country,
      type: type,
      mapCategory: mapCategory
    });

    const timestamp = Date.now();
    const filename = `${name.replace(/[^a-z0-9]/gi, '-')}-${timestamp}.json`;
    const styleUrl = `/api/styles/temp/${filename}`;

    // Prepare the configuration object - ensure unique name
    const uniqueName = `${name}-${timestamp}`;
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
        styleData: styleObject,
        map_category: mapCategory
      },
      is_active: true,
      version: 1,  // Use number, not string
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('=== ATTEMPTING DATABASE INSERT ===');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Insert data:', JSON.stringify(insertData, null, 2));

    // Save to Supabase map_configs table
    let saveSuccessful = false;
    let savedData = null;
    let dbError = null;
    
    try {
      const { data, error } = await supabase
        .from('map_configs')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        dbError = error;
        console.error('=== SUPABASE INSERT ERROR ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        // Return error response if database save fails
        return res.status(500).json({
          success: false,
          error: 'Database save failed',
          details: error.message,
          hint: error.hint,
          code: error.code
        });
      } else if (data) {
        console.log('=== DATABASE INSERT SUCCESSFUL ===');
        console.log('Saved record ID:', data.id);
        console.log('Saved record name:', data.name);
        savedData = data;
        saveSuccessful = true;
      }
    } catch (dbError) {
      console.error('=== DATABASE EXCEPTION ===');
      console.error('Exception:', dbError);
      console.error('Stack:', dbError.stack);
      
      return res.status(500).json({
        success: false,
        error: 'Database exception occurred',
        details: dbError.message
      });
    }

    // Clean up temporary file
    try {
      const { unlinkSync } = await import('fs');
      unlinkSync(uploadedFile.filepath);
      console.log('Temporary file cleaned up');
    } catch (cleanupError) {
      console.error('Failed to clean up temporary file:', cleanupError);
    }

    // Only return success if database save was successful
    if (saveSuccessful && savedData) {
      console.log('=== RETURNING SUCCESS RESPONSE ===');
      const responseData = {
        success: true,
        config: {
          ...insertData,
          id: savedData.id
        },
        url: styleUrl,
        filename: filename,
        message: 'Style uploaded and saved successfully!',
        styleData: styleObject,
        databaseSaved: true,
        recordId: savedData.id
      };
      console.log('Response data:', JSON.stringify(responseData, null, 2));
      return res.status(200).json(responseData);
    } else {
      // This shouldn't happen if we handle errors above, but just in case
      return res.status(500).json({
        success: false,
        error: 'Upload processed but database save status unknown',
        databaseSaved: false
      });
    }

  } catch (error) {
    console.error('=== HANDLER EXCEPTION ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Failed to process upload',
      details: error.message
    });
  }
}