<template>
  <div class="help-page">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <i class="pi pi-map-marker"></i>
          Map Configuration Service
        </h1>
        <p class="hero-subtitle">
          Your centralized hub for managing basemaps and overlay layers across all Geolantis360 applications
        </p>
        <div class="hero-badges">
          <span class="badge badge-success">
            <i class="pi pi-check-circle"></i>
            API Key Protection
          </span>
          <span class="badge badge-primary">
            <i class="pi pi-cloud"></i>
            Cloud-Based
          </span>
          <span class="badge badge-info">
            <i class="pi pi-shield"></i>
            Secure Proxy
          </span>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="container">
      <TabView>
        <TabPanel header="Quick Start">
          <div class="tab-content">
            <h2><i class="pi pi-bolt"></i> Getting Started</h2>
            
            <div class="quick-start-grid">
              <Card class="quick-card">
                <template #header>
                  <div class="card-header-icon">
                    <i class="pi pi-map" style="font-size: 2rem; color: var(--primary-color)"></i>
                  </div>
                </template>
                <template #title>1. Browse Maps</template>
                <template #content>
                  <p>Navigate to the <router-link to="/">Dashboard</router-link> to view all available map configurations. Use the search and filter options to find specific maps.</p>
                  <Button label="Go to Dashboard" icon="pi pi-arrow-right" @click="$router.push('/')" class="p-button-sm" />
                </template>
              </Card>

              <Card class="quick-card">
                <template #header>
                  <div class="card-header-icon">
                    <i class="pi pi-plus" style="font-size: 2rem; color: var(--green-500)"></i>
                  </div>
                </template>
                <template #title>2. Create Configuration</template>
                <template #content>
                  <p>Click "New Configuration" to create a new map setup. Configure basemaps and overlay layers for your specific needs.</p>
                  <Button label="Create New" icon="pi pi-plus" @click="$router.push('/config/new')" class="p-button-sm p-button-success" />
                </template>
              </Card>

              <Card class="quick-card">
                <template #header>
                  <div class="card-header-icon">
                    <i class="pi pi-eye" style="font-size: 2rem; color: var(--blue-500)"></i>
                  </div>
                </template>
                <template #title>3. Preview & Edit</template>
                <template #content>
                  <p>Preview maps in real-time and edit styles using the integrated Maputnik editor for pixel-perfect customization.</p>
                  <Button label="Discover Maps" icon="pi pi-search" @click="$router.push('/discover')" class="p-button-sm p-button-info" />
                </template>
              </Card>
            </div>

            <Message severity="info" :closable="false">
              <strong>Demo Mode Active:</strong> The service is currently running in demo mode. Authentication is simulated - use any email/password to login.
            </Message>
          </div>
        </TabPanel>

        <TabPanel header="API Documentation">
          <div class="tab-content">
            <h2><i class="pi pi-code"></i> API Endpoints</h2>
            
            <Accordion :activeIndex="0">
              <AccordionTab header="Configuration Management API">
                <div class="api-section">
                  <h3>Available Endpoints</h3>
                  
                  <div class="endpoint-item">
                    <div class="endpoint-header">
                      <span class="method get">GET</span>
                      <code class="endpoint-path">/api/maps</code>
                    </div>
                    <p>List all available map configurations</p>
                    <pre class="code-block">
// Example Response
{
  "backgroundMaps": {
    "MapTiler_Streets": {
      "name": "MapTiler Streets",
      "style": "/api/proxy/style/maptiler-streets",
      "type": "vtc",
      "flag": "🌍"
    }
  },
  "overlayMaps": { ... }
}</pre>
                  </div>

                  <div class="endpoint-item">
                    <div class="endpoint-header">
                      <span class="method get">GET</span>
                      <code class="endpoint-path">/api/maps/{id}</code>
                    </div>
                    <p>Get a specific map configuration by ID</p>
                  </div>

                  <div class="endpoint-item">
                    <div class="endpoint-header">
                      <span class="method post">POST</span>
                      <code class="endpoint-path">/api/maps</code>
                    </div>
                    <p>Create a new map configuration (requires authentication)</p>
                    <pre class="code-block">
