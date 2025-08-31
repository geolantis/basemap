# Map Configuration Service - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                Frontend Layer (Vue 3 SPA)                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Dashboard     │  │  Map Discovery  │  │ Config Editor   │                │
│  │   - Statistics  │  │  - AI Search    │  │  - CRUD Ops     │                │
│  │   - Map Grid    │  │  - Validation   │  │  - Style Edit   │                │
│  │   - Filtering   │  │  - Batch Ops    │  │  - Preview      │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┤
│  │                        Shared Components                                    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │  │   MapCard    │ │  SearchBar   │ │ValidationBadge│ │PreviewModal  │      │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
│  └─────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┤
│  │                    State Management (Pinia)                                 │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                        │
│  │  │   Config Store       │  │   Search Store       │                        │
│  │  │   - CRUD operations  │  │   - Query management │                        │
│  │  │   - Filtering        │  │   - Result caching   │                        │
│  │  │   - Export/Import    │  │   - Validation state │                        │
│  │  └──────────────────────┘  └──────────────────────┘                        │
│  └─────────────────────────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTP/WebSocket
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           API Layer (Vercel Functions)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │  Configuration  │  │   Map Search    │  │   Validation    │                │
│  │     API         │  │      API        │  │      API        │                │
│  │  - CRUD Ops     │  │  - Claude AI    │  │  - Service Test │                │
│  │  - Export       │  │  - Discovery    │  │  - CORS Check   │                │
│  │  - Duplicate    │  │  - Metadata     │  │  - Format Check │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┤
│  │                          Proxy Services                                     │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                       │
│  │  │ Style Proxy  │ │  Tile Proxy  │ │ CORS Handler │                       │
│  │  │ - CORS Fix   │ │ - Cache Mgmt │ │ - Headers    │                       │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                       │
│  └─────────────────────────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                        ┌───────────────┼───────────────┐
                        │               │               │
                        ▼               ▼               ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│   Supabase     │ │   Claude AI    │ │  External Map  │
│   Database     │ │     API        │ │    Services    │
├────────────────┤ ├────────────────┤ ├────────────────┤
│ • PostgreSQL   │ │ • Map Discovery│ │ • VTC Services │
│ • Real-time    │ │ • NL Processing│ │ • WMTS/WMS     │
│ • Auth         │ │ • Validation   │ │ • Style APIs   │
│ • Row Security │ │ • Confidence   │ │ • Tile APIs    │
└────────────────┘ └────────────────┘ └────────────────┘
```

## Component Interaction Flow

### 1. Configuration Management Flow
```
User Action (Dashboard) 
    ↓
MapCard Component
    ↓
Config Store (Pinia)
    ↓
MapConfigService
    ↓
API Function (/api/config)
    ↓
Supabase Database
    ↓
Real-time Update
    ↓
UI Refresh
```

### 2. AI Map Discovery Flow
```
Search Input (MapDiscovery)
    ↓
useMapSearch Composable
    ↓
ClaudeMapService
    ↓
API Function (/api/search-maps)
    ↓
Claude AI API
    ↓
Discovered Maps
    ↓
Parallel Validation
    ↓
Results Display
```

### 3. Map Preview Flow
```
Preview Button Click
    ↓
MapPreviewModal Component
    ↓
MapLibre GL Initialization
    ↓
Style/Tile Loading
    ↓
Proxy Services (if needed)
    ↓
Interactive Map Display
```

## Data Architecture

### Frontend Data Models

#### Core Types
```typescript
interface MapConfig {
  id: string;
  name: string;           // Technical identifier
  label: string;          // Display name
  type: 'vtc' | 'wmts' | 'wms';
  style: string;          // Style URL or definition
  originalStyle?: string; // Original style reference
  country: string;        // Country or "Global"
  flag: string;          // Country flag emoji
  layers?: Layer[];      // Layer definitions
  metadata?: Record<string, any>;
  version: number;        // Configuration version
  isActive?: boolean;     // Active status
  createdAt: string;      // ISO timestamp
  updatedAt: string;      // ISO timestamp
  createdBy?: string;     // User ID
}

interface DiscoveredMap {
  name: string;
  label: string;
  type: 'vtc' | 'wmts' | 'wms';
  url: string;            // Base URL or tile pattern
  styleUrl?: string;      // Style JSON URL (VTC)
  country: string;
  flag: string;
  provider: string;       // Service provider
  confidence: number;     // AI confidence (0-1)
  validation?: ValidationResult;
}

