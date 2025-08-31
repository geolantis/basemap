# Public Map Tile Services Research & Patterns

## Research Summary

Comprehensive research on public map tile services, URL patterns, and API endpoints for automated discovery. Focus on European government services, open data initiatives, and free-tier commercial providers.

## European Government Services

### Austria - basemap.at
- **Authority**: basemap.at (cooperation of 9 Austrian provinces + BEV)
- **License**: Open Government Data Austria (CC-BY 4.0)
- **Service Availability**: 99.985%
- **Update Frequency**: Bimonthly

**URL Patterns:**
```
# WMTS Service
https://basemap.at/wmts

# GetCapabilities
https://basemap.at/wmts?service=WMTS&request=GetCapabilities&version=1.0.0

# Vector Tiles (JSON Interface)
https://basemap.at/vector/{style}/{z}/{x}/{y}.pbf

# Coordinate Systems
EPSG:3857 (Web Mercator)
EPSG:31256 (Austrian MGI / Austria Lambert)
```

**Authentication**: None required (public access)
**Formats**: PBF (vector tiles), PNG/JPEG (raster)

### Germany - BKG basemap.de
- **Authority**: BKG (Bundesamt für Kartographie und Geodäsie)
- **License**: Free for private use, paid for commercial

**URL Patterns:**
```
# WMS Service
https://gdz.bkg.bund.de/index.php/default/wmts-basemapde-webraster

# Vector Tiles Service
https://gdz.bkg.bund.de/index.php/default/gdz-basemapde-vektor

# WMTS Template
https://sgx.geodatenzentrum.de/wmts_basemapde_web_raster/tile/1.0.0/{layer}/{style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png
```

**Authentication**: May require registration for some services
**Formats**: PNG (raster), PBF (vector tiles)

### Switzerland - swisstopo
- **Authority**: Swiss Federal Office of Topography
- **Platform**: geo.admin.ch
- **License**: Generally open, attribution required

**URL Patterns:**
```
# Vector Tiles Service
https://vectortiles.geo.admin.ch/tiles/{layer}/{z}/{x}/{y}.pbf

# WMTS Service
https://wmts.geo.admin.ch/1.0.0/{layer}/default/current/{TileMatrixSet}/{z}/{y}/{x}.{format}

# REST Template
https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/21781/{z}/{y}/{x}.jpeg

# GetCapabilities
https://wmts.geo.admin.ch/EPSG/{EPSG_CODE}/1.0.0/WMTSCapabilities.xml
```

**Authentication**: None for most services
**Coordinate Systems**: EPSG:2056, EPSG:21781, EPSG:3857, EPSG:4326
**Formats**: JPEG, PNG (raster), PBF (vector)

### Netherlands - PDOK
- **Authority**: Kadaster
- **Platform**: PDOK (Publieke Dienstverlening Op de Kaart)
- **License**: Open Government Data

**URL Patterns:**
```
# Modern OGC API - Tiles
https://api.pdok.nl/bzk/brt/ogc/v1_0/tiles/{TileMatrixSet}/{z}/{x}/{y}

# Traditional WMTS (being phased out)
https://geodata.nationaalgeoregister.nl/tiles/service/wmts

# Vector Tiles (BGT/BRT)
https://api.pdok.nl/lv/bgt/ogc/v1_0/tiles/NetherlandsRDNewQuad/{z}/{x}/{y}
```

**Authentication**: None required for most public datasets
**Coordinate Systems**: EPSG:28992 (RD New), EPSG:3857, EPSG:25831
**Update Frequency**: 5 times per year (BRT)

### France - IGN Géoportail (Géoplateforme)
- **Authority**: Institut national de l'information géographique et forestière
- **Platform**: Géoplateforme (since March 2024)
- **License**: Various, generally open with attribution

**URL Patterns:**
```
# Géoplateforme WMTS (current)
https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER={Layer}&STYLE={Style}&FORMAT={format}&TILEMATRIXSET={TileMatrixSet}&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}

# Vector Tiles TMS (recommended)
https://data.geopf.fr/tms/1.0.0/{layer}/{z}/{x}/{y}.pbf

# Legacy Géoportail (redirected until Sept 2024)
https://wxs.ign.fr/{key}/geoportail/wmts
```

**Authentication**: API key required (CLEF parameter)
**Rate Limits**: WMS: 40 req/s, WFS: 30 req/s
**Formats**: PBF (vector), PNG/JPEG (raster)

### Spain - CNIG/IGN
- **Authority**: Centro Nacional de Información Geográfica
- **Platform**: IDEE (Infraestructura de Datos Espaciales de España)

**URL Patterns:**
```
# WMTS Service
https://www.ign.es/wmts/ign-base?service=WMTS&request=GetTile&version=1.0.0&format=image/png&layer=IGNBaseTodo&style=default&tilematrixset=GoogleMapsCompatible&TileMatrix={z}&TileCol={x}&TileRow={y}

# API CNIG Integration
https://componentes.cnig.es/api-core/

# WMS Services
https://www.ign.es/wms-inspire/ign-base
```

**Authentication**: Generally none required for public services
**Providers Database**: 102 public WMS/WMTS providers catalogued