// Request Body
{
  "name": "Custom Basemap",
  "style": "https://example.com/style.json",
  "type": "vtc",
  "label": "My Custom Map",
  "country": "Global"
}</pre>
                  </div>

                  <div class="endpoint-item">
                    <div class="endpoint-header">
                      <span class="method put">PUT</span>
                      <code class="endpoint-path">/api/maps/{id}</code>
                    </div>
                    <p>Update an existing map configuration</p>
                  </div>

                  <div class="endpoint-item">
                    <div class="endpoint-header">
                      <span class="method delete">DELETE</span>
                      <code class="endpoint-path">/api/maps/{id}</code>
                    </div>
                    <p>Delete a map configuration</p>
                  </div>
                </div>
              </AccordionTab>

              <AccordionTab header="Secure Proxy API">
                <div class="api-section">
                  <h3>Proxy Endpoints for Protected Services</h3>
                  
                  <Message severity="success" :closable="false">
                    These endpoints automatically inject API keys server-side, keeping them secure from client exposure.
                  </Message>

                  <div class="endpoint-item">
                    <div class="endpoint-header">
                      <span class="method get">GET</span>
                      <code class="endpoint-path">/api/proxy/style/{provider}</code>
                    </div>
                    <p>Fetch style JSON with automatic API key injection</p>
                    <div class="provider-list">
                      <h4>Supported Providers:</h4>
                      <ul>
                        <li><code>maptiler-streets</code> - MapTiler Streets style</li>
                        <li><code>maptiler-satellite</code> - MapTiler Satellite imagery</li>
                        <li><code>clockwork-osm</code> - Clockwork Micro OSM</li>
                        <li><code>bev-austria</code> - BEV Austrian cadastral</li>
                        <li><code>ign-france</code> - IGN France topographic</li>
                      </ul>
                    </div>
                  </div>

                  <div class="endpoint-item">
                    <div class="endpoint-header">
                      <span class="method get">GET</span>
                      <code class="endpoint-path">/api/proxy/tiles/{provider}/{z}/{x}/{y}</code>
                    </div>
                    <p>Proxy tile requests with secure API key handling</p>
                  </div>

                  <div class="endpoint-item">
                    <div class="endpoint-header">
                      <span class="method get">GET</span>
                      <code class="endpoint-path">/api/proxy/sprite/{provider}</code>
                    </div>
                    <p>Fetch sprite sheets for map symbols</p>
                  </div>

                  <div class="endpoint-item">
                    <div class="endpoint-header">
                      <span class="method get">GET</span>
                      <code class="endpoint-path">/api/proxy/glyphs/{provider}/{fontstack}/{range}</code>
                    </div>
                    <p>Proxy font glyph requests</p>
                  </div>
                </div>
              </AccordionTab>

              <AccordionTab header="Style Management API">
                <div class="api-section">
                  <h3>Style File Management</h3>

                  <div class="endpoint-item">
                    <div class="endpoint-header">
                      <span class="method get">GET</span>
                      <code class="endpoint-path">/styles/{name}.json</code>
                    </div>
                    <p>Retrieve hosted style files</p>
                    <pre class="code-block">
// Example: /styles/custom-dark.json
{
  "version": 8,
  "name": "Custom Dark Theme",
  "sources": { ... },
  "layers": [ ... ]
}</pre>
                  </div>

                  <div class="endpoint-item">
                    <div class="endpoint-header">
                      <span class="method post">POST</span>
                      <code class="endpoint-path">/api/styles/validate</code>
                    </div>
                    <p>Validate a Mapbox GL style JSON</p>
                  </div>

                  <div class="endpoint-item">
                    <div class="endpoint-header">
                      <span class="method post">POST</span>
                      <code class="endpoint-path">/api/styles/auto-save</code>
                    </div>
                    <p>Auto-save style changes from Maputnik editor</p>
                  </div>
                </div>
              </AccordionTab>
            </Accordion>
          </div>
        </TabPanel>

        <TabPanel header="Integration Guide">
          <div class="tab-content">
            <h2><i class="pi pi-link"></i> Integrating with Your Application</h2>

            <div class="integration-section">
              <h3>JavaScript / MapLibre GL JS</h3>
              <pre class="code-block language-javascript">
import maplibregl from 'maplibre-gl';

// Initialize map with proxied style
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://mapconfig.geolantis.com/api/proxy/style/maptiler-streets',
  center: [16.3738, 48.2082], // Vienna
  zoom: 12
});

// Fetch available maps
async function loadMapConfigs() {
  const response = await fetch('https://mapconfig.geolantis.com/api/maps');
  const configs = await response.json();
  
  // Add background maps to selector
  Object.entries(configs.backgroundMaps).forEach(([key, config]) => {
    console.log(`${config.flag} ${config.label}`);
  });
}</pre>

              <h3>React Example</h3>
              <pre class="code-block language-jsx">
import { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';

function MapComponent() {
  const [maps, setMaps] = useState({});
  
  useEffect(() => {
    // Fetch available maps
    fetch('https://mapconfig.geolantis.com/api/maps')
      .then(res => res.json())
      .then(data => setMaps(data));
  }, []);
  
  useEffect(() => {
    // Initialize map
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://mapconfig.geolantis.com/api/proxy/style/maptiler-streets',
      center: [0, 0],
      zoom: 2
    });
    
    return () => map.remove();
  }, []);
  
  return &lt;div id="map" style={{ width: '100%', height: '400px' }} /&gt;;
}</pre>

              <h3>Vue 3 Example</h3>
              <pre class="code-block language-javascript">
&lt;template&gt;
  &lt;div id="map" ref="mapContainer" /&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref, onMounted, onUnmounted } from 'vue';
import maplibregl from 'maplibre-gl';

const mapContainer = ref(null);
let map = null;

onMounted(async () => {
  // Fetch map configurations
  const response = await fetch('https://mapconfig.geolantis.com/api/maps');
  const configs = await response.json();
  
  // Initialize map
  map = new maplibregl.Map({
    container: mapContainer.value,
    style: 'https://mapconfig.geolantis.com/api/proxy/style/maptiler-streets',
    center: [16.3738, 48.2082],
    zoom: 12
  });
});

