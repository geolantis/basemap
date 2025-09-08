// Upload handler with Supabase integration
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wphrytrrikfkwehwahqc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHJ5dHJyaWtma3dlaHdhaHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1MjcyMzQsImV4cCI6MjA1MTEwMzIzNH0.vLy34J5PQmK82UIMnAuYQN0_z-5V7agDe8gnPtTL-tA';
const supabase = createClient(supabaseUrl, supabaseKey);

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
      
      // Prepare the configuration object
      const config = {
        name: `custom-style-${timestamp}`,
        label: styleObject.name || 'Custom Style',
        type: 'vtc',
        style: `/api/styles/temp/${filename}`,
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
      };

      // Try to save to Supabase
      try {
        console.log('Attempting to save to Supabase...');
        const { data, error } = await supabase
          .from('map_configs')
          .insert([{
            name: config.name,
            label: config.label,
            type: config.type,
            style: config.style,
            original_style: config.originalStyle,
            country: config.country,
            flag: config.flag,
            map_category: config.map_category,
            metadata: config.metadata,
            is_active: config.isActive,
            version: config.version,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('Supabase insert error:', error);
        } else if (data) {
          console.log('Successfully saved to Supabase with ID:', data.id);
          config.id = data.id;
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
      }
      
      // Return the style configuration
      return res.status(200).json({
        success: true,
        config: config,
        url: `/api/styles/temp/${filename}`,
        filename: filename,
        message: 'Style uploaded successfully!',
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
      
      // Prepare the configuration object
      const config = {
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
      };

      // Try to save to Supabase
      try {
        console.log('Attempting to save multipart upload to Supabase...');
        const { data, error } = await supabase
          .from('map_configs')
          .insert([{
            name: config.name,
            label: config.label,
            type: config.type,
            style: config.style,
            original_style: config.originalStyle,
            country: config.country,
            flag: config.flag,
            map_category: config.map_category,
            metadata: config.metadata,
            is_active: config.isActive,
            version: config.version,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('Supabase insert error:', error);
        } else if (data) {
          console.log('Successfully saved to Supabase with ID:', data.id);
          config.id = data.id;
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
      }
      
      return res.status(200).json({
        success: true,
        config: config,
        url: `/api/styles/temp/${processedFileName}`,
        filename: processedFileName,
        message: 'Style uploaded successfully!',
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