### Italy - Geoportale Nazionale
- **Authority**: Ministry of Environment and Energy Security
- **Platform**: Geoportale Nazionale

**URL Patterns:**
```
# WMS Services
https://wms.pcn.minambiente.it/ogc?map=/ms_ogc/WMS_v1.3/Vettoriali/Confini_Amministrativi.map

# IGM WMTS (Military Geographic Institute)
https://www.igmi.org/wmts/

# OGC Standard Services
WMS, WFS, WCS endpoints via federated network
```

**Authentication**: None for most public datasets
**Standards**: Full OGC compliance (WMS, WFS, WCS)

## Open Source & Community Providers

### OpenStreetMap Ecosystem

#### OpenFreeMap
- **License**: Open source, no registration required
- **Limits**: Unlimited, no API keys needed

**URL Patterns:**
```
# Vector Tiles
https://tiles.openfreemap.org/osm/{z}/{x}/{y}.pbf

# Style JSON
https://tiles.openfreemap.org/styles/liberty
https://tiles.openfreemap.org/styles/bright
https://tiles.openfreemap.org/styles/positron

# Attribution**: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap"
```

#### OpenMapTiles Community Server
- **License**: Non-commercial use
- **Schema**: OpenMapTiles compatible

**URL Patterns:**
```
# Vector Tiles
https://vectortiles.openhistoricalmap.org/{z}/{x}/{y}.pbf

# Community endpoints
https://openmaptiles.org/downloads/
```

#### OSMF Official Vector Tiles (2025)
- **Authority**: OpenStreetMap Foundation
- **Status**: Available since July 2025, usage policy finalizing

**URL Patterns:**
```
# Vector Tiles
https://tile.openstreetmap.org/vector/{z}/{x}/{y}.mvt
# Note: Exact URL may vary, check official OSMF announcements
```

### Versatiles.org
- **License**: Open source community project

**URL Patterns:**
```
# Vector Tiles
https://tiles.versatiles.org/{style}/{z}/{x}/{y}.pbf

# Documentation on GitHub
https://github.com/versatiles-org/versatiles
```

## Commercial Free Tier Services

### MapTiler
- **Free Tier**: Available with API key
- **Usage**: Request-based pricing (4 requests per vector tile view)

**URL Patterns:**
```
# Vector Tiles API
https://api.maptiler.com/tiles/{tileset_id}/{z}/{x}/{y}.pbf?key={API_KEY}

# Maps API (with styles)
https://api.maptiler.com/maps/{map_id}/style.json?key={API_KEY}

# OpenStreetMap Tiles
https://api.maptiler.com/tiles/osm/{z}/{x}/{y}.pbf?key={API_KEY}

# Satellite/Hybrid
https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key={API_KEY}
```

**Authentication**: API Key required (free tier available)
**Style Support**: Standard Mapbox GL style specification
**Attribution**: Required for free tier

### Mapbox
- **Free Tier**: Available with usage limits
- **Pricing**: Tile request based

**URL Patterns:**
```
# Vector Tiles API
https://api.mapbox.com/v4/{tileset_id}/{z}/{x}/{y}.mvt?access_token={ACCESS_TOKEN}

# Style-Optimized Tiles
https://api.mapbox.com/v4/{tileset_id}/{z}/{x}/{y}.mvt?style=mapbox://styles/{username}/{style_id}&access_token={ACCESS_TOKEN}

# Style JSON
https://api.mapbox.com/styles/v1/{username}/{style_id}?access_token={ACCESS_TOKEN}

# Popular Tilesets
mapbox.mapbox-streets-v8
mapbox.satellite-v9
mapbox.terrain-v2
```

**Authentication**: Access Token required
**Optimization**: ?optimize=true parameter available
**Format**: .mvt or .pbf extension

### HERE Maps
- **Free Tier**: 30,000 transactions/month
- **Pricing**: $0.075 per 1000 transactions after free tier

**URL Patterns:**
```
# Vector Tiles API
https://vector.hereapi.com/v2/vectortiles/{layer}/tile/{z}/{x}/{y}?apikey={API_KEY}

# Style Endpoints
https://assets.vector.hereapi.com/styles/berlin/base/mapbox/tilezen?apikey={API_KEY}

# Core Layers
base, buildings, landuse, places, roads, transit, water
```

**Authentication**: API Key required
**Format**: Protocol Buffer (Tilezen schema)
**Integration**: Compatible with Mapbox GL JS / MapLibre GL JS

### ESRI ArcGIS Online
- **Free Tier**: Available with ArcGIS Developer account
- **Licensing**: Varies by service

**URL Patterns:**
```
# Vector Tile Service
https://services.arcgisonline.com/arcgis/rest/services/{service_name}/VectorTileServer

# Individual Tiles
https://services.arcgisonline.com/arcgis/rest/services/{service_name}/VectorTileServer/tile/{z}/{y}/{x}.pbf

# Style Resources
https://services.arcgisonline.com/arcgis/rest/services/{service_name}/VectorTileServer/resources/styles/root.json

# Popular Services
World_Basemap_v2, World_Transportation, World_Boundaries
```

