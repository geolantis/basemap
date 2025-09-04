<template>
  <div class="wms-test-page">
    <div class="header">
      <h1>WMS/WMTS Test Page</h1>
      <div class="controls">
        <label>
          <input type="checkbox" v-model="showLabels" />
          Show Labels
        </label>
        <label>
          <input type="checkbox" v-model="showGrid" />
          Show Grid Lines
        </label>
        <label>
          Grid Size:
          <select v-model="gridSize">
            <option value="small">Small (4 columns)</option>
            <option value="medium">Medium (3 columns)</option>
            <option value="large">Large (2 columns)</option>
            <option value="full">Full (1 column)</option>
          </select>
        </label>
        <button @click="refreshAll" class="refresh-btn">Refresh All</button>
        <button @click="showAddService = !showAddService" class="add-service-btn">
          {{ showAddService ? 'Hide' : 'Add' }} Custom Service
        </button>
      </div>
    </div>

    <!-- Add Custom Service Panel -->
    <div v-if="showAddService" class="add-service-panel">
      <h2>Add Custom WMS/WMTS Service</h2>
      
      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'manual' }]"
          @click="activeTab = 'manual'"
        >
          Manual Configuration
        </button>
        <button 
          :class="['tab', { active: activeTab === 'discover' }]"
          @click="activeTab = 'discover'"
        >
          Service Discovery
        </button>
        <button 
          :class="['tab', { active: activeTab === 'examples' }]"
          @click="activeTab = 'examples'"
        >
          Example Services
        </button>
      </div>

      <!-- Manual Configuration Tab -->
      <div v-if="activeTab === 'manual'" class="tab-content">
        <div class="form-grid">
          <div class="form-group">
            <label>Service Name *</label>
            <input v-model="customService.label" placeholder="e.g., Spain Cadastre" />
          </div>
          
          <div class="form-group">
            <label>Country *</label>
            <input v-model="customService.country" placeholder="e.g., Spain" />
          </div>
          
          <div class="form-group">
            <label>Flag Emoji</label>
            <input v-model="customService.flag" placeholder="e.g., 🇪🇸" />
          </div>
          
          <div class="form-group">
            <label>Service Type *</label>
            <select v-model="customService.type">
              <option value="wms">WMS</option>
              <option value="wmts">WMTS</option>
            </select>
          </div>
        </div>

        <div v-if="customService.type === 'wms'" class="form-section">
          <h3>WMS Configuration</h3>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>WMS Service URL *</label>
              <input v-model="customService.url" placeholder="https://example.com/geoserver/wms" />
              <small>Base WMS endpoint URL (without parameters)</small>
            </div>
            
            <div class="form-group">
              <label>Layers *</label>
              <input v-model="customService.layers" placeholder="layer1,layer2" />
              <small>Comma-separated layer names</small>
            </div>
            
            <div class="form-group">
              <label>WMS Version</label>
              <select v-model="customService.version">
                <option value="1.1.0">1.1.0</option>
                <option value="1.1.1">1.1.1</option>
                <option value="1.3.0">1.3.0</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Image Format</label>
              <select v-model="customService.format">
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/gif">GIF</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="customService.transparent" />
                Transparent
              </label>
            </div>
          </div>
          
          <button @click="getWMSCapabilities" class="action-btn">
            Get Capabilities (Auto-detect layers)
          </button>
        </div>

        <div v-if="customService.type === 'wmts'" class="form-section">
          <h3>WMTS Configuration</h3>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Tile URL Template *</label>
              <input v-model="customServiceTileUrl" placeholder="https://example.com/wmts/{z}/{x}/{y}.png" />
              <small>Use {z} for zoom, {x} for column, {y} for row</small>
            </div>
            
            <div class="form-group">
              <label>Tile Size</label>
              <select v-model.number="customService.tileSize">
                <option value="256">256</option>
                <option value="512">512</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Min Zoom</label>
              <input type="number" v-model.number="customService.minzoom" min="0" max="24" />
            </div>
            
            <div class="form-group">
              <label>Max Zoom</label>
              <input type="number" v-model.number="customService.maxzoom" min="0" max="24" />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Test Configuration</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Test Center Longitude</label>
              <input type="number" v-model.number="testCenter[0]" step="0.1" />
            </div>
            <div class="form-group">
              <label>Test Center Latitude</label>
              <input type="number" v-model.number="testCenter[1]" step="0.1" />
            </div>
            <div class="form-group">
              <label>Test Zoom Level</label>
              <input type="number" v-model.number="testZoom" min="1" max="20" />
            </div>
          </div>
        </div>

        <div class="button-group">
          <button @click="testCustomService" class="test-btn">
            Test Service
          </button>
          <button @click="addCustomService" class="add-btn">
            Add to Grid
          </button>
          <button @click="generateIntegrationCode" class="code-btn">
            Generate Integration Code
          </button>
        </div>
      </div>

      <!-- Service Discovery Tab -->
      <div v-if="activeTab === 'discover'" class="tab-content">
        <div class="discovery-section">
          <h3>WMS GetCapabilities Discovery</h3>
          <div class="form-group full-width">
            <label>WMS Base URL or GetCapabilities URL</label>
            <input v-model="discoveryUrl" placeholder="https://example.com/geoserver/wms?service=WMS&request=GetCapabilities" />
            <small>Enter a WMS URL to discover available layers and configuration</small>
          </div>
          <button @click="discoverWMSService" class="action-btn">
            Discover Service
          </button>
          
          <div v-if="discoveredLayers.length > 0" class="discovered-layers">
            <h4>Discovered Layers:</h4>
            <div class="layer-list">
              <div v-for="layer in discoveredLayers" :key="layer.name" class="layer-item">
                <input 
                  type="checkbox" 
                  :id="`layer-${layer.name}`"
                  v-model="layer.selected"
                />
                <label :for="`layer-${layer.name}`">
                  <strong>{{ layer.title || layer.name }}</strong>
                  <span class="layer-name">{{ layer.name }}</span>
                  <small v-if="layer.abstract">{{ layer.abstract }}</small>
                </label>
              </div>
            </div>
            <button @click="useDiscoveredService" class="action-btn">
              Use Selected Layers
            </button>
          </div>
        </div>

        <div class="discovery-section">
          <h3>Common WMS/WMTS Endpoints by Country</h3>
          <div class="endpoint-hints">
            <div class="hint-group">
              <h4>🇪🇸 Spain</h4>
              <code>https://www.ign.es/wms-inspire/pnoa-ma</code>
              <code>https://www.catastro.minhap.es/cartografiaInspire/ServidorWMS.aspx</code>
            </div>
            <div class="hint-group">
              <h4>🇵🇹 Portugal</h4>
              <code>https://servicos.dgterritorio.gov.pt/wms/carta-administrativa</code>
            </div>
            <div class="hint-group">
              <h4>🇸🇪 Sweden</h4>
              <code>https://geodata.naturvardsverket.se/geoserver/wms</code>
            </div>
            <div class="hint-group">
              <h4>🇳🇴 Norway</h4>
              <code>https://wms.geonorge.no/skwms1/wms.topo4</code>
            </div>
            <div class="hint-group">
              <h4>🇫🇮 Finland</h4>
              <code>https://tiles.kartat.kapsi.fi/taustakartta</code>
            </div>
            <div class="hint-group">
              <h4>🇬🇷 Greece</h4>
              <code>http://gis.ktimanet.gr/wms/ktbasemap/default.aspx</code>
            </div>
            <div class="hint-group">
              <h4>🇮🇪 Ireland</h4>
              <code>https://webservices.spatialni.gov.uk/arcgis/services</code>
            </div>
            <div class="hint-group">
              <h4>🇱🇺 Luxembourg</h4>
              <code>https://wmts.geoportail.lu/opendata/service</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Examples Tab -->
      <div v-if="activeTab === 'examples'" class="tab-content">
        <h3>Example Services - Click to Load</h3>
        <div class="example-services">
          <div 
            v-for="example in exampleServices" 
            :key="example.key"
            class="example-card"
            @click="loadExampleService(example)"
          >
            <span class="flag">{{ example.flag }}</span>
            <div class="example-info">
              <h4>{{ example.label }}</h4>
              <small>{{ example.country }} - {{ example.type.toUpperCase() }}</small>
              <code>{{ example.url || example.tiles?.[0] }}</code>
            </div>
            <button class="quick-add-btn" @click.stop="quickAddExample(example)">
              Quick Add
            </button>
          </div>
        </div>
      </div>

      <!-- Integration Code Modal -->
      <div v-if="showIntegrationCode" class="modal-overlay" @click="showIntegrationCode = false">
        <div class="modal-content" @click.stop>
          <h3>Integration Code</h3>
          <p>Add this configuration to your mapconfig-full.json:</p>
          
          <div class="code-section">
            <h4>JSON Configuration:</h4>
            <pre><code>{{ integrationCode }}</code></pre>
            <button @click="copyToClipboard(integrationCode)" class="copy-btn">
              Copy JSON
            </button>
          </div>
          
          <div class="code-section">
            <h4>TypeScript/JavaScript:</h4>
            <pre><code>{{ integrationCodeJS }}</code></pre>
            <button @click="copyToClipboard(integrationCodeJS)" class="copy-btn">
              Copy Code
            </button>
          </div>
          
          <button @click="showIntegrationCode = false" class="close-btn">Close</button>
        </div>
      </div>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>

    <!-- Map Grid -->
    <div :class="['maps-grid', `grid-${gridSize}`]">
      <div 
        v-for="(service, index) in allServices" 
        :key="`${service.key}-${index}`"
        :class="['map-container', { 'has-error': service.error, 'custom': service.isCustom }]"
      >
        <div class="map-header">
          <span class="flag">{{ service.flag }}</span>
          <h3>{{ service.label }}</h3>
          <span :class="['status', service.status]">
            {{ service.status === 'loading' ? '⏳' : service.status === 'loaded' ? '✅' : '❌' }}
          </span>
          <button v-if="service.isCustom" @click="removeCustomService(index)" class="remove-btn" title="Remove">
            ×
          </button>
        </div>
        <div class="map-info">
          <span class="type-badge">{{ service.type.toUpperCase() }}</span>
          <span class="country">{{ service.country }}</span>
          <span v-if="service.isCustom" class="custom-badge">CUSTOM</span>
        </div>
        <div :id="`map-${index}`" class="map"></div>
        <div v-if="service.error" class="error-message">
          {{ service.error }}
        </div>
        <div class="map-footer">
          <button @click="zoomIn(index)" title="Zoom In">+</button>
          <button @click="zoomOut(index)" title="Zoom Out">-</button>
          <button @click="refreshMap(index)" title="Refresh">↻</button>
          <button @click="copyConfig(service)" title="Copy Config">📋</button>
          <button @click="showServiceDetails(service)" title="Details">ℹ️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import maplibre from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface WMSService {
  key: string;
  label: string;
  country: string;
  flag: string;
  type: 'wms' | 'wmts';
  url?: string;
  tiles?: string[];
  layers?: string | string[];
  format?: string;
  version?: string;
  transparent?: boolean;
  tileSize?: number;
  attribution?: string;
  minzoom?: number;
  maxzoom?: number;
  status?: 'loading' | 'loaded' | 'error';
  error?: string;
  map?: maplibre.Map;
  isCustom?: boolean;
}

