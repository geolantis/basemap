/**
 * Vercel Edge Function for Auto-Saving Styles
 * 
 * This function can be called periodically to fetch the current
 * style from Maputnik and save it to the database.
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { mapId, styleUrl } = await request.json();

    if (!mapId || !styleUrl) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Fetch the current style from the public URL
    const styleResponse = await fetch(styleUrl);
    if (!styleResponse.ok) {
      throw new Error('Failed to fetch style');
    }

    const styleJson = await styleResponse.json();

    // Save to Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey) {
      const response = await fetch(`${supabaseUrl}/rest/v1/map_configs?id=eq.${mapId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          metadata: {
            styleJson: styleJson,
            lastAutoSave: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save to database');
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      timestamp: new Date().toISOString() 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Auto-save error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}