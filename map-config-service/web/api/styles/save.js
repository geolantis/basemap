import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
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
      message: 'Method not allowed'
    });
  }

  try {
    const { filename, content, metadata } = req.body;

    if (!filename || !content) {
      return res.status(400).json({
        success: false,
        message: 'Filename and content are required'
      });
    }

    // Sanitize filename - remove any path traversal attempts
    const sanitizedFilename = path.basename(filename).replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFilename = sanitizedFilename.endsWith('.json') 
      ? sanitizedFilename 
      : `${sanitizedFilename}.json`;

    // Parse and validate the style JSON
    let styleObject;
    try {
      styleObject = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Basic validation
      if (!styleObject.version || !styleObject.sources || !styleObject.layers) {
        return res.status(400).json({
          success: false,
          message: 'Invalid style format - missing required fields (version, sources, layers)'
        });
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON content'
      });
    }

    // Add metadata if provided
    if (metadata) {
      styleObject.metadata = {
        ...styleObject.metadata,
        ...metadata,
        savedAt: new Date().toISOString()
      };
    }

    // Determine the styles directory path
    // In production (Vercel), we need to write to a persistent location
    // For local development, write to public/styles
    const stylesDir = path.join(process.cwd(), 'public', 'styles');
    
    // Ensure directory exists
    if (!fs.existsSync(stylesDir)) {
      fs.mkdirSync(stylesDir, { recursive: true });
    }

    // Full path for the style file
    const filePath = path.join(stylesDir, finalFilename);

    // Write the file
    fs.writeFileSync(filePath, JSON.stringify(styleObject, null, 2));

    // Return success with the URL
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3000}`;
    
    const styleUrl = `${baseUrl}/styles/${finalFilename}`;

    return res.status(200).json({
      success: true,
      filename: finalFilename,
      url: styleUrl,
      message: 'Style file saved successfully',
      path: `/styles/${finalFilename}`
    });

  } catch (error) {
    console.error('Error saving style file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save style file',
      error: error.message
    });
  }
}