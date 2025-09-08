import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wphrytrrikfkwehwahqc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHJ5dHJyaWtma3dlaHdhaHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1MjcyMzQsImV4cCI6MjA1MTEwMzIzNH0.vLy34J5PQmK82UIMnAuYQN0_z-5V7agDe8gnPtTL-tA';
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
  console.log('Upload handler called with method:', req.method);
  
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
    
    console.log('Form parsed. Fields:', Object.keys(fields), 'Files:', Object.keys(files));
    
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

    // Read the file content
    const { readFileSync } = await import('fs');
    const fileContent = readFileSync(uploadedFile.filepath, 'utf8');
    
    // Parse JSON
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

    // Extract form fields
    const name = fields.name?.[0] || styleObject.name || `custom-style-${Date.now()}`;
    const label = fields.label?.[0] || styleObject.name || 'Custom Style';
    const country = fields.country?.[0] || 'Global';
    const type = fields.type?.[0] || 'vtc';
    const mapCategory = fields.map_category?.[0] || 'background';
    const description = fields.description?.[0] || '';

    const timestamp = Date.now();
    const filename = `${name.replace(/[^a-z0-9]/gi, '-')}-${timestamp}.json`;

    // Prepare the configuration object
    const config = {
      name: name,
      label: label,
      type: type,
      style: `/api/styles/temp/${filename}`,
      country: country,
      flag: getCountryFlag(country),
      metadata: {
        uploadedAt: new Date().toISOString(),
        filename: filename,
        description: description,
        styleData: styleObject,
        // Store map_category in metadata since the column might not exist
        map_category: mapCategory
      },
      is_active: true,
      version: '1.0.0'
    };

    console.log('Attempting to save to Supabase...');
    console.log('Config to save:', {
      name: config.name,
      label: config.label,
      type: config.type,
      country: config.country
    });

    // Try to save to Supabase - first try map_configs table
    let saveSuccessful = false;
    let savedData = null;
    
    try {
      console.log('Trying to save to map_configs table...');
      const { data, error } = await supabase
        .from('map_configs')
        .insert([{
          name: config.name,
          label: config.label,
          type: config.type,
          style: config.style,
          country: config.country,
          flag: config.flag,
          metadata: config.metadata,
          is_active: config.is_active,
          version: config.version,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('map_configs insert error:', error);
        
        // If map_configs fails, try maps table
        console.log('Trying maps table instead...');
        const mapsResult = await supabase
          .from('maps')
          .insert([{
            name: config.name,
            label: config.label,
            type: config.type,
            style: config.style,
            country: config.country,
            flag: config.flag,
            metadata: config.metadata,
            active: config.is_active,  // Note: using 'active' for maps table
            version: config.version,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
          
        if (mapsResult.error) {
          console.error('maps table insert error:', mapsResult.error);
        } else if (mapsResult.data) {
          console.log('Successfully saved to maps table with ID:', mapsResult.data.id);
          savedData = mapsResult.data;
          saveSuccessful = true;
        }
      } else if (data) {
        console.log('Successfully saved to map_configs table with ID:', data.id);
        savedData = data;
        saveSuccessful = true;
      }
    } catch (dbError) {
      console.error('Database save error:', dbError);
      console.error('Error stack:', dbError.stack);
    }

    if (saveSuccessful && savedData) {
      config.id = savedData.id;
    }

    // Clean up temporary file
    try {
      const { unlinkSync } = await import('fs');
      unlinkSync(uploadedFile.filepath);
      console.log('Temporary file cleaned up');
    } catch (cleanupError) {
      console.error('Failed to clean up temporary file:', cleanupError);
    }

    // Return success response (even if database save failed, the upload was processed)
    console.log('Returning response. Database save successful:', saveSuccessful);
    return res.status(200).json({
      success: true,
      config: config,
      url: `/api/styles/temp/${filename}`,
      filename: filename,
      message: saveSuccessful 
        ? 'Style uploaded and saved successfully!' 
        : 'Style uploaded successfully! (Note: Database save may have failed, check logs)',
      styleData: styleObject,
      databaseSaved: saveSuccessful
    });

  } catch (error) {
    console.error('Upload handler error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Failed to process upload',
      details: error.message
    });
  }
}