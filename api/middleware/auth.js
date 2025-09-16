import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 * Verifies and decodes JWT tokens from Authorization header
 */
export function verifyToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No valid authorization token provided');
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.VITE_JWT_SECRET || process.env.JWT_SECRET || 'fallback-secret-key';

  try {
    const decoded = jwt.verify(token, jwtSecret);

    // Validate required fields
    if (!decoded.userId) {
      throw new AuthenticationError('Invalid token: missing userId');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid token');
    } else if (error instanceof AuthenticationError) {
      throw error;
    } else {
      throw new AuthenticationError('Token verification failed');
    }
  }
}

/**
 * Create authentication middleware that can be used with different error handling strategies
 */
export function createAuthMiddleware(options = {}) {
  const { optional = false } = options;

  return function authMiddleware(req) {
    try {
      return verifyToken(req);
    } catch (error) {
      if (optional) {
        return null; // Allow unauthenticated access
      }
      throw error;
    }
  };
}

/**
 * Custom authentication error class
 */
export class AuthenticationError extends Error {
  constructor(message, code = 'UNAUTHORIZED') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.statusCode = 401;
  }
}

/**
 * Custom authorization error class
 */
export class AuthorizationError extends Error {
  constructor(message, code = 'FORBIDDEN') {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
    this.statusCode = 403;
  }
}

/**
 * Check if user has permission to access resource
 */
export function checkResourceOwnership(resourceUserId, requestUserId, resourceType = 'resource') {
  if (!resourceUserId || !requestUserId) {
    throw new AuthorizationError(`Invalid ${resourceType} or user identifiers`);
  }

  if (resourceUserId !== requestUserId) {
    throw new AuthorizationError(`Access denied. You can only access your own ${resourceType}.`);
  }

  return true;
}

/**
 * Standardized CORS headers for API endpoints
 */
export function setCORSHeaders(res, options = {}) {
  const {
    origin = '*',
    methods = 'GET, POST, PUT, DELETE, OPTIONS',
    headers = 'Content-Type, Authorization',
    credentials = false
  } = options;

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
  res.setHeader('Content-Type', 'application/json');

  if (credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  return res;
}

/**
 * Handle OPTIONS preflight requests
 */
export function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res);
    return res.status(200).end();
  }
  return false;
}

/**
 * Standardized error response handler
 */
export function handleError(error, res) {
  console.error('API Error:', {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack
  });

  // Handle specific error types
  if (error instanceof AuthenticationError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof AuthorizationError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
    return res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors || [],
      code: 'VALIDATION_ERROR'
    });
  }

  // Handle database errors
  if (error.code && error.code.startsWith('PG')) {
    return res.status(500).json({
      success: false,
      message: 'Database error occurred',
      code: 'DATABASE_ERROR'
    });
  }

  // Generic error
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitStore = new Map();

export function checkRateLimit(identifier, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, []);
  }

  const requests = rateLimitStore.get(identifier);

  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);

  if (validRequests.length >= limit) {
    throw new Error('Rate limit exceeded');
  }

  // Add current request
  validRequests.push(now);
  rateLimitStore.set(identifier, validRequests);

  // Cleanup old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const validTimestamps = timestamps.filter(t => t > windowStart);
      if (validTimestamps.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, validTimestamps);
      }
    }
  }

  return true;
}