onUnmounted(() => {
  map?.remove();
});
&lt;/script&gt;</pre>
            </div>

            <Message severity="warn" :closable="false">
              <strong>CORS Configuration:</strong> Ensure your application domain is whitelisted in the service CORS settings for production use.
            </Message>
          </div>
        </TabPanel>

        <TabPanel header="Features">
          <div class="tab-content">
            <h2><i class="pi pi-star"></i> Key Features</h2>

            <div class="features-grid">
              <div class="feature-card">
                <div class="feature-icon">
                  <i class="pi pi-shield"></i>
                </div>
                <h3>API Key Protection</h3>
                <p>Commercial API keys are never exposed to clients. All requests are proxied through secure server-side endpoints with automatic key injection.</p>
                <ul>
                  <li>MapTiler API keys secured</li>
                  <li>Clockwork Micro protected</li>
                  <li>BEV Austria credentials safe</li>
                  <li>Google Maps API secured</li>
                </ul>
              </div>

              <div class="feature-card">
                <div class="feature-icon">
                  <i class="pi pi-images"></i>
                </div>
                <h3>Map Categories</h3>
                <p>Organize maps into logical categories for better management and user experience.</p>
                <ul>
                  <li><strong>Background Maps:</strong> Primary basemap layers (streets, satellite, terrain)</li>
                  <li><strong>Overlay Maps:</strong> Transparent layers (cadastral, contours, boundaries)</li>
                  <li><strong>Custom Styles:</strong> Upload and manage custom MapLibre styles</li>
                </ul>
              </div>

              <div class="feature-card">
                <div class="feature-icon">
                  <i class="pi pi-pencil"></i>
                </div>
                <h3>Maputnik Integration</h3>
                <p>Built-in Maputnik editor for visual style customization without leaving the platform.</p>
                <ul>
                  <li>Real-time style editing</li>
                  <li>Layer management</li>
                  <li>Color and typography control</li>
                  <li>Auto-save functionality</li>
                </ul>
              </div>

              <div class="feature-card">
                <div class="feature-icon">
                  <i class="pi pi-eye"></i>
                </div>
                <h3>Live Preview</h3>
                <p>Preview maps in real-time before deploying to production applications.</p>
                <ul>
                  <li>Interactive map preview</li>
                  <li>Multiple zoom levels</li>
                  <li>Location search</li>
                  <li>Preview image generation</li>
                </ul>
              </div>

              <div class="feature-card">
                <div class="feature-icon">
                  <i class="pi pi-copy"></i>
                </div>
                <h3>Duplication Modes</h3>
                <p>Multiple duplication strategies for efficient map configuration management.</p>
                <ul>
                  <li><strong>Exact Copy:</strong> Clone configuration as-is</li>
                  <li><strong>Country Adaptation:</strong> Adapt for different regions</li>
                  <li><strong>Template Creation:</strong> Use as starting point</li>
                  <li><strong>Bulk Operations:</strong> Duplicate multiple at once</li>
                </ul>
              </div>

              <div class="feature-card">
                <div class="feature-icon">
                  <i class="pi pi-database"></i>
                </div>
                <h3>Data Management</h3>
                <p>Robust data storage and management with Supabase backend.</p>
                <ul>
                  <li>PostgreSQL database</li>
                  <li>Real-time subscriptions</li>
                  <li>Row-level security</li>
                  <li>Automatic backups</li>
                </ul>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Security">
          <div class="tab-content">
            <h2><i class="pi pi-lock"></i> Security & Best Practices</h2>

            <div class="security-section">
              <Card>
                <template #title>
                  <i class="pi pi-key"></i> API Key Management
                </template>
                <template #content>
                  <ul class="security-list">
                    <li>
                      <i class="pi pi-check-circle text-green-500"></i>
                      API keys are stored in secure environment variables
                    </li>
                    <li>
                      <i class="pi pi-check-circle text-green-500"></i>
                      Keys are never sent to or stored on client devices
                    </li>
                    <li>
                      <i class="pi pi-check-circle text-green-500"></i>
                      Automatic key rotation support
                    </li>
                    <li>
                      <i class="pi pi-check-circle text-green-500"></i>
                      Usage monitoring and anomaly detection
                    </li>
                  </ul>
                </template>
              </Card>

              <Card>
                <template #title>
                  <i class="pi pi-users"></i> Access Control
                </template>
                <template #content>
                  <ul class="security-list">
                    <li>
                      <i class="pi pi-info-circle text-blue-500"></i>
                      Public read access for map configurations
                    </li>
                    <li>
                      <i class="pi pi-shield text-orange-500"></i>
                      Authenticated write access for administrators
                    </li>
                    <li>
                      <i class="pi pi-ban text-red-500"></i>
                      Rate limiting on all proxy endpoints
                    </li>
                    <li>
                      <i class="pi pi-filter text-purple-500"></i>
                      IP whitelisting for sensitive operations
                    </li>
                  </ul>
                </template>
              </Card>

              <Card>
                <template #title>
                  <i class="pi pi-chart-line"></i> Performance Optimization
                </template>
                <template #content>
                  <ul class="security-list">
                    <li>
                      <i class="pi pi-bolt text-yellow-500"></i>
                      CDN integration for static assets
                    </li>
                    <li>
                      <i class="pi pi-server text-blue-500"></i>
                      Edge function deployment on Vercel
                    </li>
                    <li>
                      <i class="pi pi-sync text-green-500"></i>
                      Intelligent tile caching strategies
                    </li>
                    <li>
                      <i class="pi pi-image text-purple-500"></i>
                      Automatic preview image generation
                    </li>
                  </ul>
                </template>
              </Card>
            </div>

            <Message severity="info" :closable="false">
              <strong>Security Tip:</strong> Always use HTTPS endpoints in production and implement proper CORS headers for your domains.
            </Message>
          </div>
        </TabPanel>

        <TabPanel header="Support">
          <div class="tab-content">
            <h2><i class="pi pi-question-circle"></i> Help & Support</h2>

            <div class="support-section">
              <Card>
                <template #title>
                  <i class="pi pi-book"></i> Documentation
                </template>
                <template #content>
                  <div class="support-links">
                    <a href="https://maplibre.org/maplibre-gl-js/docs/" target="_blank" class="support-link">
                      <i class="pi pi-external-link"></i> MapLibre GL JS Docs
                    </a>
                    <a href="https://docs.mapbox.com/mapbox-gl-js/style-spec/" target="_blank" class="support-link">
                      <i class="pi pi-external-link"></i> Mapbox Style Specification
                    </a>
                    <a href="https://openmaptiles.org/schema/" target="_blank" class="support-link">
                      <i class="pi pi-external-link"></i> OpenMapTiles Schema
                    </a>
                  </div>
                </template>
              </Card>

              <Card>
                <template #title>
                  <i class="pi pi-comments"></i> Contact Support
                </template>
                <template #content>
                  <p>For technical support or questions about the Map Configuration Service:</p>
                  <div class="contact-options">
                    <Button label="Email Support" icon="pi pi-envelope" class="p-button-outlined" />
                    <Button label="GitHub Issues" icon="pi pi-github" class="p-button-outlined" />
                    <Button label="Documentation" icon="pi pi-book" class="p-button-outlined" />
                  </div>
                </template>
              </Card>

              <Card>
                <template #title>
                  <i class="pi pi-info-circle"></i> System Information
                </template>
                <template #content>
                  <div class="system-info">
                    <div class="info-item">
                      <span class="info-label">Service Version:</span>
                      <span class="info-value">2.0.0</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">API Version:</span>
                      <span class="info-value">v1</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Status:</span>
                      <span class="badge badge-success">Operational</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Environment:</span>
                      <span class="info-value">{{ environment }}</span>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <Message severity="success" :closable="false">
              <strong>Need Help?</strong> Check out our <router-link to="/wms-test">WMS Test Page</router-link> to test Web Map Service connections.
            </Message>
          </div>
        </TabPanel>
      </TabView>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';

