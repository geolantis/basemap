import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(401).json({
        success: false,
        message: authError.message || 'Invalid credentials'
      });
    }

    if (!authData.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }

    // Create JWT token for our API
    const jwtSecret = process.env.VITE_JWT_SECRET || 'fallback-secret-key';
    const expiresIn = '24h';
    
    const tokenPayload = {
      userId: authData.user.id,
      email: authData.user.email,
      role: authData.user.user_metadata?.role || 'user',
      provider: 'supabase'
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn });
    
    // Create refresh token
    const refreshToken = jwt.sign(
      { userId: authData.user.id, type: 'refresh' }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );

    const response = {
      success: true,
      token,
      refreshToken,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
        role: authData.user.user_metadata?.role || 'user',
        avatar: authData.user.user_metadata?.avatar_url
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}