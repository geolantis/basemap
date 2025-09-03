-- Import WMTS and WMS maps into map_configs table
-- This version only uses basic columns that should exist

-- First, let's check what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'map_configs'
ORDER BY ordinal_position;

-- BEV DKM GST (WMS) - Store everything in metadata
INSERT INTO map_configs (name, label, type, country, flag, active, metadata)
VALUES (
  'BEV DKM GST',
  'BEV DKM GST',
  'wms',
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
  metadata = EXCLUDED.metadata,
  label = EXCLUDED.label;

-- TopPlusOpen (WMTS) - Store tiles in metadata
INSERT INTO map_configs (name, label, type, country, flag, active, metadata)
VALUES (
  'Germany TopPlusOpen',
  'TopPlusOpen (Germany)',
  'wmts',
  'Germany',
  '🇩🇪',
  true,
  jsonb_build_object(
    'tiles', ARRAY['https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png'],
    'tileSize', 256,
    'minzoom', 0,
    'maxzoom', 18,
    'attribution', '© BKG (GeoBasis-DE)'
  )
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  metadata = EXCLUDED.metadata,
  label = EXCLUDED.label;

-- NL Luchtfoto (WMTS) - Store tiles in metadata
INSERT INTO map_configs (name, label, type, country, flag, active, metadata)
VALUES (
  'NL Luchtfoto',
  'NL Luchtfoto',
  'wmts',
  'Netherlands',
  '🇳🇱',
  true,
  jsonb_build_object(
    'tiles', ARRAY['https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_ortho25/EPSG:3857/{z}/{x}/{y}.jpeg'],
    'tileSize', 256,
    'attribution', '© PDOK, Luchtfoto'
  )
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  metadata = EXCLUDED.metadata,
  label = EXCLUDED.label;

-- Belgium Ortho (WMTS) - Store tiles in metadata
INSERT INTO map_configs (name, label, type, country, flag, active, metadata)
VALUES (
  'Belgium Ortho',
  'Belgium Ortho',
  'wmts',
  'Belgium',
  '🇧🇪',
  true,
  jsonb_build_object(
    'tiles', ARRAY['https://wmts.ngi.be/inspire/ortho/1.0.0/Ortho/GoogleMapsCompatible/{z}/{y}/{x}.jpeg'],
    'tileSize', 256,
    'attribution', '© NGI Belgium',
    'maxzoom', 18,
    'minzoom', 0
  )
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  metadata = EXCLUDED.metadata,
  label = EXCLUDED.label;

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
  metadata = EXCLUDED.metadata,
  label = EXCLUDED.label;

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
  style = EXCLUDED.style,
  label = EXCLUDED.label;

-- Verify the imports
SELECT name, label, type, country, active,
       CASE 
         WHEN metadata->>'tiles' IS NOT NULL THEN 'Has tiles in metadata'
         WHEN metadata->>'url' IS NOT NULL THEN 'Has URL in metadata'
         WHEN style IS NOT NULL THEN 'Has style'
         ELSE 'Check data'
       END as data_location
FROM map_configs 
WHERE name IN (
  'BEV DKM GST',
  'Germany TopPlusOpen',
  'NL Luchtfoto',
  'Belgium Ortho',
  'Kataster BEV',
  'BEVLight'
)
ORDER BY country, name;