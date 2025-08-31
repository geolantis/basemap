import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { stripApiKeys, detectProvider } from '../../utils/apiKeyInjector';
import { verifyAdminToken, type AuthenticatedRequest } from '../middleware/auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Admin endpoint to clean API keys from database
 * This should be run once to remove any hardcoded keys
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Admin only endpoint
  res.setHeader('Access-Control-Allow-Origin', process.env.ADMIN_ORIGIN || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin authentication
  return new Promise((resolve) => {
    verifyAdminToken(req as AuthenticatedRequest, res, async () => {
      try {
        // Fetch all configurations
        const { data: configs, error: fetchError } = await supabase
          .from('map_configs')
          .select('id, name, style_url, requires_api_key');

        if (fetchError) {
          return resolve(res.status(500).json({ error: 'Failed to fetch configurations' }));
        }

        let updated = 0;
        let errors = 0;
        const results = [];

        // Process each configuration
        for (const config of configs || []) {
          const originalUrl = config.style_url;
          const cleanUrl = stripApiKeys(originalUrl);
          const provider = detectProvider(cleanUrl);

          // Only update if URL had keys or provider detection changed
          if (originalUrl !== cleanUrl || config.requires_api_key !== provider) {
            const { error: updateError } = await supabase
              .from('map_configs')
              .update({
                style_url: cleanUrl,
                requires_api_key: provider
              })
              .eq('id', config.id);

            if (updateError) {
              errors++;
              results.push({
                name: config.name,
                status: 'error',
                error: updateError.message
              });
            } else {
              updated++;
              results.push({
                name: config.name,
                status: 'cleaned',
                original: originalUrl,
                cleaned: cleanUrl,
                provider: provider
              });
            }
          }
        }

        return resolve(res.status(200).json({
          success: true,
          message: `Cleaned ${updated} configurations`,
          updated,
          errors,
          total: configs?.length || 0,
          results
        }));

      } catch (error) {
        console.error('Clean keys error:', error);
        return resolve(res.status(500).json({ 
          error: 'Internal server error' 
        }));
      }
    });
  });
}