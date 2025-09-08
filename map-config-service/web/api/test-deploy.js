export default function handler(req, res) {
  res.status(200).json({
    message: 'Deployment successful',
    timestamp: '2025-01-10 14:47:00',
    version: 'v3-with-fixes',
    fixes: [
      'Country code conversion (at -> Austria)',
      'Correct style path (/styles/ not /api/styles/temp/)',
      'Metadata size reduced',
      'File saved to public/styles'
    ]
  });
}