const router = useRouter();
const environment = computed(() => import.meta.env.MODE === 'production' ? 'Production' : 'Development');
</script>

<style scoped>
.help-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.hero-title i {
  margin-right: 1rem;
  font-size: 2.5rem;
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.95;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-badges {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
}

.badge i {
  margin-right: 0.5rem;
}

.badge-success {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.badge-primary {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.badge-info {
  background: rgba(14, 165, 233, 0.2);
  border-color: rgba(14, 165, 233, 0.3);
}

/* Container */
.container {
  max-width: 1400px;
  margin: -2rem auto 2rem;
  padding: 0 2rem;
  position: relative;
  z-index: 3;
}

/* Tab Content */
.tab-content {
  padding: 2rem;
}

.tab-content h2 {
  font-size: 1.75rem;
  margin-bottom: 2rem;
  color: #1e293b;
  display: flex;
  align-items: center;
}

.tab-content h2 i {
  margin-right: 0.75rem;
  color: var(--primary-color);
}

.tab-content h3 {
  font-size: 1.25rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #334155;
}

/* Quick Start Grid */
.quick-start-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.quick-card {
  transition: transform 0.3s, box-shadow 0.3s;
}

.quick-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.card-header-icon {
  padding: 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

/* API Documentation */
.api-section {
  margin-top: 1rem;
}

.endpoint-item {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.endpoint-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.method {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.method.get {
  background: #10b981;
  color: white;
}

.method.post {
  background: #3b82f6;
  color: white;
}

.method.put {
  background: #f59e0b;
  color: white;
}

.method.delete {
  background: #ef4444;
  color: white;
}

.endpoint-path {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  color: #1e293b;
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
}

.code-block {
  background: #1e293b;
  color: #f1f5f9;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-top: 1rem;
}

.provider-list {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
}

.provider-list h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #64748b;
}

.provider-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.provider-list li {
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.provider-list code {
  background: #e2e8f0;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.875rem;
  color: #0f172a;
}

/* Integration Section */
.integration-section {
  margin-top: 1rem;
}

.language-javascript,
.language-jsx {
  background: #1e293b;
  color: #e2e8f0;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.feature-card:hover {
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.feature-icon i {
  font-size: 1.5rem;
  color: white;
}

.feature-card h3 {
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.feature-card p {
  color: #64748b;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.feature-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-card li {
  padding: 0.375rem 0;
  color: #475569;
  font-size: 0.875rem;
}

.feature-card li strong {
  color: #1e293b;
}

/* Security Section */
.security-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.security-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.security-list li {
  padding: 0.75rem 0;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}

.security-list li:last-child {
  border-bottom: none;
}

.security-list i {
  margin-right: 0.75rem;
  font-size: 1.25rem;
}

/* Support Section */
.support-section {
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
}

.support-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.support-link {
  color: var(--primary-color);
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
}

.support-link:hover {
  background: #f1f5f9;
}

.support-link i {
  margin-right: 0.5rem;
}

.contact-options {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.system-info {
  display: grid;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-label {
  font-weight: 500;
  color: #64748b;
}

.info-value {
  color: #1e293b;
  font-weight: 600;
}

/* PrimeVue Overrides */
:deep(.p-tabview-nav) {
  background: white;
  border: none;
  border-radius: 12px 12px 0 0;
  padding: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

:deep(.p-tabview-header) {
  border-radius: 8px;
  margin: 0 0.25rem;
}

:deep(.p-tabview-panels) {
  background: white;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

:deep(.p-card) {
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
}

:deep(.p-card-title) {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
}

:deep(.p-card-title i) {
  margin-right: 0.5rem;
  color: var(--primary-color);
}

:deep(.p-accordion-header-link) {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
}

:deep(.p-accordion-content) {
  padding: 1.5rem;
  background: #fcfcfc;
  border: 1px solid #e9ecef;
  border-top: none;
  border-radius: 0 0 8px 8px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .hero-badges {
    flex-direction: column;
    align-items: center;
  }
  
  .container {
    padding: 0 1rem;
  }
  
  .tab-content {
    padding: 1rem;
  }
  
  .features-grid,
  .security-section {
    grid-template-columns: 1fr;
  }
  
  .contact-options {
    flex-direction: column;
  }
}
</style>