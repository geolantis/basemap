# Map Configuration Service - System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Features](#features)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Data Flow](#data-flow)
8. [Component Structure](#component-structure)
9. [Configuration Requirements](#configuration-requirements)
10. [Deployment Architecture](#deployment-architecture)
11. [Development Setup](#development-setup)

## System Overview

The Map Configuration Service is a comprehensive web application for managing geospatial map configurations with AI-powered discovery capabilities. It provides a centralized platform for creating, editing, validating, and organizing map service configurations across multiple providers and map types.

### Core Purpose
- **Configuration Management**: Centralized management of map service configurations (VTC, WMTS, WMS)
- **AI Discovery**: Automated discovery of public map services using Claude AI
- **Validation**: Real-time validation of map service endpoints and configurations
- **Multi-tenancy**: Support for different countries and map providers
- **Integration**: Seamless integration with popular mapping tools like Maputnik

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vue 3 SPA     │    │   Vercel API    │    │   Supabase      │
│   Frontend      │◄──►│   Functions     │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Claude AI     │              │
         └──────────────►│   Integration   │──────────────┘
                        └─────────────────┘
```

### System Architecture Layers

1. **Presentation Layer (Vue.js SPA)**
   - User interface components
   - State management (Pinia)
   - Routing and navigation
   - Real-time data binding

2. **API Layer (Vercel Functions)**
   - Serverless API endpoints
   - Claude AI integration
   - Authentication handling
   - Data validation

3. **Data Layer (Supabase)**
   - PostgreSQL database
   - Real-time subscriptions
   - Row-level security
   - User authentication

4. **External Services**
   - Claude AI API for map discovery
   - Map service endpoints (validation)
   - Third-party map providers

## Technology Stack

### Frontend Technologies
- **Vue.js 3.5.18** - Progressive JavaScript framework with Composition API
- **TypeScript 5.8.3** - Type-safe development
- **Vite 7.1.2** - Fast build tool and dev server
- **Vue Router 4.5.1** - Client-side routing
- **Pinia 3.0.3** - State management
- **Tailwind CSS 4.1.12** - Utility-first CSS framework
- **PrimeVue 4.3.7** - Vue UI component library
- **MapLibre GL 5.7.0** - Interactive map rendering

### Backend Technologies
- **Vercel Functions** - Serverless API endpoints
- **Supabase 2.56.1** - Backend-as-a-Service
- **PostgreSQL** - Primary database
- **Claude AI API** - Map discovery service

### Development Tools
- **Vite** - Development server and build tool
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **ESLint & Prettier** - Code quality and formatting

### Key Libraries
- **@heroicons/vue** - Icon system
- **axios** - HTTP client
- **date-fns** - Date utilities
- **vee-validate** - Form validation
- **zod** - Schema validation

## Features

### 1. Map Configuration Management
- **CRUD Operations**: Create, read, update, delete map configurations
- **Multi-format Support**: Vector tiles (VTC), WMTS, WMS services
- **Metadata Management**: Comprehensive metadata for each configuration
- **Version Control**: Track configuration changes over time

### 2. AI-Powered Map Discovery
- **Natural Language Search**: Search for maps using descriptive queries
- **Claude AI Integration**: Leverages Anthropic's Claude for intelligent discovery
- **Multi-source Discovery**: Searches government portals, open data sources
- **Automatic Validation**: Real-time validation of discovered services

### 3. Interactive Dashboard
- **Statistics Overview**: Total maps, countries, service types
- **Filtering & Search**: Advanced filtering by country, type, status
- **Grid/List Views**: Multiple display modes for configurations
- **Batch Operations**: Bulk operations on multiple configurations

### 4. Map Preview & Validation
- **Live Preview**: Interactive map preview using MapLibre GL
- **Service Validation**: Automatic testing of map service endpoints
- **CORS Testing**: Cross-origin resource sharing validation
- **Format Verification**: Ensure proper tile/service format

### 5. Configuration Editor
- **Visual Editor**: User-friendly configuration editing interface
- **Style Management**: Handle map styles and customization
- **Layer Configuration**: Manage map layers and their properties
- **Export Functionality**: Export configurations in various formats

### 6. Integration Features
- **Maputnik Integration**: Direct integration with Maputnik style editor
- **Export/Import**: Support for standard map configuration formats
- **API Access**: RESTful API for external integrations
- **Webhook Support**: Real-time notifications for configuration changes

## API Endpoints

### Configuration Management
```typescript
// Get all configurations
GET /api/config
Response: { data: MapConfig[], pagination: PaginationInfo }

// Get configuration by ID
GET /api/config/:id
Response: MapConfig

// Create new configuration
POST /api/config
Body: Omit<MapConfig, 'id' | 'createdAt' | 'updatedAt'>
Response: MapConfig

// Update configuration
PUT /api/config/:id
Body: Partial<MapConfig>
Response: MapConfig

// Delete configuration (soft delete)
DELETE /api/config/:id
Response: { success: boolean }

// Duplicate configuration
POST /api/config/duplicate
Body: DuplicateRequest
Response: MapConfig

// Search configurations
GET /api/config/search?q={query}
Response: MapConfig[]
```

### Map Discovery
```typescript
// Search for maps using Claude AI
POST /api/search-maps
Body: {
  query: string,
  maxResults?: number,
  mapTypes?: ('vtc' | 'wmts' | 'wms')[],
  regions?: string[]
}
Response: {
  maps: DiscoveredMap[],
  searchMetadata: {
    query: string,
    timestamp: string,
    sources: string[],
    totalFound: number
  }
}
```

### Validation
```typescript
// Validate map service
POST /api/validate
Body: { url: string, type: 'vtc' | 'wmts' | 'wms' }
Response: ValidationStatus

// Batch validation
POST /api/validate/batch
Body: { urls: string[], type: 'vtc' | 'wmts' | 'wms' }
Response: BatchOperation
```

### Proxy Services
```typescript
// Proxy for style access (CORS handling)
GET /api/proxy/style?url={styleUrl}
Response: MapStyle (JSON)

// Proxy for tile access
GET /api/proxy/tile/{z}/{x}/{y}?url={tileUrl}
Response: Tile data (binary)
```

## Database Schema

### Core Tables

#### `map_configs`
```sql
CREATE TABLE map_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('vtc', 'wmts', 'wms')),
  style TEXT,
  original_style TEXT,
  country VARCHAR(100),
  flag VARCHAR(10),
  layers JSONB,
  metadata JSONB,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `api_keys`
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(100) NOT NULL,
  key_name VARCHAR(255) NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes and Constraints
```sql
-- Performance indexes
CREATE INDEX idx_map_configs_country ON map_configs(country);
CREATE INDEX idx_map_configs_type ON map_configs(type);
CREATE INDEX idx_map_configs_active ON map_configs(is_active);
CREATE INDEX idx_map_configs_name_search ON map_configs USING gin(to_tsvector('english', name || ' ' || label));

-- Audit log indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

## Data Flow

### Configuration Management Flow
```
User Input → Vue Component → Pinia Store → MapConfigService → Supabase → Database
                ↓
User Interface ← State Update ← Response Processing ← API Response ← Query Result
```

### Map Discovery Flow
```
Search Query → Vue Component → Claude AI Service → Vercel API Function
                                      ↓
                              Claude AI API → Map Discovery
                                      ↓
Validation Pipeline ← Discovered Maps ← API Response
        ↓
User Interface ← Validation Results ← Parallel Validation
```

### Authentication Flow
```
User Login → Supabase Auth → JWT Token → Local Storage
                ↓
Route Guard → Token Validation → Access Control
```

## Component Structure

### Core Components

#### Views
- **Dashboard.vue** - Main dashboard with statistics and map grid/list
- **MapDiscovery.vue** - AI-powered map discovery interface  
- **ConfigEditor.vue** - Configuration creation/editing interface
- **MapPreview.vue** - Interactive map preview with MapLibre GL
- **Settings.vue** - Application settings and preferences
- **Login.vue** - Authentication interface

#### UI Components
- **MapCard.vue** - Individual map configuration card
- **SearchBar.vue** - Search input with debouncing
- **StatCard.vue** - Statistics display cards
- **MapSearchPanel.vue** - AI search interface panel
- **MapSearchInterface.vue** - Complete search and validation interface
- **MapResultCard.vue** - Search result display cards
- **ValidationStatusBadge.vue** - Status indicator badges
- **DuplicateDialog.vue** - Configuration duplication modal

#### Utility Components
- **MapPreviewModal.vue** - Modal for map preview
- **ValidationStatusPanel.vue** - Validation status management
- **MapResultsGrid.vue** - Grid layout for search results

### Service Architecture

#### Services
- **MapConfigService** - Configuration CRUD operations with Supabase fallback
- **ClaudeMapService** - AI-powered map discovery and validation
- **claudeMapServiceDev** - Development/testing version of Claude service

#### Composables
- **useMapSearch** - Reactive map search functionality with debouncing
- State management for search queries, results, validation, batch operations

#### Utilities
- **convertMaps.ts** - Transform between different map configuration formats
- **maputnikHelper.ts** - Integration utilities for Maputnik editor

## Configuration Requirements

### Environment Variables

#### Required for Production
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Claude AI Integration
CLAUDE_API_KEY=your-claude-api-key
VITE_CLAUDE_API_KEY=your-claude-api-key

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Security
JWT_SECRET=your-jwt-secret

# Optional API Keys
MAPTILER_API_KEY=your-maptiler-key
```

#### Development Configuration
```env
# Development mode works without Supabase
# Uses static data from allMapsConfig.ts
VITE_APP_MODE=development
```

### Build Configuration

#### package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

#### Vite Configuration
- Vue 3 plugin integration
- TypeScript support
- Auto-imports for Vue APIs
- Development server with HMR
- Production build optimization

## Deployment Architecture

### Vercel Deployment

#### vercel.json Configuration
```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@20",
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Deployment Features
- **Serverless Functions** - Auto-scaling API endpoints
- **Edge Network** - Global CDN for static assets
- **Environment Variables** - Secure configuration management
- **Automatic Deployments** - Git-based deployment pipeline

### Database Deployment
- **Supabase Hosted** - Managed PostgreSQL with real-time features
- **Row Level Security** - Fine-grained access control
- **Automatic Backups** - Point-in-time recovery
- **Connection Pooling** - Efficient database connections

### Security Considerations
- **CORS Configuration** - Proper cross-origin request handling
- **API Rate Limiting** - Protection against abuse
- **Input Validation** - Server-side validation with Zod schemas
- **Authentication** - JWT-based user authentication
- **Environment Isolation** - Separate dev/staging/production environments

## Development Setup

### Prerequisites
```bash
# Node.js 18+ required
node --version
npm --version
```

### Installation
```bash
# Clone repository
git clone <repository-url>
cd map-config-service/web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run typecheck` - TypeScript type checking

### Development Features
- **Hot Module Replacement** - Instant updates during development
- **TypeScript Integration** - Full type checking and IntelliSense
- **Component DevTools** - Vue.js devtools support
- **Static Data Fallback** - Works without Supabase setup
- **Mock Services** - Development-friendly API mocking

### Testing Strategy
- **Type Safety** - Comprehensive TypeScript coverage
- **Component Testing** - Vue component unit tests
- **API Testing** - Serverless function testing
- **Integration Testing** - End-to-end workflow validation
- **Performance Testing** - Load testing for map operations

---

## Contributing

For development contributions:
1. Follow Vue.js and TypeScript best practices
2. Maintain comprehensive type definitions
3. Test all map service integrations
4. Update documentation for new features
5. Ensure mobile responsiveness

## Support

For technical support or feature requests, please refer to the project repository or contact the development team.