const showLabels = ref(true);
const showGrid = ref(true);
const gridSize = ref('medium');
const showAddService = ref(false);
const activeTab = ref('manual');
const showIntegrationCode = ref(false);
const integrationCode = ref('');
const integrationCodeJS = ref('');
const message = ref('');
const messageType = ref('info');

// Custom service form
const customService = ref<WMSService>({
  key: '',
  label: '',
  country: '',
  flag: '',
  type: 'wms',
  url: '',
  layers: '',
  format: 'image/png',
  version: '1.1.0',
  transparent: true,
  tileSize: 256,
  minzoom: 0,
  maxzoom: 18,
});

const customServiceTileUrl = ref('');
const testCenter = ref([0, 0]);
const testZoom = ref(6);

// Discovery
const discoveryUrl = ref('');
const discoveredLayers = ref<any[]>([]);

// Custom services storage
const customServices = ref<WMSService[]>([]);

// Example services
const exampleServices = ref<WMSService[]>([
  {
    key: 'spain-cadastre',
    label: 'Spain Cadastre',
    country: 'Spain',
    flag: '🇪🇸',
    type: 'wms',
    url: 'https://www.catastro.minhap.es/cartografia/ServidorWMS.aspx',
    layers: 'Catastro',
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
  },
  {
    key: 'spain-pnoa',
    label: 'Spain PNOA Orthophoto',
    country: 'Spain',
    flag: '🇪🇸',
    type: 'wms',
    url: 'https://www.ign.es/wms-inspire/pnoa-ma',
    layers: 'OI.OrthoimageCoverage',
    format: 'image/jpeg',
    transparent: false,
    version: '1.3.0',
  },
  {
    key: 'portugal-admin',
    label: 'Portugal Administrative',
    country: 'Portugal',
    flag: '🇵🇹',
    type: 'wms',
    url: 'https://servicos.dgterritorio.gov.pt/wms/carta-administrativa',
    layers: 'Cont_AAD_CAOP2020',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
  },
  {
    key: 'sweden-topo',
    label: 'Sweden Topographic',
    country: 'Sweden',
    flag: '🇸🇪',
    type: 'wmts',
    tiles: ['https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/[TOKEN]/1.0.0/topowebb/default/3857/{z}/{y}/{x}.png'],
    tileSize: 256,
  },
  {
    key: 'norway-topo',
    label: 'Norway Topo',
    country: 'Norway',
    flag: '🇳🇴',
    type: 'wms',
    url: 'https://wms.geonorge.no/skwms1/wms.topo4',
    layers: 'topo4_WMS',
    format: 'image/png',
    transparent: false,
    version: '1.3.0',
  },
  {
    key: 'finland-background',
    label: 'Finland Background Map',
    country: 'Finland',
    flag: '🇫🇮',
    type: 'wmts',
    tiles: ['https://tiles.kartat.kapsi.fi/taustakartta/{z}/{x}/{y}.png'],
    tileSize: 256,
  },
  {
    key: 'greece-cadastre',
    label: 'Greece Cadastre',
    country: 'Greece',
    flag: '🇬🇷',
    type: 'wms',
    url: 'http://gis.ktimanet.gr/wms/ktbasemap/default.aspx',
    layers: 'KTBASEMAP',
    format: 'image/png',
    transparent: false,
    version: '1.1.1',
  },
  {
    key: 'luxembourg-topo',
    label: 'Luxembourg Topo',
    country: 'Luxembourg',
    flag: '🇱🇺',
    type: 'wmts',
    tiles: ['https://wmts.geoportail.lu/opendata/wmts/topogr_global/GLOBAL_WEBMERCATOR_4_V3/{z}/{x}/{y}.png'],
    tileSize: 256,
  },
]);

