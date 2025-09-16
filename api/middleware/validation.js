/**
 * Validation Middleware and Utilities
 * Provides validation schemas and utilities for API endpoints
 */

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.errors = errors;
    this.statusCode = 400;
  }
}

/**
 * Base validator class
 */
class BaseValidator {
  constructor(schema) {
    this.schema = schema;
  }

  validate(data) {
    const errors = [];

    // Check required fields
    if (this.schema.required) {
      for (const field of this.schema.required) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          errors.push(`${field} is required`);
        }
      }
    }

    // Run custom validation function if provided
    if (this.schema.validate && typeof this.schema.validate === 'function') {
      const customValidation = this.schema.validate(data);
      if (!customValidation.valid && customValidation.errors) {
        errors.push(...customValidation.errors);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  validateAndThrow(data) {
    const validation = this.validate(data);
    if (!validation.valid) {
      throw new ValidationError('Validation failed', validation.errors);
    }
    return true;
  }
}

/**
 * Layer Group validation schema
 */
export const layerGroupValidator = new BaseValidator({
  required: ['name', 'description'],
  optional: ['tags', 'is_featured', 'preview_image_url', 'metadata'],
  validate: (data) => {
    const errors = [];

    // Name validation
    if (data.name !== undefined) {
      if (typeof data.name !== 'string') {
        errors.push('Name must be a string');
      } else {
        const trimmedName = data.name.trim();
        if (trimmedName.length < 1) {
          errors.push('Name cannot be empty');
        } else if (trimmedName.length > 100) {
          errors.push('Name must be 100 characters or less');
        }
        // Check for invalid characters
        if (!/^[a-zA-Z0-9\s\-_()]+$/.test(trimmedName)) {
          errors.push('Name contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, and parentheses are allowed');
        }
      }
    }

    // Description validation
    if (data.description !== undefined) {
      if (typeof data.description !== 'string') {
        errors.push('Description must be a string');
      } else if (data.description.length > 500) {
        errors.push('Description must be 500 characters or less');
      }
    }

    // Tags validation
    if (data.tags !== undefined) {
      if (!Array.isArray(data.tags)) {
        errors.push('Tags must be an array');
      } else {
        if (data.tags.length > 20) {
          errors.push('Maximum 20 tags allowed');
        }
        for (const [index, tag] of data.tags.entries()) {
          if (typeof tag !== 'string') {
            errors.push(`Tag at index ${index} must be a string`);
          } else if (tag.trim().length === 0) {
            errors.push(`Tag at index ${index} cannot be empty`);
          } else if (tag.length > 50) {
            errors.push(`Tag at index ${index} must be 50 characters or less`);
          }
        }
        // Check for duplicate tags
        const uniqueTags = [...new Set(data.tags)];
        if (uniqueTags.length !== data.tags.length) {
          errors.push('Duplicate tags are not allowed');
        }
      }
    }

    // Featured flag validation
    if (data.is_featured !== undefined && typeof data.is_featured !== 'boolean') {
      errors.push('is_featured must be a boolean');
    }

    // Preview image URL validation
    if (data.preview_image_url !== undefined) {
      if (data.preview_image_url !== null && typeof data.preview_image_url !== 'string') {
        errors.push('preview_image_url must be a string or null');
      } else if (data.preview_image_url && !isValidUrl(data.preview_image_url)) {
        errors.push('preview_image_url must be a valid URL');
      }
    }

    // Metadata validation
    if (data.metadata !== undefined) {
      if (typeof data.metadata !== 'object' || data.metadata === null || Array.isArray(data.metadata)) {
        errors.push('metadata must be an object');
      }
    }

    return { valid: errors.length === 0, errors };
  }
});

/**
 * Layer Group update validation schema (more lenient)
 */
export const layerGroupUpdateValidator = new BaseValidator({
  optional: ['name', 'description', 'tags', 'is_featured', 'preview_image_url', 'metadata'],
  validate: (data) => {
    // Reuse the main validation logic but make all fields optional
    return layerGroupValidator.schema.validate(data);
  }
});

/**
 * Overlay validation schema
 */
export const overlayValidator = new BaseValidator({
  required: ['overlay_id'],
  optional: ['position', 'opacity', 'is_visible'],
  validate: (data) => {
    const errors = [];

    // Overlay ID validation
    if (data.overlay_id !== undefined) {
      if (typeof data.overlay_id !== 'string') {
        errors.push('overlay_id must be a string');
      } else if (!isValidUUID(data.overlay_id)) {
        errors.push('overlay_id must be a valid UUID');
      }
    }

    // Position validation
    if (data.position !== undefined) {
      if (typeof data.position !== 'number' || !Number.isInteger(data.position) || data.position < 0) {
        errors.push('position must be a non-negative integer');
      } else if (data.position > 999) {
        errors.push('position must be less than 1000');
      }
    }

    // Opacity validation
    if (data.opacity !== undefined) {
      if (typeof data.opacity !== 'number' || data.opacity < 0 || data.opacity > 1) {
        errors.push('opacity must be a number between 0 and 1');
      }
    }

    // Visibility validation
    if (data.is_visible !== undefined && typeof data.is_visible !== 'boolean') {
      errors.push('is_visible must be a boolean');
    }

    return { valid: errors.length === 0, errors };
  }
});

/**
 * Overlay update validation schema
 */
export const overlayUpdateValidator = new BaseValidator({
  optional: ['position', 'opacity', 'is_visible'],
  validate: (data) => {
    // Reuse overlay validation but make overlay_id optional
    const overlayValidation = overlayValidator.schema.validate(data);
    return overlayValidation;
  }
});

/**
 * Query parameters validation
 */
export const queryParamsValidator = {
  layerGroups: (query) => {
    const errors = [];
    const sanitized = {};

    // Pagination
    if (query.limit) {
      const limit = parseInt(query.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        errors.push('limit must be a number between 1 and 100');
      } else {
        sanitized.limit = limit;
      }
    }

    if (query.offset) {
      const offset = parseInt(query.offset);
      if (isNaN(offset) || offset < 0) {
        errors.push('offset must be a non-negative number');
      } else {
        sanitized.offset = offset;
      }
    }

    // Boolean flags
    ['is_active', 'is_featured'].forEach(flag => {
      if (query[flag] !== undefined) {
        if (query[flag] !== 'true' && query[flag] !== 'false') {
          errors.push(`${flag} must be 'true' or 'false'`);
        } else {
          sanitized[flag] = query[flag];
        }
      }
    });

    // Sorting
    const validSortColumns = ['created_at', 'updated_at', 'name'];
    if (query.sort_by && !validSortColumns.includes(query.sort_by)) {
      errors.push(`sort_by must be one of: ${validSortColumns.join(', ')}`);
    } else if (query.sort_by) {
      sanitized.sort_by = query.sort_by;
    }

    if (query.sort_order && !['asc', 'desc'].includes(query.sort_order)) {
      errors.push('sort_order must be "asc" or "desc"');
    } else if (query.sort_order) {
      sanitized.sort_order = query.sort_order;
    }

    // Search
    if (query.search) {
      if (typeof query.search !== 'string') {
        errors.push('search must be a string');
      } else if (query.search.length > 100) {
        errors.push('search query must be 100 characters or less');
      } else {
        sanitized.search = query.search.trim();
      }
    }

    // Tags
    if (query.tags) {
      let tags;
      if (typeof query.tags === 'string') {
        tags = query.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(query.tags)) {
        tags = query.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
      } else {
        errors.push('tags must be a string or array');
      }

      if (tags && tags.length > 10) {
        errors.push('maximum 10 tags allowed in filter');
      } else if (tags) {
        sanitized.tags = tags;
      }
    }

    return { valid: errors.length === 0, errors, sanitized };
  }
};

/**
 * File upload validation
 */
export const fileValidator = {
  image: (file) => {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      errors.push('File size must be less than 5MB');
    }

    // Check minimum size (1KB)
    if (file.size < 1024) {
      errors.push('File size must be at least 1KB');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('Only JPEG, PNG, and WebP images are allowed');
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = getFileExtension(file.originalFilename || '');
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push('Invalid file extension. Use .jpg, .jpeg, .png, or .webp');
    }

    return { valid: errors.length === 0, errors };
  }
};

/**
 * Utility functions
 */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function isValidUUID(string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(string);
}

function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

/**
 * Sanitize data by removing undefined values and trimming strings
 */
export function sanitizeData(data) {
  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          sanitized[key] = trimmed;
        }
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize layer group data
 */
export function validateLayerGroupData(data, isUpdate = false) {
  const validator = isUpdate ? layerGroupUpdateValidator : layerGroupValidator;
  validator.validateAndThrow(data);
  return sanitizeData(data);
}

/**
 * Validate and sanitize overlay data
 */
export function validateOverlayData(data, isUpdate = false) {
  const validator = isUpdate ? overlayUpdateValidator : overlayValidator;
  validator.validateAndThrow(data);
  return sanitizeData(data);
}