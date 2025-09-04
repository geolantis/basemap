import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for admin operations
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '2h'; // Admin tokens expire in 2 hours

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.ADMIN_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Check rate limiting (implement with Redis/Upstash in production)
    const rateLimitKey = `login_attempts:${email}`;
    // TODO: Implement proper rate limiting with Redis

    // Fetch admin user from database
    const { data: admin, error: fetchError } = await supabase
      .from('admins')
      .select('id, email, password_hash, role, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !admin) {
      // Don't reveal if user exists
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Check if account is active
    if (!admin.is_active) {
      return res.status(403).json({ 
        error: 'Account has been disabled' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      // Log failed attempt
      await supabase
        .from('auth_logs')
        .insert({
          user_id: admin.id,
          event_type: 'login_failed',
          ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
          user_agent: req.headers['user-agent'],
          created_at: new Date().toISOString()
        });

      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        type: 'admin'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        id: admin.id,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log successful login
    await supabase
      .from('auth_logs')
      .insert({
        user_id: admin.id,
        event_type: 'login_success',
        ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        user_agent: req.headers['user-agent'],
        created_at: new Date().toISOString()
      });

    // Update last login
    await supabase
      .from('admins')
      .update({ 
        last_login: new Date().toISOString() 
      })
      .eq('id', admin.id);

    return res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}