const wmsServices = ref<WMSService[]>([
  // Original services...
  {
    key: 'austria-ortho',
    label: 'Austria Orthofoto',
    country: 'Austria',
    flag: '🇦🇹',
    type: 'wmts',
    tiles: ['https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}'],
  },
  {
    key: 'germany-topplus',
    label: 'Germany TopPlusOpen',
    country: 'Germany',
    flag: '🇩🇪',
    type: 'wmts',
    tiles: ['https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web_scale/default/WEBMERCATOR/{z}/{y}/{x}.png'],
    tileSize: 256,
  },
  {
    key: 'netherlands-luchtfoto',
    label: 'Netherlands Luchtfoto',
    country: 'Netherlands',
    flag: '🇳🇱',
    type: 'wmts',
    tiles: ['https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_ortho25/EPSG:3857/{z}/{x}/{y}'],
    tileSize: 256,
  },
  {
    key: 'belgium-ortho',
    label: 'Belgium Ortho',
    country: 'Belgium',
    flag: '🇧🇪',
    type: 'wmts',
    tiles: ['https://wmts.ngi.be/inspire/ortho/1.0.0/Ortho/GoogleMapsCompatible/{z}/{y}/{x}'],
    tileSize: 256,
  },
  {
    key: 'italy-cadastre',
    label: 'Italy Cadastre',
    country: 'Italy',
    flag: '🇮🇹',
    type: 'wms',
    url: 'https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php',
    layers: 'CP.CadastralParcel',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
  },
  {
    key: 'france-admin',
    label: 'France Admin Express',
    country: 'France',
    flag: '🇫🇷',
    type: 'wmts',
    tiles: ['https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ADMINEXPRESS-COG.LATEST&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg'],
    tileSize: 256,
  },
  {
    key: 'romania-cadastre',
    label: 'Romania Cadastre',
    country: 'Romania',
    flag: '🇷🇴',
    type: 'wms',
    url: 'http://geoportal.ancpi.ro/geoserver/wms',
    layers: 'cadastru:CP.CadastralParcel',
    format: 'image/png',
    transparent: true,
    version: '1.1.0',
  },
  {
    key: 'denmark-topo',
    label: 'Denmark Topo',
    country: 'Denmark',
    flag: '🇩🇰',
    type: 'wms',
    url: 'https://services.datafordeler.dk/GeoDanmarkOrto/orto_foraar/1.0.0/WMS',
    layers: 'orto_foraar',
    format: 'image/jpeg',
    transparent: false,
    version: '1.3.0',
  },
  {
    key: 'malta-ortho',
    label: 'Malta Orthophoto',
    country: 'Malta',
    flag: '🇲🇹',
    type: 'wms',
    url: 'https://pamapserver.pa.org.mt/arcgis/services/Basemaps/Orthophoto_2018/MapServer/WMSServer',
    layers: '0',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
  },
]);

