# MapConfig Converter Service

A web service for converting ESRI ArcGIS vector tile styles to MapLibre GL compatible format, available at mapconfig.geolantis.com

## Features

- 🔄 **Automatic Path Conversion**: Converts relative paths to absolute URLs
- 🔤 **Font Mapping**: Maps ESRI fonts to web-compatible alternatives
- 🗺️ **Live Preview**: Interactive map preview with MapLibre GL JS
- 💾 **Export Ready**: Download converted styles for immediate use
- 🚀 **API Access**: RESTful API for programmatic conversion
- ⚡ **Caching**: Built-in caching for improved performance
- 🔒 **Security**: Rate limiting, CORS, and security headers

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

### Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. Access the service at http://localhost:3000

## Production Deployment

### Option 1: Node.js Direct

```bash
# Install dependencies
npm ci --only=production

# Set environment variables
export NODE_ENV=production
export PORT=3000

# Start the server
npm start
```

### Option 2: Docker with SSL

1. Obtain SSL certificates (e.g., using Let's Encrypt):
```bash
certbot certonly --standalone -d mapconfig.geolantis.com
```

2. Copy certificates to the ssl directory:
```bash
mkdir ssl
cp /etc/letsencrypt/live/mapconfig.geolantis.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/mapconfig.geolantis.com/privkey.pem ssl/
```

3. Deploy with Docker Compose:
```bash
docker-compose up -d
```

### Option 3: Cloud Deployment

#### Vercel
```bash
npm i -g vercel
vercel
```

#### Heroku
```bash
heroku create mapconfig-converter
git push heroku main
```

#### AWS EC2 / DigitalOcean
1. SSH into your server
2. Clone the repository
3. Follow Docker deployment steps above

## API Documentation

### Convert Style

**POST** `/api/convert`

Convert an ESRI style to MapLibre format.

```json
{
  "styleUrl": "https://example.com/style.json",
  "spriteUrl": "optional-custom-sprite-url",
  "glyphsUrl": "optional-custom-glyphs-url",
  "fontMapping": {
    "Public Sans Regular": ["Open Sans Regular"]
  },
  "useCache": true
}
```

Response:
```json
{
  "style": { /* MapLibre style object */ },
  "cached": false,
  "statistics": {
    "layerCount": 187,
    "sourceCount": 1,
    "layerTypes": {
      "line": 174,
      "symbol": 13
    }
  }
}
```

### Validate Style

**POST** `/api/validate`

Validate a MapLibre style for common issues.

```json
{
  "style": { /* MapLibre style object */ }
}
```

### Get Examples

**GET** `/api/examples`

Get predefined example styles.

### Health Check

**GET** `/api/health`

Check service health and statistics.

## Web Interface Usage

1. **Enter ESRI Style URL**: Paste the URL of your ESRI vector tile style (must end with `.json` or have `?f=pjson`)

2. **Optional Customization**:
   - Custom sprite URL (leave empty to auto-convert)
   - Custom glyphs URL (leave empty to auto-convert)
   - Font mapping JSON (map ESRI fonts to web fonts)

3. **Convert & Preview**: Click to convert and see the result on the map

4. **Download**: Save the converted style for use in your MapLibre applications

## Integration Example

```javascript
// Using the API
const response = await fetch('https://mapconfig.geolantis.com/api/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    styleUrl: 'your-esri-style-url'
  })
});

const { style } = await response.json();

// Use with MapLibre
const map = new maplibregl.Map({
  container: 'map',
  style: style,
  center: [151.2093, -33.8688],
  zoom: 10
});
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `ADMIN_SECRET`: Secret for admin operations

### Font Mapping

Default font mappings are configured in `server.js`. Custom mappings can be provided per request.

### Caching

In-memory caching with 1-hour TTL. For production, consider using Redis:

```javascript
// Add to server.js for Redis support
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
```

## Security Considerations

1. **Rate Limiting**: API endpoints are rate-limited to 100 requests per 15 minutes per IP
2. **CORS**: Configured for cross-origin requests
3. **Helmet**: Security headers enabled
4. **Input Validation**: All inputs are validated before processing
5. **SSL**: Use HTTPS in production (nginx configuration provided)

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the style server allows cross-origin requests
2. **Font Loading**: Some ESRI fonts may not have web equivalents
3. **Sprite Issues**: Verify sprite URLs are accessible
4. **Tile Loading**: Check if tile server requires authentication

### Debug Mode

Set `NODE_ENV=development` for detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

- Issues: https://github.com/geolantis/mapconfig-converter/issues
- Email: support@geolantis.com

## Credits

Built with:
- MapLibre GL JS
- Express.js
- Node.js
- Docker

---

Made with ❤️ by Geolantis