-- Seed data for map_configs table
-- This includes all maps from the original mapconfig.json

INSERT INTO map_configs (name, label, type, style, original_style, country, flag, layers, metadata) VALUES
-- Global Maps
('Global', 'Global', 'vtc', 'https://api.maptiler.com/maps/streets-v2/style.json', 'https://api.maptiler.com/maps/streets-v2/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Global', '🌐', NULL, NULL),
('Global2', 'Global 2', 'vtc', 'https://maps.clockworkmicro.com/streets/v1/style', 'https://maps.clockworkmicro.com/streets/v1/style?x-api-key=9G4F5b99xO28esL8tArIO2Bbp8sGhURW5qIieYTy', 'Global', '🌐', NULL, NULL),
('Landscape', 'Landscape', 'vtc', 'https://api.maptiler.com/maps/landscape/style.json', 'https://api.maptiler.com/maps/landscape/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Global', '🌐', NULL, NULL),
('Ocean', 'Ocean', 'vtc', 'https://api.maptiler.com/maps/ocean/style.json', 'https://api.maptiler.com/maps/ocean/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Global', '🌐', NULL, NULL),
('Outdoor', 'Outdoor', 'vtc', 'https://api.maptiler.com/maps/outdoor-v2/style.json', 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Global', '🌐', NULL, NULL),
('OSMLiberty', 'OSM Liberty', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/osmliberty.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/osmliberty.json', 'Global', '🌐', NULL, NULL),
('GlobalSat', 'Global Satellite', 'vtc', 'https://api.maptiler.com/maps/satellite/style.json', 'https://api.maptiler.com/maps/satellite/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Global', '🌐', NULL, NULL),

-- Austria
('Basemap Standard', 'Basemap Standard', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap-standard.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap-standard.json', 'Austria', '🇦🇹', NULL, NULL),
('Basemap Grau', 'Basemap Grau', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap-grau.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap-grau.json', 'Austria', '🇦🇹', NULL, NULL),
('BEVLight', 'BEV Light', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/bev-light.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/bev-light.json', 'Austria', '🇦🇹', NULL, NULL),
('AustriaKataster', 'Austria Kataster', 'wmts', NULL, NULL, 'Austria', '🇦🇹', NULL, '{"tiles": ["https://kataster.bev.gv.at/tiles/{z}/{x}/{y}.png"], "tileSize": 256, "attribution": "© BEV"}'),

-- Germany
('Basemap DE', 'Basemap DE', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap-de.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap-de.json', 'Germany', '🇩🇪', NULL, NULL),
('Brandenburg DE', 'Brandenburg DE', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/brandenburg-de.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/brandenburg-de.json', 'Germany', '🇩🇪', NULL, NULL),
('DE-Niedersachen-Classic', 'DE-Niedersachen-Classic', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/de-niedersachen-classic.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/de-niedersachen-classic.json', 'Germany', '🇩🇪', NULL, NULL),
('BasemapDEGlobal', 'basemap.de global', 'vtc', 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_gry.json', 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_gry.json', 'Germany', '🇩🇪', NULL, NULL),
('NiedersachsenDE', 'Niedersachsen (Lower Saxony)', 'wmts', NULL, NULL, 'Germany', '🇩🇪', NULL, '{"tiles": ["https://sgx.geodatenzentrum.de/wmts_ni_dop20/tile/1.0.0/ni_dop20/default/WEBMERCATOR/{z}/{y}/{x}.jpeg"], "tileSize": 256, "attribution": "© GeoBasis-DE / BKG"}'),

-- Netherlands
('NL Topo', 'NL Topo', 'vtc', 'https://api.maptiler.com/maps/nl-cartiqo-topo/style.json', 'https://api.maptiler.com/maps/nl-cartiqo-topo/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Netherlands', '🇳🇱', NULL, NULL),
('NL Cadastre Satellite', 'NL Cadastre + Satellite', 'vtc', 'https://api.maptiler.com/maps/cadastre-satellite/style.json', 'https://api.maptiler.com/maps/cadastre-satellite/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Netherlands', '🇳🇱', NULL, NULL),

-- Switzerland
('Switzerland', 'Switzerland', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/switzerland.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/switzerland.json', 'Switzerland', '🇨🇭', NULL, NULL),
('Swisstopo', 'Swisstopo', 'wmts', NULL, NULL, 'Switzerland', '🇨🇭', NULL, '{"tiles": ["https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg"], "tileSize": 256, "attribution": "© swisstopo"}'),

-- France
('France Aerial', 'France Aerial', 'wmts', NULL, NULL, 'France', '🇫🇷', ARRAY['ORTHOIMAGERY.ORTHOPHOTOS'], '{"url": "https://wxs.ign.fr/choisirgeoportail/geoportail/wmts", "tileSize": 256}'),
('France Vector', 'France Vector', 'wmts', NULL, NULL, 'France', '🇫🇷', ARRAY['GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2'], '{"url": "https://wxs.ign.fr/choisirgeoportail/geoportail/wmts", "tileSize": 256}'),

-- Other European Countries
('Luxembourg', 'Luxembourg', 'wmts', NULL, NULL, 'Luxembourg', '🇱🇺', NULL, '{"tiles": ["https://wmts1.geoportail.lu/opendata/wmts/ortho_2021/GLOBAL_WEBMERCATOR_4_V3/{z}/{x}/{y}.jpeg"], "tileSize": 256}'),
('OSGB', 'OSGB', 'wmts', NULL, NULL, 'United Kingdom', '🇬🇧', NULL, '{"tiles": ["https://api.os.uk/maps/raster/v1/zxy/Light_3857/{z}/{x}/{y}.png"], "tileSize": 256}'),
('Belgium Ortho', 'Belgium Ortho', 'wmts', NULL, NULL, 'Belgium', '🇧🇪', ARRAY['orthoPhoto'], '{"url": "https://geo.api.vlaanderen.be/GRB/wms", "tileSize": 256}'),
('Italy Ortofoto', 'Italy Ortofoto', 'wms', NULL, NULL, 'Italy', '🇮🇹', ARRAY['OI.ORTHOIMAGERY'], '{"url": "https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php", "tileSize": 256}'),
('Spain_BTN_Completa', 'Spain BTN Completa', 'wmts', NULL, NULL, 'Spain', '🇪🇸', NULL, '{"tiles": ["https://www.ign.es/wmts/mapa-raster?service=WMTS&request=GetTile&version=1.0.0&layer=MTN&style=default&tilematrixset=GoogleMapsCompatible&tilematrix={z}&tilerow={y}&tilecol={x}&format=image/jpeg"], "tileSize": 256, "attribution": "© IGN España"}'),
('ICGCStandard', 'ICGC Standard', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/icgc-standard.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/icgc-standard.json', 'Spain', '🇪🇸', NULL, NULL),
('NorwayTopo', 'Norway Topographic', 'wmts', NULL, NULL, 'Norway', '🇳🇴', NULL, '{"tiles": ["https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png"], "tileSize": 256, "attribution": "© Kartverket"}'),
('DenmarkTopo', 'Denmark Topographic', 'wmts', NULL, NULL, 'Denmark', '🇩🇰', NULL, '{"tiles": ["https://services.kortforsyningen.dk/topo_skaermkort/1.0.0/topo_skaermkort/default/webmercator/{z}/{y}/{x}.png"], "tileSize": 256, "attribution": "© Kortforsyningen"}'),
('PolandTopo', 'Poland Topographic', 'wmts', NULL, NULL, 'Poland', '🇵🇱', NULL, '{"tiles": ["https://mapy.geoportal.gov.pl/wss/service/WMTS/guest/wmts/TOPO/{z}/{y}/{x}"], "tileSize": 256, "attribution": "© Główny Urząd Geodezji i Kartografii"}'),
('NLSFinlandCadaster', 'NLS Finland Cadaster', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kiinteistojaotus-taustakartalla.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kiinteistojaotus-taustakartalla.json', 'Finland', '🇫🇮', NULL, NULL),

-- Rest of World
('NZ', 'NZ', 'wmts', NULL, NULL, 'New Zealand', '🇳🇿', NULL, '{"tiles": ["https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp"], "tileSize": 256}'),
('Victoria Imagery', 'Victoria Imagery', 'wmts', NULL, NULL, 'Australia', '🇦🇺', ARRAY['AERIAL_WM'], '{"url": "https://base.maps.vic.gov.au/wmts", "tileSize": 256}'),
('USGS Topo', 'USGS Topo', 'wmts', NULL, NULL, 'United States', '🇺🇸', NULL, '{"tiles": ["https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}"], "tileSize": 256, "attribution": "© USGS"}'),
('CanTopo', 'CanTopo', 'wmts', NULL, NULL, 'Canada', '🇨🇦', NULL, '{"tiles": ["https://maps.geogratis.gc.ca/wms/canvec_en?service=WMS&request=GetMap&version=1.1.1&layers=canvec&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png"], "tileSize": 256}')
ON CONFLICT (name) DO NOTHING;

-- Seed API keys (encrypted values would be added via Supabase Vault in production)
-- These are placeholder entries - actual keys should be encrypted
INSERT INTO api_keys (provider, key_name, encrypted_key) VALUES
('maptiler.com', 'MAPTILER_API_KEY', 'vault:v1:encrypted_key_placeholder'),
('clockworkmicro.com', 'CLOCKWORK_API_KEY', 'vault:v1:encrypted_key_placeholder'),
('bev.gv.at', 'BEV_API_KEY', 'vault:v1:encrypted_key_placeholder')
ON CONFLICT (provider, key_name) DO NOTHING;

-- Create default admin user (password should be changed after first login)
-- Note: This user needs to be created through Supabase Auth first
-- Then added to the users table with admin role