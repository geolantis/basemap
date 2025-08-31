-- Seed all 94 maps into the database
-- Run this after setup_database.sql

-- Clear existing map data (optional - comment out to keep existing)
TRUNCATE map_configs CASCADE;

-- Insert all 94 maps
INSERT INTO map_configs (name, label, type, style, original_style, country, flag, metadata, is_active) VALUES
-- Global Maps (11)
('Global', 'Global', 'vtc', 'https://api.maptiler.com/maps/streets-v2/style.json', 'https://api.maptiler.com/maps/streets-v2/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Global', '🌐', '{"provider": "MapTiler"}', true),
('Global2', 'Global 2', 'vtc', 'https://maps.clockworkmicro.com/streets/v1/style', 'https://maps.clockworkmicro.com/streets/v1/style?x-api-key=9G4F5b99xO28esL8tArIO2Bbp8sGhURW5qIieYTy', 'Global', '🌐', '{"provider": "Clockwork Micro"}', true),
('Landscape', 'Landscape', 'vtc', 'https://api.maptiler.com/maps/landscape/style.json', 'https://api.maptiler.com/maps/landscape/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Global', '🌐', '{"provider": "MapTiler"}', true),
('BasemapDEGlobal', 'Basemap.de Global', 'vtc', 'https://sgx.geodatenzentrum.de/gdz_basemapworld_vektor/styles/bm_web_wld_col.json', 'https://sgx.geodatenzentrum.de/gdz_basemapworld_vektor/styles/bm_web_wld_col.json', 'Global', '🌐', '{"provider": "BKG"}', true),
('Ocean', 'Ocean', 'vtc', 'https://api.maptiler.com/maps/ocean/style.json', 'https://api.maptiler.com/maps/ocean/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Global', '🌐', '{"provider": "MapTiler"}', true),
('Outdoor', 'Outdoor', 'vtc', 'https://api.maptiler.com/maps/outdoor-v2/style.json', 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Global', '🌐', '{"provider": "MapTiler"}', true),
('Dataviz', 'Dataviz', 'vtc', 'https://api.maptiler.com/maps/dataviz/style.json', 'https://api.maptiler.com/maps/dataviz/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Global', '🌐', '{"provider": "MapTiler"}', true),
('OSMLiberty', 'OSM Liberty', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/osmliberty.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/osmliberty.json', 'Global', '🌐', '{"provider": "OSM"}', true),
('OSMBright', 'OSM Bright', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/osmliberty.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/osmliberty.json', 'Global', '🌐', '{"provider": "OSM"}', true),
('OSM3D', 'OSM 3D', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/maptiler3d.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/maptiler3d.json', 'Global', '🌐', '{"provider": "OSM"}', true),
('GlobalSat', 'Global Satellite', 'vtc', 'https://api.maptiler.com/maps/satellite/style.json', 'https://api.maptiler.com/maps/satellite/style.json?key=ldV32HV5eBdmgfE7vZJI', 'Global', '🌐', '{"provider": "MapTiler"}', true),

-- Austria Maps (24)
('Basemap Standard', 'Basemap Standard', 'vtc', 'https://gis.ktn.gv.at/osgdi/styles/basemap_ktn_vektor.json', 'https://gis.ktn.gv.at/osgdi/styles/basemap_ktn_vektor.json', 'Austria', '🇦🇹', '{"provider": "basemap.at"}', true),
('Basemap Grau', 'Basemap Grau', 'vtc', 'https://raw.githubusercontent.com/basemap-at/styles/main/styles/basemap-v2.json', 'https://raw.githubusercontent.com/basemap-at/styles/main/styles/basemap-v2.json', 'Austria', '🇦🇹', '{"provider": "basemap.at"}', true),
('Basemap Overlay', 'Basemap Overlay', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap.json', 'Austria', '🇦🇹', '{"provider": "basemap.at"}', true),
('Basemap Terrain', 'Basemap Terrain', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemaphidpi.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemaphidpi.json', 'Austria', '🇦🇹', '{"provider": "basemap.at"}', true),
('Basemap Surface', 'Basemap Surface', 'vtc', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemaphidpi.json', 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemaphidpi.json', 'Austria', '🇦🇹', '{"provider": "basemap.at"}', true),
('Geoland Basemap', 'Geoland Basemap', 'wmts', 'tiles', '{"tiles": ["https://maps.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png"]}', 'Austria', '🇦🇹', '{"provider": "geoland.at", "tileSize": 256}', true),
('Geoland Basemap Grau', 'Geoland Basemap Grau', 'wmts', 'tiles', '{"tiles": ["https://maps.wien.gv.at/basemap/bmapgrau/normal/google3857/{z}/{y}/{x}.png"]}', 'Austria', '🇦🇹', '{"provider": "geoland.at", "tileSize": 256}', true),
('Geoland Basemap Overlay', 'Geoland Basemap Overlay', 'wmts', 'tiles', '{"tiles": ["https://maps.wien.gv.at/basemap/bmapoverlay/normal/google3857/{z}/{y}/{x}.png"]}', 'Austria', '🇦🇹', '{"provider": "geoland.at", "tileSize": 256}', true),
('Geoland Basemap High DPI', 'Geoland Basemap High DPI', 'wmts', 'tiles', '{"tiles": ["https://maps.wien.gv.at/basemap/bmaphidpi/normal/google3857/{z}/{y}/{x}.jpeg"]}', 'Austria', '🇦🇹', '{"provider": "geoland.at", "tileSize": 256}', true),
('Geoland Basemap Orthophoto', 'Geoland Basemap Orthophoto', 'wmts', 'tiles', '{"tiles": ["https://maps.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg"]}', 'Austria', '🇦🇹', '{"provider": "geoland.at", "tileSize": 256}', true),
('Geoland Basemap Gelände', 'Geoland Basemap Gelände', 'wmts', 'tiles', '{"tiles": ["https://maps.wien.gv.at/basemap/bmapgelaende/grau/google3857/{z}/{y}/{x}.jpeg"]}', 'Austria', '🇦🇹', '{"provider": "geoland.at", "tileSize": 256}', true),
('Geoland Basemap Oberfläche', 'Geoland Basemap Oberfläche', 'wmts', 'tiles', '{"tiles": ["https://maps.wien.gv.at/basemap/bmapoberflaeche/grau/google3857/{z}/{y}/{x}.jpeg"]}', 'Austria', '🇦🇹', '{"provider": "geoland.at", "tileSize": 256}', true),
('BEV Standard Farbe', 'ÖK 50 Maßstab', 'wmts', 'tiles', '{"tiles": ["https://maps.bev.gv.at/tiles/oek50_3857/{z}/{x}/{y}.png"]}', 'Austria', '🇦🇹', '{"provider": "BEV", "tileSize": 256}', true),
('BEV Standard Grau', 'BEV Standard Grau', 'wmts', 'tiles', '{"tiles": ["https://maps.bev.gv.at/tiles/oek50_gray_3857/{z}/{x}/{y}.png"]}', 'Austria', '🇦🇹', '{"provider": "BEV", "tileSize": 256}', true),
('Kataster', 'Kataster (Grundstücksgrenzen)', 'wms', 'tiles', '{"tiles": ["https://kataster.bev.gv.at/geoserver/gwc/service/wmts?layer=kataster:gs&style=BEV-KA-F-P-3857&tilematrixset=g&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Austria', '🇦🇹', '{"provider": "BEV", "tileSize": 256}', true),
('Kataster Grau', 'Kataster Grau (Grundstücksgrenzen)', 'wms', 'tiles', '{"tiles": ["https://kataster.bev.gv.at/geoserver/gwc/service/wmts?layer=kataster:gs&style=BEV-KA-G-P-3857&tilematrixset=g&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Austria', '🇦🇹', '{"provider": "BEV", "tileSize": 256}', true),
('Kataster Label', 'Kataster Label (Grundstücksnummern)', 'wms', 'tiles', '{"tiles": ["https://kataster.bev.gv.at/geoserver/gwc/service/wmts?layer=kataster:gn&style=&tilematrixset=g&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Austria', '🇦🇹', '{"provider": "BEV", "tileSize": 256}', true),
('AustrianMapMobile', 'ÖK 50 Österreich', 'wmts', 'tiles', '{"tiles": ["https://maps.bev.gv.at/tiles/oek50bmn/{z}/{x}/{y}.png"]}', 'Austria', '🇦🇹', '{"provider": "BEV", "tileSize": 256}', true),
('AustrianMapFlyCombo', 'Kombination ÖK+Ortho Österreich', 'wmts', 'tiles', '{"tiles": ["https://maps.bev.gv.at/tiles/kombi/{z}/{x}/{y}.png"]}', 'Austria', '🇦🇹', '{"provider": "BEV", "tileSize": 256}', true),
('AustrianMap', 'ÖK 200', 'wmts', 'tiles', '{"tiles": ["https://maps.bev.gv.at/tiles/oek200/{z}/{x}/{y}.png"]}', 'Austria', '🇦🇹', '{"provider": "BEV", "tileSize": 256}', true),
('AustrianMap500', 'ÖK 500', 'wmts', 'tiles', '{"tiles": ["https://maps.bev.gv.at/tiles/oek500/{z}/{x}/{y}.png"]}', 'Austria', '🇦🇹', '{"provider": "BEV", "tileSize": 256}', true),
('TopoAustria', 'Topo Österreich', 'vtc', 'https://gis.ktn.gv.at/osgdi/styles/basemap_ktn_vektor.json', 'https://gis.ktn.gv.at/osgdi/styles/basemap_ktn_vektor.json', 'Austria', '🇦🇹', '{"provider": "gis.ktn.gv.at"}', true),
('TopoAustriaGray', 'Topo Österreich Grau', 'vtc', 'https://gis.ktn.gv.at/osgdi/styles/basemap_ktn_vektor.json', 'https://gis.ktn.gv.at/osgdi/styles/basemap_ktn_vektor.json', 'Austria', '🇦🇹', '{"provider": "gis.ktn.gv.at"}', true),
('KärntenBasemap', 'Kärnten Basemap', 'vtc', 'https://gis.ktn.gv.at/osgdi/styles/basemap_ktn_vektor.json', 'https://gis.ktn.gv.at/osgdi/styles/basemap_ktn_vektor.json', 'Austria', '🇦🇹', '{"provider": "Kärnten GIS"}', true),

-- Germany Maps (11)
('BasemapDEColorWeb', 'Basemap DE Color', 'vtc', 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json', 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json', 'Germany', '🇩🇪', '{"provider": "BKG"}', true),
('BasemapDEGrayWeb', 'Basemap DE Gray', 'vtc', 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_gry.json', 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_gry.json', 'Germany', '🇩🇪', '{"provider": "BKG"}', true),
('BasemapDEColorTop', 'Basemap DE Color Topo', 'vtc', 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_top.json', 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_top.json', 'Germany', '🇩🇪', '{"provider": "BKG"}', true),
('TopPlusOpen', 'TopPlusOpen', 'wmts', 'tiles', '{"tiles": ["https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png"]}', 'Germany', '🇩🇪', '{"provider": "BKG", "tileSize": 256}', true),
('TopPlusOpenLight', 'TopPlusOpen Light', 'wmts', 'tiles', '{"tiles": ["https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web_light/default/WEBMERCATOR/{z}/{y}/{x}.png"]}', 'Germany', '🇩🇪', '{"provider": "BKG", "tileSize": 256}', true),
('TopPlusOpenGray', 'TopPlusOpen Gray', 'wmts', 'tiles', '{"tiles": ["https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web_grau/default/WEBMERCATOR/{z}/{y}/{x}.png"]}', 'Germany', '🇩🇪', '{"provider": "BKG", "tileSize": 256}', true),
('WebAtlasDE', 'WebAtlasDE', 'wmts', 'tiles', '{"tiles": ["https://sgx.geodatenzentrum.de/wmts_webatlasde/tile/1.0.0/webatlasde/default/WEBMERCATOR/{z}/{y}/{x}.png"]}', 'Germany', '🇩🇪', '{"provider": "BKG", "tileSize": 256}', true),
('WebAtlasDELight', 'WebAtlasDE Light', 'wmts', 'tiles', '{"tiles": ["https://sgx.geodatenzentrum.de/wmts_webatlasde/tile/1.0.0/webatlasde_light/default/WEBMERCATOR/{z}/{y}/{x}.png"]}', 'Germany', '🇩🇪', '{"provider": "BKG", "tileSize": 256}', true),
('WebAtlasDEGray', 'WebAtlasDE Gray', 'wmts', 'tiles', '{"tiles": ["https://sgx.geodatenzentrum.de/wmts_webatlasde/tile/1.0.0/webatlasde_grau/default/WEBMERCATOR/{z}/{y}/{x}.png"]}', 'Germany', '🇩🇪', '{"provider": "BKG", "tileSize": 256}', true),
('Niedersachsen', 'Niedersachsen (Lower Saxony)', 'wmts', 'tiles', '{"tiles": ["https://www.geobasisdaten.niedersachsen.de/doorman/noauth/wmts_webatlasni_light/tiles/webatlasni_light/WEBMERCATOR/{z}/{y}/{x}.png"]}', 'Germany', '🇩🇪', '{"provider": "LGLN", "tileSize": 256}', true),
('DOP', 'DOP (Orthophotos)', 'wmts', 'tiles', '{"tiles": ["https://sgx.geodatenzentrum.de/wmts_dop/tile/1.0.0/rgb/default/WEBMERCATOR/{z}/{y}/{x}.png"]}', 'Germany', '🇩🇪', '{"provider": "BKG", "tileSize": 256}', true),

-- Switzerland Maps (5)
('SwissTopoLight', 'SwissTopo Light', 'wmts', 'tiles', '{"tiles": ["https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg"]}', 'Switzerland', '🇨🇭', '{"provider": "swisstopo", "tileSize": 256}', true),
('SwissTopoLightGray', 'SwissTopo Light Gray', 'wmts', 'tiles', '{"tiles": ["https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/{z}/{x}/{y}.jpeg"]}', 'Switzerland', '🇨🇭', '{"provider": "swisstopo", "tileSize": 256}', true),
('SwissImagery', 'SwissImagery', 'wmts', 'tiles', '{"tiles": ["https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg"]}', 'Switzerland', '🇨🇭', '{"provider": "swisstopo", "tileSize": 256}', true),
('SwissTopoVector', 'SwissTopo Vector', 'vtc', 'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.basemap.vt/v2.0/light/style.json', 'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.basemap.vt/v2.0/light/style.json', 'Switzerland', '🇨🇭', '{"provider": "swisstopo"}', true),
('SwissTopoVectorImagery', 'SwissTopo Vector Imagery', 'vtc', 'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.basemap.vt/v2.0/aerial/style.json', 'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.basemap.vt/v2.0/aerial/style.json', 'Switzerland', '🇨🇭', '{"provider": "swisstopo"}', true),

-- France Maps (10)
('FranceIGNScan25', 'IGN Scan 25', 'wmts', 'tiles', '{"tiles": ["https://data.geopf.fr/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'France', '🇫🇷', '{"provider": "IGN", "tileSize": 256}', true),
('FranceIGNClassic', 'IGN Classic', 'wmts', 'tiles', '{"tiles": ["https://data.geopf.fr/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.MAPS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'France', '🇫🇷', '{"provider": "IGN", "tileSize": 256}', true),
('FranceIGNPlanV2', 'IGN Plan V2', 'wmts', 'tiles', '{"tiles": ["https://data.geopf.fr/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'France', '🇫🇷', '{"provider": "IGN", "tileSize": 256}', true),
('FranceIGNSatellite', 'IGN Satellite', 'wmts', 'tiles', '{"tiles": ["https://data.geopf.fr/wmts?layer=ORTHOIMAGERY.ORTHOPHOTOS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'France', '🇫🇷', '{"provider": "IGN", "tileSize": 256}', true),
('FranceIGNCadastral', 'IGN Cadastral', 'wmts', 'tiles', '{"tiles": ["https://data.geopf.fr/wmts?layer=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'France', '🇫🇷', '{"provider": "IGN", "tileSize": 256}', true),
('FranceIGNTopo', 'IGN Topo', 'wmts', 'tiles', '{"tiles": ["https://data.geopf.fr/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.MAPS.BDUNI&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'France', '🇫🇷', '{"provider": "IGN", "tileSize": 256}', true),
('FranceIGNExpressStandard', 'IGN Express Standard', 'wmts', 'tiles', '{"tiles": ["https://data.geopf.fr/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.MAPS.BDUNI.J1&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'France', '🇫🇷', '{"provider": "IGN", "tileSize": 256}', true),
('FranceIGNExpressClassic', 'IGN Express Classic', 'wmts', 'tiles', '{"tiles": ["https://data.geopf.fr/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.MAPS.BDUNI.J1&style=classique&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'France', '🇫🇷', '{"provider": "IGN", "tileSize": 256}', true),
('FranceIGNAdminExpress', 'IGN Admin Express', 'wmts', 'tiles', '{"tiles": ["https://data.geopf.fr/wmts?layer=ADMINEXPRESS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'France', '🇫🇷', '{"provider": "IGN", "tileSize": 256}', true),
('FranceIGNIsochroneDistance', 'IGN Isochrone Distance', 'wmts', 'tiles', '{"tiles": ["https://data.geopf.fr/wmts?layer=TRANSPORTNETWORKS.ROADS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'France', '🇫🇷', '{"provider": "IGN", "tileSize": 256}', true),

-- Italy Maps (8)
('ItalyIGMBase', 'IGM Base', 'wmts', 'tiles', '{"tiles": ["https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=province,strade,comune,fabbricati,particelle,acque,vestizioni&STYLES=&FORMAT=image/png&DPI=96&MAP_RESOLUTION=96&FORMAT_OPTIONS=dpi:96&TRANSPARENT=TRUE"]}', 'Italy', '🇮🇹', '{"provider": "IGM", "tileSize": 256}', true),
('ItalyEsriTopo', 'Italy Esri Topo', 'wmts', 'tiles', '{"tiles": ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"]}', 'Italy', '🇮🇹', '{"provider": "Esri", "tileSize": 256}', true),
('ItalyEsriImagery', 'Italy Esri Imagery', 'wmts', 'tiles', '{"tiles": ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"]}', 'Italy', '🇮🇹', '{"provider": "Esri", "tileSize": 256}', true),
('ItalyPCNBase', 'PCN Base', 'wmts', 'tiles', '{"tiles": ["http://wms.pcn.minambiente.it/ogc?service=WMS&version=1.3.0&request=GetMap&layers=ortofoto_colore_2012&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png"]}', 'Italy', '🇮🇹', '{"provider": "PCN", "tileSize": 256}', true),
('ItalyIGM25k', 'IGM 25k', 'wmts', 'tiles', '{"tiles": ["https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=CP.CadastralParcel&STYLES=&FORMAT=image/png&DPI=96&MAP_RESOLUTION=96&FORMAT_OPTIONS=dpi:96&TRANSPARENT=TRUE"]}', 'Italy', '🇮🇹', '{"provider": "IGM", "tileSize": 256}', true),
('ItalyIGM100k', 'IGM 100k', 'wmts', 'tiles', '{"tiles": ["https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=CP.CadastralZoning&STYLES=&FORMAT=image/png&DPI=96&MAP_RESOLUTION=96&FORMAT_OPTIONS=dpi:96&TRANSPARENT=TRUE"]}', 'Italy', '🇮🇹', '{"provider": "IGM", "tileSize": 256}', true),
('ItalyStradario', 'Italy Stradario', 'wmts', 'tiles', '{"tiles": ["https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=strade&STYLES=&FORMAT=image/png&DPI=96&MAP_RESOLUTION=96&FORMAT_OPTIONS=dpi:96&TRANSPARENT=TRUE"]}', 'Italy', '🇮🇹', '{"provider": "Agenzia Entrate", "tileSize": 256}', true),
('ItalyCatasto', 'Italy Catasto', 'wmts', 'tiles', '{"tiles": ["https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=CP.CadastralParcel,CP.CadastralZoning&STYLES=&FORMAT=image/png&DPI=96&MAP_RESOLUTION=96&FORMAT_OPTIONS=dpi:96&TRANSPARENT=TRUE"]}', 'Italy', '🇮🇹', '{"provider": "Agenzia Entrate", "tileSize": 256}', true),

-- Spain Maps (9)
('SpainIGNBase', 'IGN Base', 'wmts', 'tiles', '{"tiles": ["https://www.ign.es/wmts/mapa-raster?layer=MTN&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Spain', '🇪🇸', '{"provider": "IGN", "tileSize": 256}', true),
('SpainIGNSatellite', 'IGN Satellite', 'wmts', 'tiles', '{"tiles": ["https://www.ign.es/wmts/pnoa-ma?layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Spain', '🇪🇸', '{"provider": "IGN", "tileSize": 256}', true),
('SpainIGNTopo', 'IGN Topo', 'wmts', 'tiles', '{"tiles": ["https://www.ign.es/wmts/mtn?layer=MTN&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Spain', '🇪🇸', '{"provider": "IGN", "tileSize": 256}', true),
('SpainCatastro', 'Catastro', 'wmts', 'tiles', '{"tiles": ["http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=Catastro&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE"]}', 'Spain', '🇪🇸', '{"provider": "Catastro", "tileSize": 256}', true),
('SpainIGNSimplified', 'IGN Simplified', 'wmts', 'tiles', '{"tiles": ["https://www.ign.es/wmts/ign-base?layer=IGNBaseTodo&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Spain', '🇪🇸', '{"provider": "IGN", "tileSize": 256}', true),
('SpainIGNSateliteHybrid', 'IGN Satellite Hybrid', 'wmts', 'tiles', '{"tiles": ["https://www.ign.es/wmts/pnoa-ma?layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Spain', '🇪🇸', '{"provider": "IGN", "tileSize": 256}', true),
('SpainCartoCiudad', 'CartoCiudad', 'wmts', 'tiles', '{"tiles": ["https://www.cartociudad.es/wms-inspire/direcciones-ccpp?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=codigo-postal&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE"]}', 'Spain', '🇪🇸', '{"provider": "CartoCiudad", "tileSize": 256}', true),
('SpainCaminoDeSantiago', 'Camino de Santiago', 'wmts', 'tiles', '{"tiles": ["https://www.ign.es/wmts/camino-santiago?layer=camino-santiago&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Spain', '🇪🇸', '{"provider": "IGN", "tileSize": 256}', true),
('Spain_BTN_Completa', 'BTN Completa', 'wmts', 'tiles', '{"tiles": ["https://www.ign.es/wmts/mapa-raster?layer=MTN&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Spain', '🇪🇸', '{"provider": "IGN", "tileSize": 256}', true),

-- Netherlands Maps (5)
('NetherlandsTopoRD', 'Netherlands Topo RD', 'wmts', 'tiles', '{"tiles": ["https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0?layer=standaard&style=default&tilematrixset=EPSG:3857&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Netherlands', '🇳🇱', '{"provider": "PDOK", "tileSize": 256}', true),
('NetherlandsTopoGray', 'Netherlands Topo Gray', 'wmts', 'tiles', '{"tiles": ["https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0?layer=grijs&style=default&tilematrixset=EPSG:3857&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Netherlands', '🇳🇱', '{"provider": "PDOK", "tileSize": 256}', true),
('NetherlandsTopoPastel', 'Netherlands Topo Pastel', 'wmts', 'tiles', '{"tiles": ["https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0?layer=pastel&style=default&tilematrixset=EPSG:3857&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Netherlands', '🇳🇱', '{"provider": "PDOK", "tileSize": 256}', true),
('NetherlandsTopoWater', 'Netherlands Topo Water', 'wmts', 'tiles', '{"tiles": ["https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0?layer=water&style=default&tilematrixset=EPSG:3857&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Netherlands', '🇳🇱', '{"provider": "PDOK", "tileSize": 256}', true),
('NetherlandsAerial', 'Netherlands Aerial', 'wmts', 'tiles', '{"tiles": ["https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0?layer=Actueel_orthoHR&style=default&tilematrixset=EPSG:3857&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"]}', 'Netherlands', '🇳🇱', '{"provider": "PDOK", "tileSize": 256}', true),

-- United Kingdom Maps (5)
('OSMapsRoad', 'OS Maps Road', 'vtc', 'https://raw.githubusercontent.com/OrdnanceSurvey/OS-Vector-Tile-API-Stylesheets/master/OS_VTS_3857_Road.json', 'https://raw.githubusercontent.com/OrdnanceSurvey/OS-Vector-Tile-API-Stylesheets/master/OS_VTS_3857_Road.json', 'United Kingdom', '🇬🇧', '{"provider": "Ordnance Survey"}', true),
('OSMapsOutdoor', 'OS Maps Outdoor', 'vtc', 'https://raw.githubusercontent.com/OrdnanceSurvey/OS-Vector-Tile-API-Stylesheets/master/OS_VTS_3857_Outdoor.json', 'https://raw.githubusercontent.com/OrdnanceSurvey/OS-Vector-Tile-API-Stylesheets/master/OS_VTS_3857_Outdoor.json', 'United Kingdom', '🇬🇧', '{"provider": "Ordnance Survey"}', true),
('OSMapsLight', 'OS Maps Light', 'vtc', 'https://raw.githubusercontent.com/OrdnanceSurvey/OS-Vector-Tile-API-Stylesheets/master/OS_VTS_3857_Light.json', 'https://raw.githubusercontent.com/OrdnanceSurvey/OS-Vector-Tile-API-Stylesheets/master/OS_VTS_3857_Light.json', 'United Kingdom', '🇬🇧', '{"provider": "Ordnance Survey"}', true),
('OSMapsDark', 'OS Maps Dark', 'vtc', 'https://raw.githubusercontent.com/OrdnanceSurvey/OS-Vector-Tile-API-Stylesheets/master/OS_VTS_3857_Dark.json', 'https://raw.githubusercontent.com/OrdnanceSurvey/OS-Vector-Tile-API-Stylesheets/master/OS_VTS_3857_Dark.json', 'United Kingdom', '🇬🇧', '{"provider": "Ordnance Survey"}', true),
('OSMapsLeisure', 'OS Maps Leisure', 'wmts', 'tiles', '{"tiles": ["https://api.os.uk/maps/raster/v1/zxy/Leisure_27700/{z}/{x}/{y}.png"]}', 'United Kingdom', '🇬🇧', '{"provider": "Ordnance Survey", "tileSize": 256}', true)
ON CONFLICT (name) DO UPDATE SET
  label = EXCLUDED.label,
  type = EXCLUDED.type,
  style = EXCLUDED.style,
  original_style = EXCLUDED.original_style,
  country = EXCLUDED.country,
  flag = EXCLUDED.flag,
  metadata = EXCLUDED.metadata,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the seed
SELECT 
  country,
  COUNT(*) as map_count
FROM map_configs
GROUP BY country
ORDER BY 
  CASE 
    WHEN country = 'Global' THEN 0
    WHEN country = 'Austria' THEN 1
    WHEN country = 'Germany' THEN 2
    WHEN country = 'Switzerland' THEN 3
    WHEN country = 'France' THEN 4
    WHEN country = 'Italy' THEN 5
    WHEN country = 'Spain' THEN 6
    WHEN country = 'Netherlands' THEN 7
    WHEN country = 'United Kingdom' THEN 8
    ELSE 9
  END;

-- Total count
SELECT COUNT(*) as total_maps FROM map_configs;

-- Success message
SELECT 'Successfully seeded ' || COUNT(*) || ' maps!' as status FROM map_configs;