interface ValidationResult {
  status: 'valid' | 'invalid' | 'warning' | 'pending';
  tests: {
    availability: boolean;  // Service accessible
    cors: boolean;         // CORS enabled
    format: boolean;       // Proper format
    geographic: boolean;   // Geographic data
  };
  errors: string[];
  warnings: string[];
}
```

### Database Schema Design

#### Normalized Structure
```sql
-- Core configuration storage
map_configs (
  id, name, label, type, style, original_style,
  country, flag, layers, metadata, version,
  is_active, created_at, updated_at, created_by
)

-- User management
users (
  id, email, role, created_at, updated_at
)

-- API key management
api_keys (
  id, provider, key_name, encrypted_key,
  created_at, updated_at
)

-- Audit trail
audit_logs (
  id, user_id, action, entity_type, entity_id,
  old_values, new_values, ip_address, user_agent,
  created_at
)
```

## Service Integration Architecture

### Authentication Flow
```
Frontend → Supabase Auth → JWT Token → API Middleware → Route Protection
    ↓
Session Management → Local Storage → Auto Refresh → Persistent Login
```

### Map Service Validation Pipeline
```
Map URL Input
    ↓
Service Type Detection (VTC/WMTS/WMS)
    ↓
Parallel Validation Tests:
    ├─ Availability Test (HTTP HEAD)
    ├─ CORS Test (Access-Control Headers)
    ├─ Format Test (Content-Type)
    └─ Geographic Test (Sample Request)
    ↓
Validation Result Aggregation
    ↓
Confidence Score Calculation
    ↓
Status Badge Display
```

### Claude AI Integration Architecture
```
Natural Language Query
    ↓
Query Processing & Enhancement
    ↓
Claude API Request with Context:
    ├─ Map type preferences
    ├─ Geographic regions
    ├─ Service provider hints
    └─ Result count limits
    ↓
Structured Response Parsing
    ↓
Map Discovery Results
    ↓
Automatic Validation Pipeline
    ↓
Enriched Results Display
```

## Scalability Considerations

### Frontend Performance
- **Code Splitting**: Route-based code splitting with Vue Router
- **Lazy Loading**: Components loaded on demand
- **Virtual Scrolling**: For large map lists
- **Debounced Search**: Reduce API calls
- **Memoization**: Computed properties caching

### Backend Scalability
- **Serverless Functions**: Auto-scaling API endpoints
- **Database Connection Pooling**: Efficient connection management
- **Caching Strategy**: Response caching for frequently accessed data
- **Rate Limiting**: Protection against API abuse
- **Queue Processing**: Background job processing for batch operations

### Database Optimization
- **Indexing Strategy**: Optimized queries for search and filtering
- **Partitioning**: Table partitioning for audit logs
- **Read Replicas**: Separate read and write operations
- **Connection Management**: Proper connection pooling

## Security Architecture

### Authentication & Authorization
```
User Request → JWT Validation → Role-Based Access → Resource Authorization
    ↓
Row-Level Security (Supabase) → Data Filtering → Response
```

### API Security
- **CORS Configuration**: Proper cross-origin handling
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: Request throttling
- **API Key Management**: Encrypted storage

### Data Protection
- **Environment Variables**: Secure configuration storage
- **Encrypted API Keys**: Database encryption for sensitive data
- **Audit Logging**: Complete action trail
- **HTTPS Enforcement**: Secure communication

## Deployment Pipeline

### Development to Production Flow
```
Local Development
    ↓
Git Commit
    ↓
GitHub Push
    ↓
Vercel Automatic Deploy
    ↓
Environment Variable Injection
    ↓
Build Process (Vue + TypeScript)
    ↓
Serverless Function Deployment
    ↓
CDN Distribution
    ↓
Health Check & Monitoring
```

### Infrastructure Components
- **Vercel**: Frontend hosting and serverless functions
- **Supabase**: Database and authentication
- **Claude AI**: External API service
- **CDN**: Global asset distribution
- **DNS**: Domain management and routing

## Monitoring & Observability

### Application Monitoring
- **Error Tracking**: Frontend and API error monitoring
- **Performance Metrics**: Page load times and API response times
- **User Analytics**: Usage patterns and feature adoption
- **Database Metrics**: Query performance and connection health

### Business Metrics
- **Map Discovery Success Rate**: AI search effectiveness
- **Validation Accuracy**: Service validation reliability
- **User Engagement**: Feature usage and retention
- **Configuration Growth**: Map configuration additions over time

This architecture provides a robust, scalable foundation for managing map configurations with AI-enhanced discovery capabilities while maintaining security and performance standards.