-- Import WMTS and WMS maps into map_configs table
-- Run this in your Supabase SQL editor

-- BEV DKM GST (WMS)
INSERT INTO map_configs (name, label, type, style, country, flag, map_category, active, metadata)
VALUES (
  'BEV DKM GST',
  'BEV DKM GST',
  'wms',
  NULL,
  'Austria',
  '🇦🇹',
  'overlay',
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
  map_category = EXCLUDED.map_category;

-- BEV Kataster (VTC - but marked as overlay)
INSERT INTO map_configs (name, label, type, style, country, flag, map_category, active, metadata)
VALUES (
  'BEV Kataster',
  'BEV Kataster',
  'vtc',
  '/styles/kataster-bev.json',
  'Austria',
  '🇦🇹',
  'overlay',
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
  map_category = EXCLUDED.map_category;

-- BEV Kataster 2 (VTC)
INSERT INTO map_configs (name, label, type, style, country, flag, map_category, active, metadata)
VALUES (
  'BEV Kataster 2',
  'BEV Kataster 2',
  'vtc',
  '/styles/kataster-bev.json',
  'Austria',
  '🇦🇹',
  'overlay',
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
  map_category = EXCLUDED.map_category;

-- BEV Light (VTC)
INSERT INTO map_configs (name, label, type, style, country, flag, map_category, active)
VALUES (
  'BEV Light',
  'BEV Light',
  'vtc',
  '/styles/kataster-light.json',
  'Austria',
  '🇦🇹',
  'background',
  true
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  style = EXCLUDED.style,
  map_category = EXCLUDED.map_category;

-- BEV DKM Punkte & Symbole (VTC overlay)
INSERT INTO map_configs (name, label, type, style, country, flag, map_category, active)
VALUES (
  'dkm_bev_symbole',
  'BEV DKM Punkte & Symbole',
  'vtc',
  '/styles/dkm_bev_symbole.json',
  'Austria',
  '🇦🇹',
  'overlay',
  true
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  style = EXCLUDED.style,
  label = EXCLUDED.label,
  map_category = EXCLUDED.map_category;

-- TopPlusOpen (WMTS)
INSERT INTO map_configs (name, label, type, style, country, flag, map_category, active, metadata)
VALUES (
  'TopPlusOpen',
  'TopPlusOpen (Germany)',
  'wmts',
  NULL,
  'Germany',
  '🇩🇪',
  'background',
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
  metadata = EXCLUDED.metadata,
  map_category = EXCLUDED.map_category;

-- NL Luchtfoto (WMTS)
INSERT INTO map_configs (name, label, type, style, country, flag, map_category, active, metadata)
VALUES (
  'NL Luchtfoto',
  'NL Luchtfoto',
  'wmts',
  NULL,
  'Netherlands',
  '🇳🇱',
  'background',
  true,
  jsonb_build_object(
    'tiles', ARRAY['https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_ortho25/EPSG:3857/{z}/{x}/{y}.jpeg'],
    'tileSize', 256,
    'attribution', '© PDOK, Luchtfoto'
  )
) ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  metadata = EXCLUDED.metadata,
  map_category = EXCLUDED.map_category;

-- Belgium Ortho (WMTS)
INSERT INTO map_configs (name, label, type, style, country, flag, map_category, active, metadata)
VALUES (
  'Belgium Ortho',
  'Belgium Ortho',
  'wmts',
  NULL,
  'Belgium',
  '🇧🇪',
  'background',
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
  map_category = EXCLUDED.map_category;

-- Verify the imports
SELECT name, label, type, map_category, active 
FROM map_configs 
WHERE name IN (
  'BEV DKM GST',
  'BEV Kataster',
  'BEV Kataster 2', 
  'BEV Light',
  'dkm_bev_symbole',
  'TopPlusOpen',
  'NL Luchtfoto',
  'Belgium Ortho'
)
ORDER BY country, name;