**Authentication**: Token or API key required
**Format**: PBF format
**Standards**: ESRI REST API specification

## Common URL Pattern Templates

### Vector Tiles (XYZ)
```
# Standard Template
{base_url}/{z}/{x}/{y}.{ext}

# With API Key
{base_url}/{z}/{x}/{y}.{ext}?key={api_key}

# With Style Parameter  
{base_url}/{style}/{z}/{x}/{y}.{ext}

# TileJSON
{base_url}/tiles.json
```

### WMTS Templates
```
# RESTful
{base_url}/{version}/{layer}/{style}/{time}/{tilematrixset}/{tilematrix}/{tilerow}/{tilecol}.{format}

# KVP (Key-Value Pairs)
{base_url}?SERVICE=WMTS&REQUEST=GetTile&VERSION={version}&LAYER={layer}&STYLE={style}&TILEMATRIXSET={tilematrixset}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT={format}
```

### WMS Templates
```
# GetMap Request
{base_url}?SERVICE=WMS&REQUEST=GetMap&VERSION={version}&LAYERS={layers}&STYLES={styles}&CRS={crs}&BBOX={bbox}&WIDTH={width}&HEIGHT={height}&FORMAT={format}

# GetCapabilities
{base_url}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION={version}
```

### Style JSON Discovery
```
# Direct Style URL
{base_url}/styles/{style_id}/style.json

# With API Key
{base_url}/styles/{style_id}/style.json?key={api_key}

# TileJSON + Style
{base_url}/styles/{style_id}.json
```

## Authentication Patterns

### No Authentication Required
- Austria basemap.at
- Switzerland swisstopo (most services)
- Netherlands PDOK (public datasets)
- OpenFreeMap
- OSMF Vector Tiles
- Most Italian Geoportale services

### API Key Required (Free Tier Available)
- MapTiler
- Mapbox
- HERE Maps
- ESRI ArcGIS Online

### Registration/Account Required
- Germany BKG (some services)
- France IGN Géoplateforme (API keys)
- Commercial providers (free tiers)

## Automated Discovery Strategies

### Capabilities Documents
1. **WMTS GetCapabilities**: `?SERVICE=WMTS&REQUEST=GetCapabilities`
2. **WMS GetCapabilities**: `?SERVICE=WMS&REQUEST=GetCapabilities`
3. **TileJSON**: `{base_url}/tiles.json` or `{base_url}.json`

### Common Discovery Endpoints
```
# Health/Status Checks
{base_url}/health
{base_url}/status
{base_url}/ping

# Metadata
{base_url}/metadata.json
{base_url}/tilejson
{base_url}/capabilities

# Style Discovery
{base_url}/styles/
{base_url}/styles.json
```

### URL Pattern Testing
1. Try standard XYZ pattern: `/{z}/{x}/{y}`
2. Test common extensions: `.pbf`, `.mvt`, `.png`, `.jpg`
3. Check for API key requirements
4. Verify CORS headers for web usage
5. Test rate limiting and usage policies

## File Extensions & MIME Types

### Vector Tiles
- **Extensions**: `.pbf`, `.mvt`
- **MIME Types**: 
  - `application/vnd.mapbox-vector-tile`
  - `application/x-protobuf`

### Raster Tiles
- **Extensions**: `.png`, `.jpg`, `.jpeg`, `.webp`
- **MIME Types**: `image/png`, `image/jpeg`, `image/webp`

### Metadata
- **Extensions**: `.json`
- **MIME Types**: `application/json`

## Coordinate Reference Systems (CRS)

### Most Common
- **EPSG:3857** - Web Mercator (Google/OSM standard)
- **EPSG:4326** - WGS84 Geographic
- **EPSG:25832** - ETRS89 UTM Zone 32N (Central Europe)

### National Systems
- **EPSG:31256** - Austria MGI / Austria Lambert
- **EPSG:28992** - Netherlands RD New
- **EPSG:2056** - Switzerland CH1903+ / LV95
- **EPSG:2154** - France Lambert 93
- **EPSG:25830** - Spain ETRS89 UTM Zone 30N

## Rate Limiting Patterns

### Common Limits
- **France IGN**: 40 req/s (WMS), 30 req/s (WFS)
- **HERE Maps**: No specific limit mentioned for free tier
- **MapTiler**: Request-based pricing, no hard limits
- **Austria basemap.at**: Shared infrastructure, 99.985% availability SLA

### Best Practices
1. Implement client-side caching
2. Respect server response headers
3. Use appropriate tile size (256px vs 512px)
4. Monitor usage against free tier limits
5. Implement exponential backoff for errors

## Quality Indicators

### High Quality Services
- Official government providers with SLA guarantees
- Services with documented APIs and capabilities
- Providers with regular update schedules
- Services supporting multiple coordinate systems

### Reliability Indicators
- Available GetCapabilities endpoints
- Documented API versions and changelog
- Clear licensing and attribution requirements
- Support for standard OGC protocols

This research provides comprehensive patterns for automated discovery and integration of public map tile services across Europe and major commercial providers, with focus on vector tiles, WMTS, and WMS services suitable for the map configuration service architecture.