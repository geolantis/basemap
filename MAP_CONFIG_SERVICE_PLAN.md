# Map Configuration Service - Complete Architecture & Implementation Plan

## Executive Summary

A modern, secure map configuration service built with Vue 3, TypeScript, and Vercel Edge Functions that provides a beautiful UI for managing map configurations while protecting API keys from client exposure. The system will support both file-based and database storage options, with GitHub integration for version control and direct Maputnik editor integration.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Security Architecture](#security-architecture)
4. [User Interface Design](#user-interface-design)
5. [Backend Services](#backend-services)
6. [Database Schema](#database-schema)
7. [API Design](#api-design)
8. [Development Phases](#development-phases)
9. [Deployment Strategy](#deployment-strategy)
10. [Performance Optimization](#performance-optimization)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Client Applications"
        MA[Mobile Apps<br/>MapLibre]
        WA[Web Apps]
    end
    
    subgraph "Vercel Edge"
        EF[Edge Functions<br/>Key Proxy]
        CF[Config API]
        AF[Auth Middleware]
    end
    
    subgraph "Configuration UI"
        VUE[Vue 3 Admin<br/>Interface]
        MP[Map Preview<br/>MapLibre GL JS]
        ME[Maputnik<br/>Integration]
    end
    
    subgraph "Storage Layer"
        DB[(PostgreSQL/<br/>Supabase)]
        GH[GitHub<br/>Repository]
        FS[File System<br/>JSON]
    end
    
    subgraph "External Services"
        MT[MapTiler API]
        OSM[OSM Services]
        BEV[BEV Austria]
        IGN[IGN France]
    end
    
    MA --> EF
    WA --> EF
    VUE --> CF
    CF --> AF
    AF --> DB
    AF --> GH
    AF --> FS
    EF --> MT
    EF --> OSM
    EF --> BEV
    EF --> IGN
    VUE --> MP
    VUE --> ME
```

### 1.2 Component Architecture

```
map-config-service/
├── apps/
│   ├── web/                    # Vue 3 Admin Interface
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── MapEditor/
│   │   │   │   │   ├── MapCanvas.vue
│   │   │   │   │   ├── LayerPanel.vue
│   │   │   │   │   ├── StyleEditor.vue
│   │   │   │   │   └── PreviewPane.vue
│   │   │   │   ├── ConfigManager/
│   │   │   │   │   ├── ConfigList.vue
│   │   │   │   │   ├── ConfigForm.vue
│   │   │   │   │   ├── ImportExport.vue
│   │   │   │   │   └── VersionHistory.vue
│   │   │   │   ├── Auth/
│   │   │   │   │   ├── LoginForm.vue
│   │   │   │   │   ├── TwoFactor.vue
│   │   │   │   │   └── UserProfile.vue
│   │   │   │   └── Common/
│   │   │   │       ├── SearchBar.vue
│   │   │   │       ├── FilterDropdown.vue
│   │   │   │       └── NotificationToast.vue
│   │   │   ├── composables/
│   │   │   │   ├── useMapConfig.ts
│   │   │   │   ├── useMapPreview.ts
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useGitHub.ts
│   │   │   ├── stores/
│   │   │   │   ├── config.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── ui.ts
│   │   │   ├── views/
│   │   │   │   ├── Dashboard.vue
│   │   │   │   ├── MapConfigurator.vue
│   │   │   │   ├── Settings.vue
│   │   │   │   └── Analytics.vue
│   │   │   └── styles/
│   │   │       ├── themes/
│   │   │       └── components/
│   │   └── public/
│   └── api/                    # Vercel Edge Functions
│       ├── config/
│       │   ├── [id].ts        # GET/PUT/DELETE config
│       │   └── index.ts       # GET all, POST new
│       ├── proxy/
│       │   └── style.ts       # Proxy style.json with keys
│       ├── auth/
│       │   ├── login.ts
│       │   ├── logout.ts
│       │   └── verify.ts
│       └── github/
│           ├── sync.ts
│           └── webhook.ts
├── packages/
│   ├── shared/                # Shared utilities
│   │   ├── types/
│   │   ├── utils/
│   │   └── constants/
│   └── map-engine/           # Map rendering engine
│       ├── preview/
│       └── validation/
├── infrastructure/
│   ├── docker/
│   ├── terraform/
│   └── scripts/
└── docs/
    ├── api/
    ├── deployment/
    └── user-guide/
```

---

## 2. Technology Stack

### 2.1 Frontend Stack

- **Framework**: Vue 3.4+ with Composition API
- **TypeScript**: 5.3+ for type safety
- **Build Tool**: Vite 5.0+ for fast development
- **State Management**: Pinia 2.1+
- **UI Framework**: 
  - PrimeVue 3.45+ for enterprise components
  - Tailwind CSS 3.4+ for custom styling
  - Headless UI for accessible components
- **Map Rendering**: MapLibre GL JS 4.0+
- **Icons**: Lucide Vue / Heroicons
- **Forms**: VeeValidate 4.12+ with Zod validation
- **HTTP Client**: Axios with interceptors
- **Router**: Vue Router 4.2+

### 2.2 Backend Stack

- **Runtime**: Vercel Edge Functions (Node.js 20+)
- **API Framework**: Hono for edge runtime
- **Database Options**:
  - **Primary**: Supabase (PostgreSQL)
  - **Alternative**: Railway PostgreSQL
  - **Cache**: Vercel KV (Redis)
- **File Storage**: 
  - Vercel Blob Storage
  - GitHub Repository (version control)
- **Authentication**: 
  - NextAuth.js adapter for Vue
  - JWT with refresh tokens
  - Optional OAuth providers

### 2.3 Development Tools

- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Linting**: ESLint + Prettier
- **Testing**: 
  - Vitest for unit tests
  - Playwright for E2E
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics + Sentry

---

## 3. Security Architecture

### 3.1 API Key Protection

```typescript
// Edge Function: /api/proxy/style.ts
export default async function handler(req: Request) {
  const { styleUrl } = await req.json();
  
  // Extract and validate domain
  const domain = new URL(styleUrl).hostname;
  
  // Get appropriate key from environment
  const apiKey = getApiKeyForDomain(domain);
  
  // Fetch style with injected key
  const proxiedUrl = injectApiKey(styleUrl, apiKey);
  const styleData = await fetch(proxiedUrl);
  
  // Clean response (remove any leaked keys)
  const cleanedStyle = sanitizeStyleResponse(styleData);
  
  // Return proxied response
  return new Response(cleanedStyle, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json'
    }
  });
}
```

### 3.2 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant V as Vue App
    participant E as Edge Function
    participant D as Database
    
    U->>V: Login Request
    V->>E: POST /api/auth/login
    E->>D: Verify Credentials
    D-->>E: User Data
    E->>E: Generate JWT + Refresh Token
    E-->>V: Auth Tokens + User Info
    V->>V: Store in HttpOnly Cookie
    V-->>U: Redirect to Dashboard
    
    Note over U,D: Subsequent Requests
    V->>E: API Request + JWT
    E->>E: Verify JWT
    E->>D: Fetch/Update Data
    D-->>E: Response
    E-->>V: Protected Data
```

### 3.3 Security Measures

- **Input Validation**: Zod schemas for all inputs
- **Rate Limiting**: Vercel Edge middleware
- **CORS**: Strict origin validation
- **CSP Headers**: Content Security Policy
- **Secrets Management**: Vercel environment variables
- **Audit Logging**: All config changes tracked
- **2FA Support**: TOTP authentication
- **IP Whitelisting**: Optional for admin access

---

## 4. User Interface Design

### 4.1 Design System

#### Color Palette
```scss
// Light Theme
$primary: #3B82F6;      // Blue
$secondary: #8B5CF6;    // Purple
$success: #10B981;      // Green
$warning: #F59E0B;      // Amber
$danger: #EF4444;       // Red
$dark: #1F2937;        // Gray-800
$light: #F9FAFB;       // Gray-50

// Dark Theme
$dark-bg: #111827;      // Gray-900
$dark-surface: #1F2937; // Gray-800
$dark-border: #374151;  // Gray-700
$dark-text: #F3F4F6;   // Gray-100
```

#### Typography
```scss
// Font Stack
$font-sans: 'Inter', system-ui, -apple-system, sans-serif;
$font-mono: 'JetBrains Mono', 'Fira Code', monospace;

// Font Sizes
$text-xs: 0.75rem;     // 12px
$text-sm: 0.875rem;    // 14px
$text-base: 1rem;      // 16px
$text-lg: 1.125rem;    // 18px
$text-xl: 1.25rem;     // 20px
$text-2xl: 1.5rem;     // 24px
$text-3xl: 1.875rem;   // 30px
```

### 4.2 Key UI Components

#### 4.2.1 Dashboard View
```vue
<template>
  <div class="dashboard-container">
    <!-- Header with Search -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Map Configurations</h1>
        <div class="header-actions">
          <SearchBar v-model="searchQuery" />
          <Button icon="copy" label="Copy Existing" @click="showCopyDialog" />
          <Button icon="plus" label="New Config" @click="createNew" />
        </div>
      </div>
      
      <!-- Filter Tabs -->
      <TabGroup>
        <Tab>All Maps</Tab>
        <Tab>Global</Tab>
        <Tab>By Country</Tab>
        <Tab>Recently Updated</Tab>
      </TabGroup>
    </header>
    
    <!-- Stats Cards -->
    <div class="stats-grid">
      <StatCard 
        title="Total Maps" 
        value="156" 
        trend="+12%"
        icon="map" 
      />
      <StatCard 
        title="Active Configs" 
        value="89" 
        trend="+5%"
        icon="check-circle" 
      />
      <StatCard 
        title="API Calls Today" 
        value="45.2K" 
        trend="+23%"
        icon="activity" 
      />
      <StatCard 
        title="Cache Hit Rate" 
        value="94%" 
        trend="+2%"
        icon="zap" 
      />
    </div>
    
    <!-- Map Grid -->
    <div class="map-grid">
      <MapCard 
        v-for="map in filteredMaps"
        :key="map.id"
        :map="map"
        @edit="editMap"
        @preview="previewMap"
        @duplicate="duplicateMap"
        @delete="deleteMap"
      />
    </div>
  </div>
</template>
```

#### 4.2.2 Map Editor Interface
```vue
<template>
  <div class="editor-container">
    <!-- Split Panel Layout -->
    <SplitPane :split="'vertical'" :default-size="320">
      <!-- Left Panel: Configuration -->
      <template #pane1>
        <div class="config-panel">
          <!-- Map Info Form -->
          <section class="panel-section">
            <h3>Map Information</h3>
            <FormField label="Name" required>
              <Input v-model="config.name" />
            </FormField>
            <FormField label="Label">
              <Input v-model="config.label" />
            </FormField>
            <FormField label="Country">
              <Select v-model="config.country" :options="countries" />
            </FormField>
            <FormField label="Type">
              <RadioGroup v-model="config.type">
                <Radio value="vtc">Vector Tile</Radio>
                <Radio value="wmts">WMTS</Radio>
                <Radio value="wms">WMS</Radio>
              </RadioGroup>
            </FormField>
          </section>
          
          <!-- Style Configuration -->
          <section class="panel-section">
            <h3>Style Configuration</h3>
            <FormField label="Style URL">
              <Input v-model="config.style" />
              <Button 
                size="sm" 
                variant="secondary"
                @click="openMaputnik"
              >
                Edit in Maputnik
              </Button>
            </FormField>
            
            <!-- API Key Selection -->
            <FormField label="API Provider">
              <Select v-model="selectedProvider">
                <option value="maptiler">MapTiler</option>
                <option value="clockwork">Clockwork Micro</option>
                <option value="custom">Custom</option>
              </Select>
            </FormField>
          </section>
          
          <!-- Layer Configuration -->
          <section class="panel-section">
            <h3>Layers</h3>
            <LayerList 
              v-model="config.layers"
              @add="addLayer"
              @remove="removeLayer"
              @reorder="reorderLayers"
            />
          </section>
        </div>
      </template>
      
      <!-- Right Panel: Map Preview -->
      <template #pane2>
        <div class="preview-panel">
          <!-- Preview Controls -->
          <div class="preview-controls">
            <ButtonGroup>
              <Button 
                icon="refresh" 
                @click="refreshPreview"
                title="Refresh"
              />
              <Button 
                icon="maximize" 
                @click="fullscreen"
                title="Fullscreen"
              />
              <Button 
                icon="download" 
                @click="exportConfig"
                title="Export"
              />
            </ButtonGroup>
            
            <div class="zoom-controls">
              <span>Zoom: {{ currentZoom }}</span>
              <span>{{ currentCoords }}</span>
            </div>
          </div>
          
          <!-- Map Canvas -->
          <div ref="mapContainer" class="map-canvas" />
          
          <!-- Style Inspector -->
          <div v-if="showInspector" class="style-inspector">
            <pre>{{ currentStyle }}</pre>
          </div>
        </div>
      </template>
    </SplitPane>
    
    <!-- Action Bar -->
    <div class="action-bar">
      <Button variant="secondary" @click="cancel">Cancel</Button>
      <Button variant="secondary" @click="saveAsDraft">Save as Draft</Button>
      <Button variant="primary" @click="saveAndPublish">Save & Publish</Button>
    </div>
  </div>
</template>
```

#### 4.2.3 Map Card Component
```vue
<template>
  <div class="map-card">
    <!-- Map Thumbnail -->
    <div class="map-thumbnail">
      <img :src="thumbnailUrl" :alt="map.label" />
      <div class="map-badge">
        <Flag :country="map.country" />
        <span>{{ map.type.toUpperCase() }}</span>
      </div>
    </div>
    
    <!-- Map Info -->
    <div class="map-info">
      <h4>{{ map.label }}</h4>
      <p class="map-description">{{ map.description }}</p>
      
      <!-- Meta Info -->
      <div class="map-meta">
        <span class="meta-item">
          <Icon name="layers" size="14" />
          {{ map.layers?.length || 0 }} layers
        </span>
        <span class="meta-item">
          <Icon name="clock" size="14" />
          {{ formatDate(map.updatedAt) }}
        </span>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="map-actions">
      <IconButton icon="edit" @click="$emit('edit', map)" title="Edit" />
      <IconButton icon="eye" @click="$emit('preview', map)" title="Preview" />
      <IconButton icon="copy" @click="$emit('duplicate', map)" title="Duplicate Configuration" />
      <Dropdown>
        <IconButton icon="more-vertical" />
        <template #menu>
          <MenuItem @click="duplicateWithEdits">Duplicate & Edit</MenuItem>
          <MenuItem @click="cloneToCountry">Clone to Another Country</MenuItem>
          <MenuItem @click="exportJSON">Export JSON</MenuItem>
          <MenuItem @click="openInMaputnik">Open in Maputnik</MenuItem>
          <MenuItem @click="viewHistory">View History</MenuItem>
          <MenuItem @click="createTemplate">Save as Template</MenuItem>
          <MenuItem danger @click="$emit('delete', map)">Delete</MenuItem>
        </template>
      </Dropdown>
    </div>
  </div>
</template>
```

#### 4.2.4 Configuration Duplication Dialog
```vue
<template>
  <Dialog v-model:visible="showDuplicateDialog" modal header="Duplicate Configuration">
    <div class="duplicate-dialog">
      <!-- Source Selection -->
      <section class="dialog-section">
        <h4>Select Configuration to Copy</h4>
        <div class="config-selector">
          <Select 
            v-model="selectedConfig" 
            :options="availableConfigs"
            filter
            optionLabel="label"
            placeholder="Choose a configuration..."
          >
            <template #option="{ option }">
              <div class="config-option">
                <Flag :country="option.country" />
                <span>{{ option.label }}</span>
                <Badge>{{ option.type }}</Badge>
              </div>
            </template>
          </Select>
        </div>
        
        <!-- Quick Preview -->
        <div v-if="selectedConfig" class="config-preview">
          <img :src="getPreviewUrl(selectedConfig)" />
          <div class="preview-info">
            <p>{{ selectedConfig.layers?.length || 0 }} layers</p>
            <p>Last updated: {{ formatDate(selectedConfig.updatedAt) }}</p>
          </div>
        </div>
      </section>
      
      <!-- Duplication Options -->
      <section class="dialog-section">
        <h4>Duplication Options</h4>
        <div class="duplication-options">
          <RadioGroup v-model="duplicationType">
            <div class="option-item">
              <Radio value="exact" />
              <div>
                <label>Exact Copy</label>
                <p class="text-sm text-gray-600">Create identical configuration with new name</p>
              </div>
            </div>
            
            <div class="option-item">
              <Radio value="country" />
              <div>
                <label>Copy to Different Country</label>
                <p class="text-sm text-gray-600">Adapt configuration for another region</p>
                <Select 
                  v-if="duplicationType === 'country'"
                  v-model="targetCountry"
                  :options="countries"
                  placeholder="Select target country..."
                  class="mt-2"
                />
              </div>
            </div>
            
            <div class="option-item">
              <Radio value="template" />
              <div>
                <label>Use as Template</label>
                <p class="text-sm text-gray-600">Copy structure but clear specific values</p>
              </div>
            </div>
            
            <div class="option-item">
              <Radio value="merge" />
              <div>
                <label>Merge with Existing</label>
                <p class="text-sm text-gray-600">Combine layers from multiple configs</p>
                <MultiSelect 
                  v-if="duplicationType === 'merge'"
                  v-model="mergeConfigs"
                  :options="availableConfigs"
                  optionLabel="label"
                  placeholder="Select configs to merge..."
                  class="mt-2"
                />
              </div>
            </div>
          </RadioGroup>
        </div>
      </section>
      
      <!-- New Configuration Details -->
      <section class="dialog-section">
        <h4>New Configuration Details</h4>
        <div class="form-grid">
          <FormField label="Name" required>
            <Input 
              v-model="newConfig.name" 
              :placeholder="suggestedName"
            />
          </FormField>
          
          <FormField label="Label" required>
            <Input 
              v-model="newConfig.label"
              :placeholder="suggestedLabel"
            />
          </FormField>
          
          <FormField label="Description">
            <Textarea 
              v-model="newConfig.description"
              rows="3"
              placeholder="Optional description..."
            />
          </FormField>
          
          <!-- Advanced Options -->
          <Accordion>
            <AccordionPanel header="Advanced Options">
              <div class="advanced-options">
                <Checkbox v-model="options.copyApiKeys" label="Copy API key associations" />
                <Checkbox v-model="options.copyPermissions" label="Copy access permissions" />
                <Checkbox v-model="options.copyTags" label="Copy tags and metadata" />
                <Checkbox v-model="options.createBackup" label="Create backup of original" />
              </div>
            </AccordionPanel>
          </Accordion>
        </div>
      </section>
    </div>
    
    <!-- Dialog Actions -->
    <template #footer>
      <Button label="Cancel" @click="closeDuplicateDialog" text />
      <Button label="Preview" @click="previewDuplicate" severity="secondary" />
      <Button label="Create Copy" @click="executeDuplicate" :loading="isCreating" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useConfigStore } from '@/stores/config';
import { useToast } from 'primevue/usetoast';

const configStore = useConfigStore();
const toast = useToast();

const showDuplicateDialog = ref(false);
const selectedConfig = ref(null);
const duplicationType = ref('exact');
const targetCountry = ref('');
const mergeConfigs = ref([]);
const isCreating = ref(false);

const newConfig = ref({
  name: '',
  label: '',
  description: ''
});

const options = ref({
  copyApiKeys: true,
  copyPermissions: false,
  copyTags: true,
  createBackup: false
});

// Generate suggested names based on duplication type
const suggestedName = computed(() => {
  if (!selectedConfig.value) return '';
  
  const base = selectedConfig.value.name;
  switch (duplicationType.value) {
    case 'exact':
      return `${base}_copy`;
    case 'country':
      return `${base}_${targetCountry.value?.toLowerCase()}`;
    case 'template':
      return `${base}_template`;
    case 'merge':
      return `${base}_merged`;
    default:
      return base;
  }
});

const suggestedLabel = computed(() => {
  if (!selectedConfig.value) return '';
  
  const base = selectedConfig.value.label;
  switch (duplicationType.value) {
    case 'exact':
      return `${base} (Copy)`;
    case 'country':
      return `${base} - ${targetCountry.value}`;
    case 'template':
      return `${base} Template`;
    case 'merge':
      return `${base} Merged`;
    default:
      return base;
  }
});

// Auto-fill suggested names when not manually edited
watch([suggestedName, suggestedLabel], () => {
  if (!newConfig.value.name) {
    newConfig.value.name = suggestedName.value;
  }
  if (!newConfig.value.label) {
    newConfig.value.label = suggestedLabel.value;
  }
});

async function executeDuplicate() {
  isCreating.value = true;
  
  try {
    const duplicatedConfig = await configStore.duplicateConfiguration({
      sourceId: selectedConfig.value.id,
      type: duplicationType.value,
      newName: newConfig.value.name,
      newLabel: newConfig.value.label,
      description: newConfig.value.description,
      targetCountry: targetCountry.value,
      mergeConfigs: mergeConfigs.value.map(c => c.id),
      options: options.value
    });
    
    toast.add({
      severity: 'success',
      summary: 'Configuration Duplicated',
      detail: `Successfully created ${newConfig.value.label}`,
      life: 3000
    });
    
    // Navigate to edit the new configuration
    await router.push(`/config/${duplicatedConfig.id}/edit`);
    
    closeDuplicateDialog();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Duplication Failed',
      detail: error.message,
      life: 5000
    });
  } finally {
    isCreating.value = false;
  }
}

function previewDuplicate() {
  // Open preview modal with the configuration that would be created
  // This allows users to see the result before committing
}

function closeDuplicateDialog() {
  showDuplicateDialog.value = false;
  // Reset form
  selectedConfig.value = null;
  duplicationType.value = 'exact';
  newConfig.value = { name: '', label: '', description: '' };
  options.value = {
    copyApiKeys: true,
    copyPermissions: false,
    copyTags: true,
    createBackup: false
  };
}
</script>
```

### 4.3 Responsive Design

```scss
// Breakpoints
$breakpoints: (
  'sm': 640px,   // Mobile landscape
  'md': 768px,   // Tablet
  'lg': 1024px,  // Desktop
  'xl': 1280px,  // Large desktop
  '2xl': 1536px  // Extra large
);

// Grid System
.map-grid {
  display: grid;
  gap: 1.5rem;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 5. Backend Services

### 5.1 API Endpoints

#### Configuration Management
```typescript
// GET /api/config
// List all configurations with filtering
interface ListConfigRequest {
  country?: string;
  type?: 'vtc' | 'wmts' | 'wms';
  search?: string;
  page?: number;
  limit?: number;
}

// GET /api/config/:id
// Get single configuration
interface GetConfigResponse {
  id: string;
  name: string;
  style: string;  // Proxied URL without keys
  label: string;
  type: string;
  country: string;
  flag: string;
  layers?: Layer[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

// POST /api/config
// Create new configuration
interface CreateConfigRequest {
  name: string;
  style: string;
  label: string;
  type: 'vtc' | 'wmts' | 'wms';
  country: string;
  flag?: string;
  layers?: Layer[];
  metadata?: Record<string, any>;
}

// PUT /api/config/:id
// Update configuration
interface UpdateConfigRequest extends Partial<CreateConfigRequest> {
  version: number; // For optimistic locking
}

// DELETE /api/config/:id
// Delete configuration

// POST /api/config/duplicate
// Duplicate an existing configuration
interface DuplicateConfigRequest {
  sourceId: string;
  type: 'exact' | 'country' | 'template' | 'merge';
  newName: string;
  newLabel: string;
  description?: string;
  targetCountry?: string;
  mergeConfigs?: string[];
  options: {
    copyApiKeys: boolean;
    copyPermissions: boolean;
    copyTags: boolean;
    createBackup: boolean;
  };
}

// POST /api/config/bulk-duplicate
// Duplicate multiple configurations at once
interface BulkDuplicateRequest {
  sourceIds: string[];
  prefix?: string;
  suffix?: string;
  targetCountry?: string;
}
```

#### Style Proxy Service
```typescript
// POST /api/proxy/style
// Proxy style.json requests with API keys
interface ProxyStyleRequest {
  styleUrl: string;
  configId?: string; // For analytics
}

interface ProxyStyleResponse {
  style: any; // Mapbox/MapLibre style spec
  cached: boolean;
  ttl: number;
}

// Service Implementation
export class StyleProxyService {
  private cache: KVNamespace;
  private providers: Map<string, ApiProvider>;
  
  async proxyStyle(url: string): Promise<any> {
    // Check cache first
    const cacheKey = this.getCacheKey(url);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Identify provider and inject key
    const provider = this.identifyProvider(url);
    const apiKey = await this.getApiKey(provider);
    const proxiedUrl = this.injectApiKey(url, apiKey);
    
    // Fetch and process
    const response = await fetch(proxiedUrl);
    let style = await response.json();
    
    // Recursively proxy nested resources
    style = await this.proxyNestedResources(style);
    
    // Clean any exposed keys
    style = this.sanitizeStyle(style);
    
    // Cache the result
    await this.cache.put(cacheKey, JSON.stringify(style), {
      expirationTtl: 3600
    });
    
    return style;
  }
  
  private async proxyNestedResources(style: any): Promise<any> {
    // Proxy sprite URLs
    if (style.sprite) {
      style.sprite = await this.proxyResourceUrl(style.sprite);
    }
    
    // Proxy glyphs
    if (style.glyphs) {
      style.glyphs = await this.proxyResourceUrl(style.glyphs);
    }
    
    // Proxy source tiles
    if (style.sources) {
      for (const source of Object.values(style.sources)) {
        if (source.tiles) {
          source.tiles = source.tiles.map(url => 
            this.proxyResourceUrl(url)
          );
        }
      }
    }
    
    return style;
  }
}
```

### 5.2 GitHub Integration

```typescript
// GitHub Sync Service
export class GitHubSyncService {
  private octokit: Octokit;
  
  async syncConfiguration(config: MapConfig): Promise<void> {
    const path = `configs/${config.name}.json`;
    
    // Get current file (if exists)
    const currentFile = await this.getFile(path);
    
    // Create commit
    await this.octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
      message: `Update ${config.name} configuration`,
      content: Base64.encode(JSON.stringify(config, null, 2)),
      sha: currentFile?.sha,
      branch: 'main'
    });
    
    // Create PR if on feature branch
    if (this.isFeatureBranch()) {
      await this.createPullRequest(config);
    }
  }
  
  async importFromGitHub(path: string): Promise<MapConfig[]> {
    const response = await this.octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path
    });
    
    if (Array.isArray(response.data)) {
      return Promise.all(
        response.data
          .filter(file => file.name.endsWith('.json'))
          .map(file => this.fetchAndParseConfig(file))
      );
    }
    
    return [];
  }
}
```

### 5.3 Configuration Duplication Service

```typescript
// Configuration Duplication Service
export class ConfigDuplicationService {
  constructor(
    private db: Database,
    private cache: CacheManager
  ) {}
  
  async duplicateConfiguration(request: DuplicateConfigRequest): Promise<MapConfig> {
    // Fetch source configuration
    const source = await this.db.getConfig(request.sourceId);
    if (!source) {
      throw new Error('Source configuration not found');
    }
    
    // Create new configuration based on duplication type
    let newConfig: Partial<MapConfig>;
    
    switch (request.type) {
      case 'exact':
        newConfig = this.createExactCopy(source, request);
        break;
        
      case 'country':
        newConfig = this.adaptForCountry(source, request);
        break;
        
      case 'template':
        newConfig = this.createTemplate(source, request);
        break;
        
      case 'merge':
        newConfig = await this.mergeConfigurations(source, request);
        break;
        
      default:
        throw new Error(`Invalid duplication type: ${request.type}`);
    }
    
    // Apply common properties
    newConfig.name = request.newName;
    newConfig.label = request.newLabel;
    newConfig.description = request.description;
    newConfig.createdAt = new Date().toISOString();
    newConfig.updatedAt = new Date().toISOString();
    newConfig.version = 1;
    
    // Handle options
    if (!request.options.copyApiKeys) {
      delete newConfig.apiProvider;
    }
    
    if (!request.options.copyPermissions) {
      newConfig.permissions = this.getDefaultPermissions();
    }
    
    if (!request.options.copyTags) {
      newConfig.tags = [];
    }
    
    // Create backup if requested
    if (request.options.createBackup) {
      await this.createBackup(source);
    }
    
    // Save to database
    const created = await this.db.createConfig(newConfig as CreateConfigRequest);
    
    // Invalidate cache
    await this.cache.invalidate('configs:list');
    
    // Log the duplication
    await this.db.logAudit({
      action: 'CONFIG_DUPLICATED',
      resourceType: 'config',
      resourceId: created.id,
      metadata: {
        sourceId: request.sourceId,
        type: request.type
      }
    });
    
    return created;
  }
  
  private createExactCopy(source: MapConfig, request: DuplicateConfigRequest): Partial<MapConfig> {
    // Deep clone the source configuration
    const copy = JSON.parse(JSON.stringify(source));
    
    // Remove unique identifiers
    delete copy.id;
    delete copy.createdAt;
    delete copy.updatedAt;
    delete copy.createdBy;
    delete copy.updatedBy;
    
    return copy;
  }
  
  private adaptForCountry(source: MapConfig, request: DuplicateConfigRequest): Partial<MapConfig> {
    const adapted = this.createExactCopy(source, request);
    
    // Update country-specific fields
    adapted.country = request.targetCountry;
    adapted.flag = this.getFlagForCountry(request.targetCountry);
    
    // Adapt style URLs if needed
    if (adapted.style) {
      adapted.style = this.adaptStyleForCountry(adapted.style, request.targetCountry);
    }
    
    // Filter layers based on country availability
    if (adapted.layers) {
      adapted.layers = this.filterLayersForCountry(adapted.layers, request.targetCountry);
    }
    
    return adapted;
  }
  
  private createTemplate(source: MapConfig, request: DuplicateConfigRequest): Partial<MapConfig> {
    // Keep structure but clear specific values
    return {
      type: source.type,
      country: source.country,
      flag: source.flag,
      layers: source.layers?.map(layer => ({
        ...layer,
        // Clear layer-specific data but keep structure
        source: '',
        tiles: [],
        url: ''
      })),
      metadata: {
        templateSource: source.id,
        templateCreated: new Date().toISOString()
      }
    };
  }
  
  private async mergeConfigurations(
    primary: MapConfig, 
    request: DuplicateConfigRequest
  ): Promise<Partial<MapConfig>> {
    const merged = this.createExactCopy(primary, request);
    
    // Fetch configurations to merge
    const configs = await Promise.all(
      request.mergeConfigs.map(id => this.db.getConfig(id))
    );
    
    // Merge layers (avoiding duplicates)
    const allLayers = new Map();
    
    // Add primary layers first (they have priority)
    primary.layers?.forEach(layer => {
      allLayers.set(layer.id || layer.name, layer);
    });
    
    // Add layers from other configs
    configs.forEach(config => {
      config.layers?.forEach(layer => {
        const key = layer.id || layer.name;
        if (!allLayers.has(key)) {
          allLayers.set(key, layer);
        }
      });
    });
    
    merged.layers = Array.from(allLayers.values());
    
    // Merge metadata
    merged.metadata = {
      ...merged.metadata,
      mergedFrom: [primary.id, ...request.mergeConfigs],
      mergeDate: new Date().toISOString()
    };
    
    return merged;
  }
  
  async bulkDuplicate(request: BulkDuplicateRequest): Promise<MapConfig[]> {
    const results = [];
    
    for (const sourceId of request.sourceIds) {
      const source = await this.db.getConfig(sourceId);
      if (!source) continue;
      
      const newName = `${request.prefix || ''}${source.name}${request.suffix || ''}`;
      const newLabel = `${request.prefix || ''}${source.label}${request.suffix || ''}`;
      
      const duplicated = await this.duplicateConfiguration({
        sourceId,
        type: request.targetCountry ? 'country' : 'exact',
        newName,
        newLabel,
        targetCountry: request.targetCountry,
        options: {
          copyApiKeys: true,
          copyPermissions: false,
          copyTags: true,
          createBackup: false
        }
      });
      
      results.push(duplicated);
    }
    
    return results;
  }
  
  private getFlagForCountry(country: string): string {
    const flags = {
      'Austria': '🇦🇹',
      'Germany': '🇩🇪',
      'Switzerland': '🇨🇭',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'Netherlands': '🇳🇱',
      'Belgium': '🇧🇪',
      'Luxembourg': '🇱🇺',
      'United Kingdom': '🇬🇧',
      'USA': '🇺🇸',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'New Zealand': '🇳🇿',
      'Global': '🌐'
    };
    
    return flags[country] || '🌐';
  }
}
```

### 5.4 Maputnik Integration

```typescript
// Maputnik Bridge Service
export class MaputnikBridge {
  async openInMaputnik(config: MapConfig): Promise<string> {
    // Generate temporary token for style access
    const token = await this.generateTempToken(config.id);
    
    // Create proxied style URL
    const styleUrl = `${process.env.API_URL}/api/proxy/style?token=${token}`;
    
    // Generate Maputnik URL
    const maputnikUrl = new URL('https://maputnik.github.io/editor');
    maputnikUrl.searchParams.set('style', styleUrl);
    
    return maputnikUrl.toString();
  }
  
  async importFromMaputnik(styleJson: any): Promise<MapConfig> {
    // Validate style
    const validation = await this.validateStyle(styleJson);
    if (!validation.valid) {
      throw new Error(`Invalid style: ${validation.errors.join(', ')}`);
    }
    
    // Extract metadata
    const metadata = this.extractMetadata(styleJson);
    
    // Create config
    return {
      name: metadata.name || 'Imported Style',
      style: styleJson,
      label: metadata.name,
      type: this.detectType(styleJson),
      country: 'Global',
      flag: '🌐',
      layers: this.extractLayers(styleJson)
    };
  }
}
```

---

## 6. Database Schema

### 6.1 PostgreSQL Schema (Supabase)

```sql
-- Maps configuration table
CREATE TABLE map_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('vtc', 'wmts', 'wms')),
  style_url TEXT,
  style_json JSONB,
  country VARCHAR(100) DEFAULT 'Global',
  flag VARCHAR(10) DEFAULT '🌐',
  layers JSONB,
  metadata JSONB,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_map_configs_country ON map_configs(country);
CREATE INDEX idx_map_configs_type ON map_configs(type);
CREATE INDEX idx_map_configs_active ON map_configs(is_active);
CREATE INDEX idx_map_configs_name ON map_configs(name);

-- Version history table
CREATE TABLE map_config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES map_configs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  data JSONB NOT NULL,
  change_summary TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(config_id, version)
);

-- API keys table (encrypted)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(100) NOT NULL,
  key_name VARCHAR(255) NOT NULL,
  encrypted_key TEXT NOT NULL,
  domains TEXT[],
  rate_limit INTEGER,
  usage_count BIGINT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'editor',
  two_factor_secret TEXT,
  two_factor_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics table
CREATE TABLE api_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES map_configs(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics partitions by month
CREATE TABLE api_analytics_y2024m01 PARTITION OF api_analytics
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 6.2 Cache Schema (Vercel KV)

```typescript
// Cache key patterns
interface CacheKeys {
  // Style cache
  style: `style:${string}`;           // style:styleUrl
  
  // Config cache
  config: `config:${string}`;         // config:configId
  configs: 'configs:list';            // List of all configs
  
  // Session cache
  session: `session:${string}`;       // session:sessionId
  
  // Rate limiting
  rateLimit: `rate:${string}`;        // rate:ip:endpoint
}

// Cache TTLs (in seconds)
const CACHE_TTL = {
  style: 3600,        // 1 hour
  config: 300,        // 5 minutes
  configs: 60,        // 1 minute
  session: 86400,     // 24 hours
  rateLimit: 60       // 1 minute
};
```

---

## 7. API Design

### 7.1 RESTful API Structure

```yaml
openapi: 3.0.0
info:
  title: Map Configuration API
  version: 1.0.0
  
paths:
  /api/config:
    get:
      summary: List all map configurations
      parameters:
        - name: country
          in: query
          schema:
            type: string
        - name: type
          in: query
          schema:
            type: string
            enum: [vtc, wmts, wms]
        - name: search
          in: query
          schema:
            type: string
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        200:
          description: List of configurations
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/MapConfig'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
    
    post:
      summary: Create new configuration
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateMapConfig'
      responses:
        201:
          description: Configuration created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MapConfig'
  
  /api/config/{id}:
    get:
      summary: Get single configuration
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Configuration details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MapConfig'
    
    put:
      summary: Update configuration
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateMapConfig'
      responses:
        200:
          description: Configuration updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MapConfig'
    
    delete:
      summary: Delete configuration
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        204:
          description: Configuration deleted
  
  /api/proxy/style:
    post:
      summary: Proxy style.json with injected API keys
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                styleUrl:
                  type: string
                configId:
                  type: string
      responses:
        200:
          description: Proxied style
          content:
            application/json:
              schema:
                type: object
  
  /api/auth/login:
    post:
      summary: User login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
                totp:
                  type: string
      responses:
        200:
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                  refreshToken:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'

components:
  schemas:
    MapConfig:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        label:
          type: string
        type:
          type: string
          enum: [vtc, wmts, wms]
        style:
          type: string
        country:
          type: string
        flag:
          type: string
        layers:
          type: array
          items:
            $ref: '#/components/schemas/Layer'
        metadata:
          type: object
        version:
          type: integer
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
    
    Layer:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        type:
          type: string
        source:
          type: string
        visible:
          type: boolean
        minzoom:
          type: number
        maxzoom:
          type: number
        paint:
          type: object
        layout:
          type: object
```

### 7.2 GraphQL Alternative (Optional)

```graphql
type Query {
  configs(
    country: String
    type: ConfigType
    search: String
    page: Int
    limit: Int
  ): ConfigConnection!
  
  config(id: ID!): MapConfig
  
  configVersions(configId: ID!): [ConfigVersion!]!
  
  analytics(
    configId: ID
    startDate: DateTime!
    endDate: DateTime!
  ): AnalyticsData!
}

type Mutation {
  createConfig(input: CreateConfigInput!): MapConfig!
  updateConfig(id: ID!, input: UpdateConfigInput!): MapConfig!
  deleteConfig(id: ID!): Boolean!
  
  duplicateConfig(id: ID!): MapConfig!
  publishConfig(id: ID!): MapConfig!
  revertConfig(id: ID!, version: Int!): MapConfig!
  
  login(email: String!, password: String!, totp: String): AuthPayload!
  logout: Boolean!
  refreshToken(token: String!): AuthPayload!
}

type Subscription {
  configUpdated(id: ID!): MapConfig!
  analyticsUpdate(configId: ID!): AnalyticsEvent!
}

type MapConfig {
  id: ID!
  name: String!
  label: String!
  type: ConfigType!
  style: String!
  country: String!
  flag: String!
  layers: [Layer!]
  metadata: JSON
  version: Int!
  isActive: Boolean!
  createdBy: User
  updatedBy: User
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # Computed fields
  thumbnail: String!
  analytics: AnalyticsData!
  versions: [ConfigVersion!]!
}

enum ConfigType {
  VTC
  WMTS
  WMS
}
```

---

## 8. Development Phases

### Phase 1: Foundation (Week 1-2)

#### 1.1 Project Setup
- [ ] Initialize monorepo with Turborepo
- [ ] Configure Vue 3 + Vite + TypeScript
- [ ] Setup Vercel project and environment
- [ ] Configure ESLint, Prettier, Husky
- [ ] Setup GitHub repository and CI/CD

#### 1.2 Database Setup
- [ ] Create Supabase project
- [ ] Design and implement database schema
- [ ] Setup migrations and seed data
- [ ] Configure Vercel KV for caching
- [ ] Implement connection pooling

#### 1.3 Authentication System
- [ ] Implement JWT authentication
- [ ] Create login/logout endpoints
- [ ] Setup password hashing (Argon2)
- [ ] Implement refresh token rotation
- [ ] Add 2FA support (optional)

### Phase 2: Core Backend (Week 2-3)

#### 2.1 Configuration API
- [ ] Create CRUD endpoints for configs
- [ ] Implement validation middleware
- [ ] Add versioning support
- [ ] Setup audit logging
- [ ] Implement search and filtering

#### 2.2 Style Proxy Service
- [ ] Create proxy endpoint
- [ ] Implement API key injection
- [ ] Add response sanitization
- [ ] Setup caching layer
- [ ] Handle nested resource proxying

#### 2.3 GitHub Integration
- [ ] Setup GitHub OAuth app
- [ ] Implement sync service
- [ ] Create webhook handlers
- [ ] Add import/export functionality
- [ ] Setup branch protection

### Phase 3: Frontend Foundation (Week 3-4)

#### 3.1 UI Framework Setup
- [ ] Configure Tailwind CSS
- [ ] Setup PrimeVue components
- [ ] Create design system tokens
- [ ] Implement dark mode support
- [ ] Setup responsive grid system

#### 3.2 State Management
- [ ] Setup Pinia stores
- [ ] Implement auth store
- [ ] Create config store
- [ ] Add UI state management
- [ ] Setup persistence plugin

#### 3.3 Routing & Navigation
- [ ] Configure Vue Router
- [ ] Implement route guards
- [ ] Create navigation components
- [ ] Add breadcrumbs
- [ ] Setup lazy loading

### Phase 4: Map Configuration UI (Week 4-5)

#### 4.1 Dashboard
- [ ] Create dashboard layout
- [ ] Implement config grid/list view
- [ ] Add search and filters
- [ ] Create statistics cards
- [ ] Implement pagination

#### 4.2 Map Editor
- [ ] Create editor layout
- [ ] Implement form components
- [ ] Add MapLibre preview
- [ ] Create layer manager
- [ ] Add validation feedback

#### 4.3 Map Preview
- [ ] Setup MapLibre GL JS
- [ ] Implement real-time preview
- [ ] Add zoom/pan controls
- [ ] Create style inspector
- [ ] Add fullscreen mode

### Phase 5: Advanced Features (Week 5-6)

#### 5.1 Maputnik Integration
- [ ] Create Maputnik bridge
- [ ] Implement style import/export
- [ ] Add deep linking support
- [ ] Create sync mechanism
- [ ] Handle authentication

#### 5.2 Version Control
- [ ] Implement version history UI
- [ ] Add diff visualization
- [ ] Create rollback mechanism
- [ ] Add change descriptions
- [ ] Implement branching

#### 5.3 Analytics & Monitoring
- [ ] Setup analytics collection
- [ ] Create dashboard widgets
- [ ] Implement usage tracking
- [ ] Add performance metrics
- [ ] Setup error tracking (Sentry)

### Phase 6: Optimization & Testing (Week 6-7)

#### 6.1 Performance Optimization
- [ ] Implement code splitting
- [ ] Add service worker
- [ ] Optimize bundle size
- [ ] Setup CDN for assets
- [ ] Implement virtual scrolling

#### 6.2 Testing
- [ ] Write unit tests (Vitest)
- [ ] Create integration tests
- [ ] Add E2E tests (Playwright)
- [ ] Setup visual regression tests
- [ ] Implement load testing

#### 6.3 Security Hardening
- [ ] Security audit
- [ ] Implement rate limiting
- [ ] Add CORS configuration
- [ ] Setup CSP headers
- [ ] Penetration testing

### Phase 7: Deployment & Documentation (Week 7-8)

#### 7.1 Deployment
- [ ] Configure production environment
- [ ] Setup domain and SSL
- [ ] Implement blue-green deployment
- [ ] Configure monitoring
- [ ] Setup backup strategy

#### 7.2 Documentation
- [ ] Write API documentation
- [ ] Create user guide
- [ ] Add inline help
- [ ] Create video tutorials
- [ ] Setup knowledge base

#### 7.3 Launch Preparation
- [ ] User acceptance testing
- [ ] Performance benchmarking
- [ ] Create migration scripts
- [ ] Setup support channels
- [ ] Launch announcement

---

## 9. Deployment Strategy

### 9.1 Infrastructure Setup

```mermaid
graph TB
    subgraph "Vercel Platform"
        VD[Vercel Deployment]
        EF[Edge Functions]
        KV[Vercel KV Cache]
        BS[Blob Storage]
    end
    
    subgraph "External Services"
        SB[Supabase DB]
        GH[GitHub Repo]
        S3[AWS S3 Backup]
    end
    
    subgraph "CDN"
        CF[Cloudflare]
        ASSETS[Static Assets]
    end
    
    VD --> EF
    EF --> KV
    EF --> SB
    VD --> BS
    VD --> CF
    CF --> ASSETS
    SB --> S3
    EF --> GH
```

### 9.2 Environment Configuration

```typescript
// .env.production
// Database
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/mapconfig
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

// API Keys (Encrypted in DB, backup in env)
MAPTILER_API_KEY=encrypted:...
CLOCKWORK_API_KEY=encrypted:...
BEV_API_KEY=encrypted:...
IGN_API_KEY=encrypted:...

// GitHub Integration
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
GITHUB_WEBHOOK_SECRET=webhook_secret_123

// Authentication
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
SESSION_SECRET=your-session-secret

// Services
VERCEL_KV_URL=redis://...
SENTRY_DSN=https://...@sentry.io/...
ANALYTICS_ID=G-XXXXXXXXXX

// Feature Flags
ENABLE_GITHUB_SYNC=true
ENABLE_MAPUTNIK=true
ENABLE_2FA=true
ENABLE_ANALYTICS=true
```

### 9.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm run lint
      - run: pnpm run type-check
      - run: pnpm run test:unit
      - run: pnpm run test:e2e
      - run: pnpm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/actions/cli@v1
        with:
          args: deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  
  lighthouse:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://mapconfig.yourdomain.com
            https://mapconfig.yourdomain.com/editor
          uploadArtifacts: true
          temporaryPublicStorage: true
```

### 9.4 Monitoring & Alerts

```typescript
// monitoring/config.ts
export const monitoringConfig = {
  // Vercel Analytics
  analytics: {
    enabled: true,
    sampleRate: 1.0,
    excludePaths: ['/api/health', '/api/metrics']
  },
  
  // Sentry Error Tracking
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV,
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay()
    ]
  },
  
  // Custom Metrics
  metrics: {
    apiLatency: {
      threshold: 500, // ms
      alert: true
    },
    cacheHitRate: {
      threshold: 0.8, // 80%
      alert: true
    },
    errorRate: {
      threshold: 0.01, // 1%
      alert: true
    }
  },
  
  // Uptime Monitoring
  uptime: {
    endpoints: [
      { url: '/api/health', interval: 60 },
      { url: '/api/config', interval: 300 }
    ],
    notifications: {
      email: ['admin@yourdomain.com'],
      slack: process.env.SLACK_WEBHOOK_URL
    }
  }
};
```

---

## 10. Performance Optimization

### 10.1 Frontend Optimization

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    // Auto-import components
    Components({
      resolvers: [PrimeVueResolver()]
    }),
    // PWA Support
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.maptiler\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'maptiler-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 3600 // 1 hour
              }
            }
          }
        ]
      }
    }),
    // Compression
    compression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ],
  
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia', 'vue-router'],
          'ui': ['primevue', '@headlessui/vue'],
          'map': ['maplibre-gl'],
          'utils': ['axios', 'date-fns', 'zod']
        }
      }
    },
    
    // Tree shaking
    treeShaking: true,
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### 10.2 Backend Optimization

```typescript
// Edge Function Optimization
export const config = {
  runtime: 'edge',
  regions: ['iad1', 'cdg1', 'hnd1'], // Multi-region deployment
};

// Caching Strategy
class CacheManager {
  private strategies = {
    // Aggressive caching for static configs
    static: {
      ttl: 86400,      // 24 hours
      staleWhileRevalidate: 604800 // 7 days
    },
    
    // Moderate caching for dynamic data
    dynamic: {
      ttl: 300,        // 5 minutes
      staleWhileRevalidate: 600 // 10 minutes
    },
    
    // Short caching for real-time data
    realtime: {
      ttl: 10,         // 10 seconds
      staleWhileRevalidate: 30 // 30 seconds
    }
  };
  
  async get(key: string, fetcher: () => Promise<any>, strategy: keyof typeof this.strategies) {
    const cached = await kv.get(key);
    
    if (cached) {
      // Return cached and revalidate in background
      if (this.shouldRevalidate(cached, strategy)) {
        this.revalidateInBackground(key, fetcher, strategy);
      }
      return cached.data;
    }
    
    // Fetch and cache
    const data = await fetcher();
    await this.set(key, data, strategy);
    return data;
  }
}

// Database Query Optimization
class OptimizedQueries {
  // Use materialized views for complex queries
  async getConfigsWithStats() {
    return sql`
      SELECT 
        c.*,
        cs.view_count,
        cs.last_accessed,
        cs.avg_response_time
      FROM map_configs c
      LEFT JOIN config_stats_mv cs ON c.id = cs.config_id
      WHERE c.is_active = true
      ORDER BY cs.view_count DESC
    `;
  }
  
  // Use connection pooling
  private pool = new Pool({
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}
```

### 10.3 Map Rendering Optimization

```typescript
// MapLibre Optimization
class MapOptimizer {
  optimizeStyle(style: any): any {
    return {
      ...style,
      
      // Reduce initial tile load
      center: [0, 0],
      zoom: 2,
      
      // Optimize rendering
      fadeDuration: 300,
      crossSourceCollisions: false,
      
      // Simplify layers at low zoom
      layers: style.layers.map(layer => ({
        ...layer,
        minzoom: this.calculateOptimalMinZoom(layer),
        maxzoom: this.calculateOptimalMaxZoom(layer)
      })),
      
      // Use lower resolution tiles for preview
      sources: this.optimizeSources(style.sources)
    };
  }
  
  private optimizeSources(sources: any): any {
    const optimized = {};
    
    for (const [id, source] of Object.entries(sources)) {
      optimized[id] = {
        ...source,
        // Use 256x256 tiles instead of 512x512 for preview
        tileSize: 256,
        // Reduce buffer size
        buffer: 128,
        // Limit tile cache
        maxTileCacheSize: 100
      };
    }
    
    return optimized;
  }
}
```

---

## Implementation Checklist

### Immediate Actions (Day 1)
- [ ] Create GitHub repository
- [ ] Setup Vercel project
- [ ] Initialize Vue 3 project with Vite
- [ ] Configure Supabase database
- [ ] Setup basic CI/CD pipeline

### Week 1 Priorities
- [ ] Implement authentication system
- [ ] Create basic CRUD API for configs
- [ ] Setup style proxy service
- [ ] Build dashboard UI
- [ ] Implement map preview

### Critical Features for MVP
- [ ] Secure API key proxying
- [ ] Configuration management UI
- [ ] Map preview with MapLibre
- [ ] Basic authentication
- [ ] JSON export for mobile apps

### Nice-to-Have Features
- [ ] Maputnik integration
- [ ] GitHub sync
- [ ] Version history
- [ ] Advanced analytics
- [ ] 2FA authentication

---

## Success Metrics

### Technical Metrics
- API response time < 200ms (p95)
- Cache hit rate > 80%
- Zero API key exposure incidents
- 99.9% uptime
- < 3s initial page load

### Business Metrics
- Migration of all existing configs
- Support for 100+ concurrent users
- < 5 minute learning curve
- 90% reduction in config errors
- Complete mobile app compatibility

---

## Risk Mitigation

### Technical Risks
1. **API Key Exposure**
   - Mitigation: Server-side proxy, regular key rotation
   
2. **Performance Issues**
   - Mitigation: Aggressive caching, CDN, edge functions
   
3. **Data Loss**
   - Mitigation: Automated backups, version control
   
4. **Service Outages**
   - Mitigation: Multi-region deployment, failover

### Business Risks
1. **User Adoption**
   - Mitigation: Intuitive UI, comprehensive docs
   
2. **Migration Complexity**
   - Mitigation: Automated import tools, backwards compatibility
   
3. **Scaling Costs**
   - Mitigation: Usage-based pricing, optimization

---

## Conclusion

This comprehensive plan provides a robust, scalable, and secure map configuration service that addresses all requirements while incorporating modern best practices and exceptional user experience. The phased approach ensures steady progress with early deliverables while building toward a feature-complete solution.

The architecture prioritizes security (protecting API keys), performance (edge functions and caching), and developer experience (Vue 3, TypeScript, modern tooling) while maintaining flexibility for future enhancements.

Ready to begin implementation? Start with Phase 1 and iterate based on user feedback and requirements.