// Combine all services
const allServices = computed(() => [...wmsServices.value, ...customServices.value]);

// Helper function to proxy URLs
function proxyTileUrl(url: string): string {
  const corsProblematicDomains = [
    'geoportal.ancpi.ro',
    'pamapserver.pa.org.mt',
    'services.datafordeler.dk',
    'mapy.geoportal.gov.pl',
    'geo.nls.uk',
    'gis.lmi.is',
    'catastro.minhap.es',
    'gis.ktimanet.gr',
  ];
  
  const needsProxy = url.startsWith('http://') || 
    corsProblematicDomains.some(domain => url.includes(domain));
  
  if (needsProxy) {
    return `/api/proxy-tiles?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function createMapStyle(service: WMSService): any {
  const style: any = {
    version: 8,
    sources: {},
    layers: []
  };

  if (service.type === 'wmts' && service.tiles) {
    let tilesArray = [...service.tiles];
    
    // Add file extension if missing
    tilesArray = tilesArray.map(tileUrl => {
      if (!tileUrl.match(/\.(png|jpg|jpeg|webp)$/i)) {
        return tileUrl + '.jpeg';
      }
      return tileUrl;
    });
    
    // Proxy if needed
    tilesArray = tilesArray.map(url => proxyTileUrl(url));
    
    style.sources['raster-tiles'] = {
      type: 'raster',
      tiles: tilesArray,
      tileSize: service.tileSize || 256,
      attribution: service.attribution || '',
      minzoom: service.minzoom || 0,
      maxzoom: service.maxzoom || 22,
    };
    
    style.layers.push({
      id: 'raster-layer',
      type: 'raster',
      source: 'raster-tiles'
    });
  } else if (service.type === 'wms' && service.url) {
    const layers = Array.isArray(service.layers) 
      ? service.layers.join(',') 
      : (service.layers || '');
    
    const version = service.version || '1.1.0';
    const format = service.format || 'image/png';
    const transparent = service.transparent !== undefined ? service.transparent : true;
    const crs = version === '1.3.0' ? 'CRS' : 'SRS';
    
    const wmsUrlTemplate = `${service.url}?SERVICE=WMS&VERSION=${version}&REQUEST=GetMap&FORMAT=${format}&TRANSPARENT=${transparent}&LAYERS=${layers}&${crs}=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`;
    
    style.sources['wms-source'] = {
      type: 'raster',
      tiles: [proxyTileUrl(wmsUrlTemplate)],
      tileSize: 256,
      scheme: 'xyz'
    };
    
    style.layers.push({
      id: 'wms-layer',
      type: 'raster',
      source: 'wms-source'
    });
  }
  
  return style;
}

// Default center points for countries
const centerPoints: Record<string, [number, number]> = {
  'Austria': [13.3, 47.5],
  'Germany': [10.4, 51.1],
  'Netherlands': [5.3, 52.1],
  'Belgium': [4.5, 50.5],
  'Italy': [12.5, 42.5],
  'France': [2.3, 46.6],
  'Canada': [-123.3, 49.2],
  'Australia': [115.8, -31.9],
  'Romania': [24.9, 45.9],
  'Czech Republic': [15.5, 49.8],
  'Switzerland': [8.2, 46.8],
  'Poland': [19.1, 51.9],
  'United Kingdom': [-2.5, 54.0],
  'Denmark': [10.5, 55.7],
  'Malta': [14.4, 35.9],
  'Iceland': [-19.0, 64.9],
  'Lithuania': [23.9, 55.2],
  'Spain': [-3.7, 40.4],
  'Portugal': [-8.2, 39.5],
  'Sweden': [18.0, 62.0],
  'Norway': [8.5, 60.5],
  'Finland': [25.0, 61.9],
  'Greece': [21.8, 39.0],
  'Ireland': [-8.0, 53.0],
  'Luxembourg': [6.1, 49.8],
};

function initializeMap(service: WMSService, index: number) {
  const containerId = `map-${index}`;
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }
  
  // Clean up existing map
  if (service.map) {
    service.map.remove();
  }
  
  try {
    service.status = 'loading';
    const style = createMapStyle(service);
    
    const center = service.isCustom && testCenter.value[0] !== 0 
      ? testCenter.value as [number, number]
      : centerPoints[service.country] || [0, 0];
    
    const zoom = service.isCustom && testZoom.value !== 6
      ? testZoom.value
      : service.country === 'Malta' ? 10 : 6;
    
    service.map = new maplibre.Map({
      container: containerId,
      style: style,
      center: center,
      zoom: zoom,
      attributionControl: false
    });
    
    service.map.on('load', () => {
      service.status = 'loaded';
      service.error = undefined;
    });
    
    service.map.on('error', (e) => {
      console.error(`Error loading ${service.label}:`, e);
      service.status = 'error';
      service.error = e.error?.message || 'Failed to load tiles';
    });
    
  } catch (error) {
    console.error(`Failed to initialize map for ${service.label}:`, error);
    service.status = 'error';
    service.error = error instanceof Error ? error.message : 'Failed to initialize map';
  }
}

// Add custom service functions
function testCustomService() {
  if (!validateCustomService()) return;
  
  const testService = { ...customService.value, isCustom: true };
  if (testService.type === 'wmts' && customServiceTileUrl.value) {
    testService.tiles = [customServiceTileUrl.value];
  }
  
  // Create a temporary map for testing
  const testDiv = document.createElement('div');
  testDiv.style.width = '400px';
  testDiv.style.height = '300px';
  testDiv.style.position = 'fixed';
  testDiv.style.top = '50%';
  testDiv.style.left = '50%';
  testDiv.style.transform = 'translate(-50%, -50%)';
  testDiv.style.zIndex = '9999';
  testDiv.style.border = '2px solid #007bff';
  testDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  document.body.appendChild(testDiv);
  
  const style = createMapStyle(testService);
  const testMap = new maplibre.Map({
    container: testDiv,
    style: style,
    center: testCenter.value as [number, number],
    zoom: testZoom.value,
  });
  
  testMap.on('load', () => {
    showMessage('Service loaded successfully! Close test to continue.', 'success');
  });
  
  testMap.on('error', (e) => {
    showMessage(`Error: ${e.error?.message || 'Failed to load'}`, 'error');
  });
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close Test';
  closeBtn.style.position = 'fixed';
  closeBtn.style.top = 'calc(50% - 180px)';
  closeBtn.style.left = '50%';
  closeBtn.style.transform = 'translateX(-50%)';
  closeBtn.style.zIndex = '10000';
  closeBtn.style.padding = '10px 20px';
  closeBtn.style.background = '#dc3545';
  closeBtn.style.color = 'white';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '4px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => {
    testMap.remove();
    document.body.removeChild(testDiv);
    document.body.removeChild(closeBtn);
  };
  document.body.appendChild(closeBtn);
}

function validateCustomService(): boolean {
  if (!customService.value.label || !customService.value.country || !customService.value.type) {
    showMessage('Please fill in all required fields', 'error');
    return false;
  }
  
  if (customService.value.type === 'wms' && (!customService.value.url || !customService.value.layers)) {
    showMessage('WMS requires URL and layers', 'error');
    return false;
  }
  
  if (customService.value.type === 'wmts' && !customServiceTileUrl.value) {
    showMessage('WMTS requires tile URL template', 'error');
    return false;
  }
  
  return true;
}

function addCustomService() {
  if (!validateCustomService()) return;
  
  const newService = { 
    ...customService.value,
    key: `custom-${Date.now()}`,
    isCustom: true,
  };
  
  if (newService.type === 'wmts' && customServiceTileUrl.value) {
    newService.tiles = [customServiceTileUrl.value];
  }
  
  customServices.value.push(newService);
  
  // Initialize the new map after DOM updates
  setTimeout(() => {
    const index = allServices.value.length - 1;
    initializeMap(newService, index);
  }, 100);
  
  showMessage(`Added ${newService.label} to the grid`, 'success');
  resetCustomForm();
}

function removeCustomService(index: number) {
  const serviceIndex = index - wmsServices.value.length;
  if (serviceIndex >= 0 && serviceIndex < customServices.value.length) {
    const service = customServices.value[serviceIndex];
    if (service.map) {
      service.map.remove();
    }
    customServices.value.splice(serviceIndex, 1);
    showMessage('Service removed', 'info');
  }
}

function resetCustomForm() {
  customService.value = {
    key: '',
    label: '',
    country: '',
    flag: '',
    type: 'wms',
    url: '',
    layers: '',
    format: 'image/png',
    version: '1.1.0',
    transparent: true,
    tileSize: 256,
    minzoom: 0,
    maxzoom: 18,
  };
  customServiceTileUrl.value = '';
}

// WMS GetCapabilities
async function getWMSCapabilities() {
  if (!customService.value.url) {
    showMessage('Please enter a WMS URL first', 'error');
    return;
  }
  
  try {
    const capUrl = `${customService.value.url}?service=WMS&request=GetCapabilities`;
    const response = await fetch(proxyTileUrl(capUrl));
    const text = await response.text();
    
    // Basic XML parsing
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    // Extract service info
    const service = xml.querySelector('Service');
    if (service) {
      const title = service.querySelector('Title')?.textContent;
      if (title && !customService.value.label) {
        customService.value.label = title;
      }
    }
    
    // Extract layers
    const layers = xml.querySelectorAll('Layer Layer');
    const layerNames: string[] = [];
    
    layers.forEach(layer => {
      const name = layer.querySelector('Name')?.textContent;
      if (name) {
        layerNames.push(name);
      }
    });
    
    if (layerNames.length > 0) {
      customService.value.layers = layerNames.join(',');
      showMessage(`Found ${layerNames.length} layers`, 'success');
    }
    
    // Extract version
    const version = xml.documentElement.getAttribute('version');
    if (version) {
      customService.value.version = version;
    }
    
  } catch (error) {
    console.error('Error fetching capabilities:', error);
    showMessage('Failed to fetch capabilities. Check console for details.', 'error');
  }
}

// Service discovery
async function discoverWMSService() {
  if (!discoveryUrl.value) {
    showMessage('Please enter a WMS URL', 'error');
    return;
  }
  
  try {
    let capUrl = discoveryUrl.value;
    if (!capUrl.includes('GetCapabilities')) {
      capUrl = `${capUrl}${capUrl.includes('?') ? '&' : '?'}service=WMS&request=GetCapabilities`;
    }
    
    const response = await fetch(proxyTileUrl(capUrl));
    const text = await response.text();
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    // Extract layers with details
    const layers = xml.querySelectorAll('Layer');
    discoveredLayers.value = [];
    
    layers.forEach(layer => {
      const name = layer.querySelector('Name')?.textContent;
      const title = layer.querySelector('Title')?.textContent;
      const abstract = layer.querySelector('Abstract')?.textContent;
      
      if (name && name !== 'Layer') {
        discoveredLayers.value.push({
          name,
          title,
          abstract,
          selected: false,
        });
      }
    });
    
    if (discoveredLayers.value.length > 0) {
      showMessage(`Discovered ${discoveredLayers.value.length} layers`, 'success');
      
      // Extract service URL
      const baseUrl = discoveryUrl.value.split('?')[0];
      customService.value.url = baseUrl;
      
      // Extract service title
      const serviceTitle = xml.querySelector('Service > Title')?.textContent;
      if (serviceTitle) {
        customService.value.label = serviceTitle;
      }
    } else {
      showMessage('No layers found in service', 'warning');
    }
    
  } catch (error) {
    console.error('Error discovering service:', error);
    showMessage('Failed to discover service. Check console.', 'error');
  }
}

function useDiscoveredService() {
  const selectedLayers = discoveredLayers.value
    .filter(l => l.selected)
    .map(l => l.name);
  
  if (selectedLayers.length === 0) {
    showMessage('Please select at least one layer', 'error');
    return;
  }
  
  customService.value.layers = selectedLayers.join(',');
  activeTab.value = 'manual';
  showMessage(`Using ${selectedLayers.length} selected layers`, 'success');
}

// Example service loading
function loadExampleService(example: WMSService) {
  customService.value = { ...example };
  if (example.tiles && example.tiles.length > 0) {
    customServiceTileUrl.value = example.tiles[0];
  }
  activeTab.value = 'manual';
  
  // Set test center for the country
  const center = centerPoints[example.country];
  if (center) {
    testCenter.value = center;
  }
  
  showMessage(`Loaded ${example.label} configuration`, 'info');
}

function quickAddExample(example: WMSService) {
  const newService = { 
    ...example,
    key: `custom-${Date.now()}`,
    isCustom: true,
  };
  
  customServices.value.push(newService);
  
  setTimeout(() => {
    const index = allServices.value.length - 1;
    initializeMap(newService, index);
  }, 100);
  
  showMessage(`Added ${newService.label} to the grid`, 'success');
}

// Integration code generation
function generateIntegrationCode() {
  if (!validateCustomService()) return;
  
  const service = { ...customService.value };
  if (service.type === 'wmts' && customServiceTileUrl.value) {
    service.tiles = [customServiceTileUrl.value];
  }
  
  // Generate unique key
  service.key = service.label.toLowerCase().replace(/\s+/g, '-');
  
  // JSON configuration
  const config: any = {
    [service.key]: {
      name: service.label,
      type: service.type,
      country: service.country,
      flag: service.flag,
      label: service.label,
    }
  };
  
  if (service.type === 'wms') {
    config[service.key].url = service.url;
    config[service.key].layers = service.layers;
    config[service.key].format = service.format;
    config[service.key].transparent = service.transparent;
    config[service.key].version = service.version;
  } else if (service.type === 'wmts' && service.tiles) {
    config[service.key].tiles = service.tiles;
    config[service.key].tileSize = service.tileSize;
    if (service.minzoom) config[service.key].minzoom = service.minzoom;
    if (service.maxzoom) config[service.key].maxzoom = service.maxzoom;
  }
  
  if (service.attribution) {
    config[service.key].attribution = service.attribution;
  }
  
  integrationCode.value = JSON.stringify(config, null, 2);
  
  // JavaScript/TypeScript code
  integrationCodeJS.value = `// Add to your WMS/WMTS services configuration
const ${service.key.replace(/-/g, '_')} = ${JSON.stringify(config[service.key], null, 2)};

// For MapLibre GL JS
const style = {
  version: 8,
  sources: {
    '${service.key}': {
      type: 'raster',
      ${service.type === 'wms' ? `tiles: ['${service.url}?SERVICE=WMS&VERSION=${service.version}&REQUEST=GetMap&FORMAT=${service.format}&TRANSPARENT=${service.transparent}&LAYERS=${service.layers}&SRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}'],` : `tiles: ${JSON.stringify(service.tiles)},`}
      tileSize: ${service.tileSize || 256}
    }
  },
  layers: [{
    id: '${service.key}-layer',
    type: 'raster',
    source: '${service.key}'
  }]
};`;
  
  showIntegrationCode.value = true;
}

// Utility functions
function showMessage(msg: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  showMessage('Copied to clipboard!', 'success');
}

function showServiceDetails(service: WMSService) {
  const details = JSON.stringify(service, null, 2);
  alert(`Service Configuration:\n\n${details}`);
}

function zoomIn(index: number) {
  const service = allServices.value[index];
  if (service.map) {
    service.map.zoomIn();
  }
}

function zoomOut(index: number) {
  const service = allServices.value[index];
  if (service.map) {
    service.map.zoomOut();
  }
}

function refreshMap(index: number) {
  initializeMap(allServices.value[index], index);
}

function refreshAll() {
  allServices.value.forEach((service, index) => {
    initializeMap(service, index);
  });
}

function copyConfig(service: WMSService) {
  const config = {
    name: service.label,
    type: service.type,
    country: service.country,
    flag: service.flag,
    ...(service.url && { url: service.url }),
    ...(service.tiles && { tiles: service.tiles }),
    ...(service.layers && { layers: service.layers }),
    ...(service.format && { format: service.format }),
    ...(service.version && { version: service.version }),
    ...(service.transparent !== undefined && { transparent: service.transparent }),
    ...(service.tileSize && { tileSize: service.tileSize }),
    ...(service.attribution && { attribution: service.attribution }),
  };
  
  copyToClipboard(JSON.stringify(config, null, 2));
  showMessage(`Configuration copied for ${service.label}`, 'success');
}

onMounted(() => {
  setTimeout(() => {
    allServices.value.forEach((service, index) => {
      initializeMap(service, index);
    });
  }, 100);
});

onUnmounted(() => {
  allServices.value.forEach(service => {
    if (service.map) {
      service.map.remove();
    }
  });
});

watch(gridSize, () => {
  setTimeout(() => {
    allServices.value.forEach((service, index) => {
      initializeMap(service, index);
    });
  }, 100);
});
</script>

<style scoped>
.wms-test-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header h1 {
  margin: 0 0 15px 0;
  color: #333;
}

.controls {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.controls select {
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.refresh-btn, .add-service-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.add-service-btn {
  background: #28a745;
}

.refresh-btn:hover {
  background: #0056b3;
}

.add-service-btn:hover {
  background: #218838;
}

/* Add Service Panel */
.add-service-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.tab {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-weight: 500;
  transition: all 0.3s;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab:hover {
  color: #0056b3;
}

.tab-content {
  padding: 20px 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group small {
  margin-top: 5px;
  color: #666;
  font-size: 12px;
}

.form-section {
  margin-bottom: 25px;
}

.form-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.test-btn, .add-btn, .code-btn, .action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.test-btn {
  background: #ffc107;
  color: #000;
}

.add-btn {
  background: #28a745;
  color: white;
}

.code-btn {
  background: #17a2b8;
  color: white;
}

.action-btn {
  background: #6c757d;
  color: white;
}

.test-btn:hover {
  background: #e0a800;
}

.add-btn:hover {
  background: #218838;
}

.code-btn:hover {
  background: #138496;
}

.action-btn:hover {
  background: #5a6268;
}

/* Discovery Section */
.discovery-section {
  margin-bottom: 30px;
}

.discovery-section h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.discovered-layers {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.layer-list {
  max-height: 300px;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  align-items: start;
  padding: 10px;
  border-bottom: 1px solid #dee2e6;
}

.layer-item:last-child {
  border-bottom: none;
}

.layer-item input[type="checkbox"] {
  margin-right: 10px;
  margin-top: 3px;
}

.layer-item label {
  flex: 1;
  cursor: pointer;
}

.layer-item strong {
  display: block;
  margin-bottom: 3px;
}

.layer-name {
  display: inline-block;
  padding: 2px 6px;
  background: #e9ecef;
  border-radius: 3px;
  font-size: 12px;
  font-family: monospace;
  margin-left: 10px;
}

.layer-item small {
  display: block;
  margin-top: 5px;
  color: #6c757d;
}

.endpoint-hints {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.hint-group {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.hint-group h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.hint-group code {
  display: block;
  padding: 8px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  font-size: 11px;
  margin-bottom: 8px;
  word-break: break-all;
  cursor: pointer;
}

.hint-group code:hover {
  background: #e9ecef;
}

/* Example Services */
.example-services {
  display: grid;
  gap: 15px;
}

.example-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.example-card:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.example-card .flag {
  font-size: 24px;
}

.example-info {
  flex: 1;
}

.example-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.example-info small {
  display: block;
  color: #6c757d;
  margin-bottom: 5px;
}

.example-info code {
  display: block;
  font-size: 11px;
  color: #495057;
  word-break: break-all;
}

.quick-add-btn {
  padding: 6px 12px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s;
}

.quick-add-btn:hover {
  background: #218838;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.modal-content h3 {
  margin: 0 0 15px 0;
}

.code-section {
  margin: 20px 0;
}

.code-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
}

.code-section pre {
  background: #f4f4f4;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.code-section code {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.copy-btn, .close-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.copy-btn {
  background: #007bff;
  color: white;
  margin-top: 10px;
}

.close-btn {
  background: #dc3545;
  color: white;
  margin-top: 20px;
}

.copy-btn:hover {
  background: #0056b3;
}

.close-btn:hover {
  background: #c82333;
}

/* Messages */
.message {
  padding: 15px;
  margin: 0 0 20px 0;
  border-radius: 4px;
  font-weight: 500;
}

.message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

/* Map Grid */
.maps-grid {
  display: grid;
  gap: 20px;
}

.grid-small {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.grid-medium {
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

.grid-large {
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
}

.grid-full {
  grid-template-columns: 1fr;
}

.map-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.3s;
  position: relative;
}

.map-container.custom {
  border: 2px solid #28a745;
}

.map-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.map-container.has-error {
  border: 2px solid #dc3545;
}

.map-header {
  padding: 10px 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.map-header h3 {
  margin: 0;
  flex: 1;
  font-size: 16px;
  color: #333;
}

.flag {
  font-size: 20px;
}

.status {
  font-size: 16px;
}

.remove-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #c82333;
}

.map-info {
  padding: 8px 15px;
  background: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 10px;
  align-items: center;
}

.type-badge {
  padding: 2px 8px;
  background: #007bff;
  color: white;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
}

.custom-badge {
  padding: 2px 8px;
  background: #28a745;
  color: white;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
}

.country {
  font-size: 13px;
  color: #666;
}

.map {
  height: 300px;
  width: 100%;
}

.grid-large .map {
  height: 400px;
}

.grid-full .map {
  height: 500px;
}

.error-message {
  padding: 10px 15px;
  background: #f8d7da;
  color: #721c24;
  font-size: 13px;
}

.map-footer {
  padding: 10px 15px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.map-footer button {
  padding: 5px 10px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.3s;
  font-size: 14px;
}

.map-footer button:hover {
  background: #5a6268;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .maps-grid {
    grid-template-columns: 1fr;
  }
  
  .map {
    height: 250px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .endpoint-hints {
    grid-template-columns: 1fr;
  }
}
</style>