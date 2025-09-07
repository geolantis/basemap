// Temporary style storage (in-memory for demo)
// In production, this would use a database or cloud storage
const tempStyles = {};

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { filename } = req.query;

  if (req.method === 'POST') {
    // Store a style (called internally by upload)
    try {
      const body = JSON.parse(req.body);
      tempStyles[filename] = body;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid style data' });
    }
  }

  if (req.method === 'GET') {
    // Retrieve a style
    const style = tempStyles[filename];
    
    if (style) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(style);
    }
    
    // Return a placeholder style for testing
    return res.status(200).json({
      version: 8,
      name: filename?.replace('.json', '') || 'Temporary Style',
      sources: {
        "temp": {
          type: "vector",
          tiles: ["https://example.com/tiles/{z}/{x}/{y}.pbf"]
        }
      },
      layers: [
        {
          id: "background",
          type: "background",
          paint: {
            "background-color": "#f0f0f0"
          }
        }
      ],
      metadata: {
        note: "This is a temporary style. Upload persistence requires database integration."
      }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};