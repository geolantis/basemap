import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    // Register with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          role: 'user'
        }
      }
    });

    if (authError) {
      console.error('Supabase registration error:', authError);
      
      // Handle specific Supabase errors
      if (authError.message.includes('already registered')) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: authError.message || 'Registration failed'
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed - no user data returned'
      });
    }

    // Create JWT token for our API
    const jwtSecret = process.env.VITE_JWT_SECRET || 'fallback-secret-key';
    const expiresIn = '24h';
    
    const tokenPayload = {
      userId: authData.user.id,
      email: authData.user.email,
      role: 'user',
      provider: 'supabase'
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn });
    
    // Create refresh token
    const refreshToken = jwt.sign(
      { userId: authData.user.id, type: 'refresh' }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );

    // Create user profile in our system (if needed)
    try {
      await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          name: name || authData.user.email?.split('@')[0],
          role: 'user',
          created_at: new Date().toISOString(),
          style_quota: parseInt(process.env.VITE_MAX_STYLES_PER_USER) || 50
        });
    } catch (profileError) {
      console.warn('Failed to create user profile:', profileError);
      // Don't fail registration if profile creation fails
    }

    const response = {
      success: true,
      token,
      refreshToken,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name || authData.user.email?.split('@')[0],
        role: 'user'
      }
    };

    return res.status(201).json(response);

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}