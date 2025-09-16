import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Authentication middleware
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization token provided');
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.VITE_JWT_SECRET || 'fallback-secret-key';

  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Check if user owns the layer group
async function checkLayerGroupOwnership(layerGroupId, userId) {
  const { data, error } = await supabase
    .from('layer_groups')
    .select('id, user_id, name')
    .eq('id', layerGroupId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { exists: false, owned: false, data: null };
  }

  return {
    exists: true,
    owned: data.user_id === userId,
    data: data
  };
}

// Validate image file
function validateImageFile(file) {
  const errors = [];

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('File size must be less than 5MB');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('Only JPEG, PNG, and WebP images are allowed');
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileExtension = path.extname(file.originalFilename || '').toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push('Invalid file extension. Use .jpg, .jpeg, .png, or .webp');
  }

  return { valid: errors.length === 0, errors };
}

// Generate unique filename
function generateFileName(originalName, layerGroupId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName || '').toLowerCase() || '.jpg';
  return `layer-group-${layerGroupId}-preview-${timestamp}-${random}${extension}`;
}

// Parse multipart form data
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxFields: 10,
      maxFieldsSize: 2 * 1024 * 1024, // 2MB
      allowEmptyFiles: false,
      minFileSize: 1024, // 1KB minimum
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}

// Upload file to Supabase Storage
async function uploadToSupabase(filePath, fileName, mimetype) {
  try {
    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('layer-group-previews')
      .upload(fileName, fileBuffer, {
        contentType: mimetype,
        cacheControl: '31536000', // 1 year
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('layer-group-previews')
      .getPublicUrl(fileName);

    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Upload to Supabase error:', error);
    throw error;
  }
}

// Main handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  let tempFilePath = null;

  try {
    // Extract layer group ID from URL
    const { id: layerGroupId } = req.query;

    if (!layerGroupId) {
      return res.status(400).json({
        success: false,
        message: 'Layer group ID is required',
        code: 'MISSING_ID'
      });
    }

    // Verify authentication
    const user = verifyToken(req);

    // Check ownership
    const ownership = await checkLayerGroupOwnership(layerGroupId, user.userId);

    if (!ownership.exists) {
      return res.status(404).json({
        success: false,
        message: 'Layer group not found',
        code: 'NOT_FOUND'
      });
    }

    if (!ownership.owned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own layer groups.',
        code: 'FORBIDDEN'
      });
    }

    // Parse multipart form data
    const { fields, files } = await parseForm(req);

    // Get the uploaded file
    const uploadedFile = files.preview || files.file || files.image;
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: 'No preview image file uploaded',
        code: 'NO_FILE'
      });
    }

    // Handle array of files (take first one)
    const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors: validation.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    tempFilePath = file.filepath;

    // Generate unique filename
    const fileName = generateFileName(file.originalFilename, layerGroupId);

    // Upload to Supabase Storage
    const uploadResult = await uploadToSupabase(tempFilePath, fileName, file.mimetype);

    // Update layer group with new preview URL
    const { data: updatedGroup, error: updateError } = await supabase
      .from('layer_groups')
      .update({
        preview_image_url: uploadResult.url,
        updated_at: new Date().toISOString()
      })
      .eq('id', layerGroupId)
      .eq('user_id', user.userId)
      .select('id, name, preview_image_url, updated_at')
      .single();

    if (updateError) {
      console.error('Update layer group error:', updateError);

      // Try to cleanup uploaded file
      try {
        await supabase.storage
          .from('layer-group-previews')
          .remove([fileName]);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }

      throw updateError;
    }

    return res.status(200).json({
      success: true,
      data: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        preview_image_url: updatedGroup.preview_image_url,
        updated_at: updatedGroup.updated_at
      },
      upload: {
        filename: fileName,
        originalName: file.originalFilename,
        size: file.size,
        mimetype: file.mimetype,
        url: uploadResult.url
      },
      message: 'Preview image uploaded successfully'
    });

  } catch (error) {
    console.error('Preview upload error:', error);

    if (error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: error.message,
        code: 'UNAUTHORIZED'
      });
    }

    if (error.message.includes('maxFileSize') || error.message.includes('File size')) {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size is 5MB',
        code: 'FILE_TOO_LARGE'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to upload preview image',
      code: 'UPLOAD_ERROR'
    });

  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary file:', cleanupError);
      }
    }
  }
}

// Disable body parsing for multipart uploads
export const config = {
  api: {
    bodyParser: false,
  },
};