-- Import WMTS and WMS maps into map_configs table
-- Run this in your Supabase SQL editor

-- BEV DKM GST (WMS)
INSERT INTO map_configs (name, label, type, style, country, flag, active, metadata)
VALUES (
  'BEV DKM GST',
  'BEV DKM GST',
  'wms',
  NULL,
  'Austria',
  '🇦🇹',
  true,
  jsonb_build_object(
    'url', 'https://data.bev.gv.at/geoserver/BEVdataKAT/wms',
    'layers', 'KAT_DKM_GST',
    'format', 'image/png',
    'transparent', true,
    'version', '1.3.0'
  )
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  metadata = EXCLUDED.metadata;

-- BEV Kataster (VTC)
INSERT INTO map_configs (name, label, type, style, country, flag, active, metadata)
VALUES (
  'Kataster BEV',
  'BEV Kataster',
  'vtc',
  '/styles/kataster-bev.json',
  'Austria',
  '🇦🇹',
  true,
  jsonb_build_object(
    'tileset', 'https://kataster.bev.gv.at/styles/kataster/tiles.json',
    'extra_sprite', 'https://kataster.bev.gv.at/styles/sprite',
    'selectLayer', 'Grundstücke - Flächen'
  )
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  style = EXCLUDED.style,
  metadata = EXCLUDED.metadata;

-- BEV Kataster 2 (VTC)
INSERT INTO map_configs (name, label, type, style, country, flag, active, metadata)
VALUES (
  'Kataster BEV2',
  'BEV Kataster 2',
  'vtc',
  '/styles/kataster-bev.json',
  'Austria',
  '🇦🇹',
  true,
  jsonb_build_object(
    'tileset', 'https://kataster.bev.gv.at/styles/kataster/tiles.json',
    'extra_sprite', 'https://kataster.bev.gv.at/styles/sprite',
    'selectLayer', 'Grundstücke - Flächen'
  )
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  style = EXCLUDED.style,
  metadata = EXCLUDED.metadata;

-- BEV Light (VTC)
INSERT INTO map_configs (name, label, type, style, country, flag, active)
VALUES (
  'BEVLight',
  'BEV Light',
  'vtc',
  '/styles/kataster-light.json',
  'Austria',
  '🇦🇹',
  true
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  style = EXCLUDED.style;

-- BEV DKM Punkte & Symbole (VTC overlay)
INSERT INTO map_configs (name, label, type, style, country, flag, active)
VALUES (
  'dkm_bev_symbole',
  'BEV DKM Punkte & Symbole',
  'vtc',
  '/styles/dkm_bev_symbole.json',
  'Austria',
  '🇦🇹',
  true
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  style = EXCLUDED.style,
  label = EXCLUDED.label;

-- TopPlusOpen (WMTS with direct tiles)
INSERT INTO map_configs (name, label, type, style, country, flag, active, metadata)
VALUES (
  'Germany TopPlusOpen',
  'TopPlusOpen (Germany)',
  'wmts',
  NULL,
  'Germany',
  '🇩🇪',
  true,
  jsonb_build_object(
    'tiles', ARRAY['https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web_scale/default/WEBMERCATOR/{z}/{y}/{x}.png'],
    'tileSize', 256,
    'minzoom', 0,
    'maxzoom', 18,
    'attribution', '© BKG (GeoBasis-DE)'
  )
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  metadata = EXCLUDED.metadata;

-- Alternative: Store tiles at top level for WMTS
INSERT INTO map_configs (name, label, type, tiles, tile_size, country, flag, active)
VALUES (
  'TopPlusOpen',
  'TopPlusOpen',
  'wmts',
  ARRAY['https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png'],
  256,
  'Germany',
  '🇩🇪',
  true
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  tiles = EXCLUDED.tiles,
  tile_size = EXCLUDED.tile_size;

-- NL Luchtfoto (WMTS)
INSERT INTO map_configs (name, label, type, tiles, tile_size, country, flag, active)
VALUES (
  'NL Luchtfoto',
  'NL Luchtfoto',
  'wmts',
  ARRAY['https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_ortho25/EPSG:3857/{z}/{x}/{y}.jpeg'],
  256,
  'Netherlands',
  '🇳🇱',
  true
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  tiles = EXCLUDED.tiles,
  tile_size = EXCLUDED.tile_size;

-- Belgium Ortho (WMTS)
INSERT INTO map_configs (name, label, type, tiles, tile_size, country, flag, active, metadata)
VALUES (
  'Belgium Ortho',
  'Belgium Ortho',
  'wmts',
  ARRAY['https://wmts.ngi.be/inspire/ortho/1.0.0/Ortho/GoogleMapsCompatible/{z}/{y}/{x}.jpeg'],
  256,
  'Belgium',
  '🇧🇪',
  true,
  jsonb_build_object(
    'attribution', '© NGI Belgium',
    'maxzoom', 18,
    'minzoom', 0
  )
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  tiles = EXCLUDED.tiles,
  tile_size = EXCLUDED.tile_size,
  metadata = EXCLUDED.metadata;

-- For WMS with direct URL storage
INSERT INTO map_configs (name, label, type, url, layers, country, flag, active, metadata)
VALUES (
  'BEV DKM GST WMS',
  'BEV DKM GST (WMS)',
  'wms',
  'https://data.bev.gv.at/geoserver/BEVdataKAT/wms',
  ARRAY['KAT_DKM_GST'],
  'Austria',
  '🇦🇹',
  true,
  jsonb_build_object(
    'format', 'image/png',
    'transparent', true,
    'version', '1.3.0'
  )
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  url = EXCLUDED.url,
  layers = EXCLUDED.layers,
  metadata = EXCLUDED.metadata;

-- Verify the imports
SELECT name, label, type, active, 
       CASE 
         WHEN tiles IS NOT NULL THEN 'Has tiles array'
         WHEN url IS NOT NULL THEN 'Has URL'
         WHEN style IS NOT NULL THEN 'Has style'
         WHEN metadata IS NOT NULL THEN 'Has metadata'
         ELSE 'No data'
       END as data_source
FROM map_configs 
WHERE name IN (
  'BEV DKM GST',
  'BEV DKM GST WMS',
  'Kataster BEV',
  'Kataster BEV2', 
  'BEVLight',
  'dkm_bev_symbole',
  'TopPlusOpen',
  'Germany TopPlusOpen',
  'NL Luchtfoto',
  'Belgium Ortho'
)
ORDER BY country, name;