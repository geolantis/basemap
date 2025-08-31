import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const body = await req.json();
    const { query, maxResults = 20, mapTypes, regions } = body;

    // Get API key from environment
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY;
    
    if (!CLAUDE_API_KEY) {
      throw new Error('Claude API key not configured');
    }

    // Build the prompt
    const typeFilter = mapTypes?.length 
      ? `Focus on ${mapTypes.join(', ')} map types.`
      : 'Include all map types (VTC, WMTS, WMS).';
    
    const regionFilter = regions?.length
      ? `Focus on these regions: ${regions.join(', ')}.`
      : 'Search globally.';

    const prompt = `
You are a map service discovery expert. Search for public map tile services based on this query: "${query}"

${typeFilter}
${regionFilter}

Return a JSON response with discovered maps. For each map, include:
- name: Technical identifier
- label: Human-readable name
- type: "vtc", "wmts", or "wms"
- url: Base URL or tile URL pattern
- styleUrl: Style JSON URL for vector tiles (if applicable)
- country: Country or "Global"
- flag: Country flag emoji
- provider: Service provider name
- confidence: Discovery confidence (0-1)

Focus on:
1. Government open data portals
2. Public map services (no authentication required)
3. Free tier commercial services
4. Community projects

Return valid JSON only with structure:
{
  "maps": [...],
  "searchMetadata": {
    "query": "...",
    "timestamp": "ISO8601",
    "sources": [...],
    "totalFound": number
  }
}

Limit results to ${maxResults} most relevant maps.`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt,
        }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse Claude's response
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No valid JSON in Claude response');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    // Ensure required fields
    if (!result.maps) {
      result.maps = [];
    }
    
    if (!result.searchMetadata) {
      result.searchMetadata = {
        query,
        timestamp: new Date().toISOString(),
        sources: [],
        totalFound: result.maps.length,
      };
    }

    // Return the result
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Search failed',
        maps: [],
        searchMetadata: {
          query: '',
          timestamp: new Date().toISOString(),
          sources: [],
          totalFound: 0,
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}