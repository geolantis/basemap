import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

// CORS headers for Maputnik integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeaders(corsHeaders).end();
  }

  const { filename } = req.query;
  
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename format' });
  }

  const filePath = path.join(process.cwd(), 'public', 'styles', filename);

  try {
    if (req.method === 'GET') {
      // Serve the style file
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Style file not found' });
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      return res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .setHeaders(corsHeaders)
        .send(content);
        
    } else if (req.method === 'PUT') {
      // Update the style file (from Maputnik)
      // Verify authorization
      const apiKey = req.headers.authorization?.replace('Bearer ', '');
      const validApiKeys = (process.env.API_KEYS || 'development-key').split(',');
      
      if (!validApiKeys.includes(apiKey || '')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const styleData = req.body;
      
      if (!styleData || typeof styleData !== 'object') {
        return res.status(400).json({ error: 'Invalid style data' });
      }

      // Backup existing file
      if (fs.existsSync(filePath)) {
        const backupPath = filePath.replace('.json', `.backup-${Date.now()}.json`);
        fs.copyFileSync(filePath, backupPath);
      }

      // Save the updated style
      fs.writeFileSync(filePath, JSON.stringify(styleData, null, 2));
      
      return res
        .status(200)
        .setHeaders(corsHeaders)
        .json({ 
          success: true, 
          message: 'Style updated successfully',
          filename: filename
        });
        
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Style file error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}