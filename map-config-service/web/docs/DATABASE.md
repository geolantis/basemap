# Map Configuration Service - Database Documentation

## Overview
The Map Configuration Service uses Supabase (PostgreSQL) as its database with Row Level Security (RLS) enabled. This document provides comprehensive information about the database schema, tables, and relationships for future development and agent work.

## Database Connection
- **Provider**: Supabase
- **Database Type**: PostgreSQL 15
- **RLS**: Enabled on all tables
- **Connection**: Via Supabase client library
- **Environment Variables**:
  - `VITE_SUPABASE_URL`: Supabase project URL
  - `VITE_SUPABASE_ANON_KEY`: Anonymous/public key for client access
  - `SUPABASE_SERVICE_KEY`: Service role key for admin operations (server-side only)

## Core Tables

### 1. `map_configs`
The main table storing all map configurations (both basemaps and overlays).

#### Schema
```sql
CREATE TABLE map_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  label VARCHAR(255),
  type VARCHAR(50), -- 'vtc', 'wmts', 'wms', 'xyz', etc.
  style TEXT, -- URL to style JSON file
  original_style TEXT, -- Original style URL before processing
  country VARCHAR(100),
  flag VARCHAR(10), -- Country flag emoji
  layers JSONB, -- Layer configuration for WMS/WMTS
  metadata JSONB, -- Additional metadata
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  preview_image_url TEXT,
  center JSONB, -- Map center coordinates [lng, lat]
  zoom NUMERIC(4,2),
  bearing NUMERIC(5,2),
  pitch NUMERIC(4,2),
  map_category VARCHAR(50), -- 'background' or 'overlay'
  select_layer VARCHAR(255), -- Specific layer to select
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

#### Key Fields
- **map_category**: Determines if map is a basemap ('background') or overlay ('overlay')
  - 'background': Full opaque basemaps (112 records as of Jan 2025)
  - 'overlay': Transparent overlay layers (21 records as of Jan 2025)
- **type**: Map service type
  - 'vtc': Vector Tile Cloud (MapTiler style)
  - 'wmts': Web Map Tile Service
  - 'wms': Web Map Service
  - 'xyz': XYZ tile service
- **metadata**: JSONB field containing:
  - `filename`: Original uploaded filename
  - `style_name`: Display name from style
  - `uploadedAt`: Upload timestamp
  - `description`: Map description
  - `layers_count`: Number of layers in style
  - `sources_count`: Number of data sources
  - `map_category`: Intended category (may differ from main field)

#### Sample Data
```json
{
  "id": "d925582c-6c7b-4db0-a08c-848322ab7fc1",
  "name": "BasemapStandard",
  "label": "Standard Basemap",
  "type": "vtc",
  "style": "/styles/basemap-standard.json",
  "map_category": "background",
  "is_active": true,
  "country": "Austria",
  "flag": "🇦🇹"
}
```

### 2. `layer_groups`
Stores combinations of basemaps with compatible overlays.

#### Schema
```sql
CREATE TABLE layer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  basemap_id UUID NOT NULL REFERENCES map_configs(id) ON DELETE RESTRICT,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  metadata JSONB,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

#### Relationships
- `basemap_id`: Foreign key to map_configs (must be a 'background' category map)
- One basemap can be used in multiple layer groups
- Each layer group has exactly one basemap

### 3. `layer_group_overlays`
Junction table linking layer groups to their overlay layers.

#### Schema
```sql
CREATE TABLE layer_group_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_group_id UUID NOT NULL REFERENCES layer_groups(id) ON DELETE CASCADE,
  overlay_id UUID NOT NULL REFERENCES map_configs(id) ON DELETE RESTRICT,
  display_order INTEGER DEFAULT 0,
  is_visible_default BOOLEAN DEFAULT true,
  opacity NUMERIC(3,2) DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Constraints
- `opacity`: Must be between 0.0 and 1.0
- Each overlay can be linked to multiple layer groups
- Display order determines layer stacking

### 4. `layer_group_tags`
Tags for categorizing and filtering layer groups.

#### Schema
```sql
CREATE TABLE layer_group_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_group_id UUID NOT NULL REFERENCES layer_groups(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. `profiles` (User Profiles)
Extended user information linked to Supabase auth.

#### Schema
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Roles
- 'admin': Full access to all operations
- 'editor': Can create/edit maps and layer groups
- 'user': Read-only access

## Common Queries

### Get All Basemaps
```sql
SELECT * FROM map_configs
WHERE map_category = 'background'
  AND is_active = true
ORDER BY name;
```

### Get All Overlays
```sql
SELECT * FROM map_configs
WHERE map_category = 'overlay'
  AND is_active = true
ORDER BY name;
```

### Get Layer Group with Details
```sql
SELECT
  lg.*,
  mc.name as basemap_name,
  mc.label as basemap_label,
  mc.style as basemap_style,
  COALESCE(
    json_agg(
      json_build_object(
        'id', overlay.id,
        'name', overlay.name,
        'label', overlay.label,
        'style', overlay.style,
        'display_order', lgo.display_order,
        'opacity', lgo.opacity,
        'is_visible_default', lgo.is_visible_default
      ) ORDER BY lgo.display_order
    ) FILTER (WHERE overlay.id IS NOT NULL),
    '[]'
  ) as overlays
FROM layer_groups lg
LEFT JOIN map_configs mc ON lg.basemap_id = mc.id
LEFT JOIN layer_group_overlays lgo ON lg.id = lgo.layer_group_id
LEFT JOIN map_configs overlay ON lgo.overlay_id = overlay.id
WHERE lg.id = $1
GROUP BY lg.id, mc.name, mc.label, mc.style;
```

## Data Statistics (as of January 2025)

### Map Configs
- **Total Records**: 133
- **Basemaps (background)**: 112
- **Overlays**: 21
- **Active Maps**: ~130

### Common Map Types
- **Basemaps**:
  - Orthophoto/Satellite imagery (40+)
  - Topographic maps (20+)
  - Street/Road maps (15+)
  - Custom basemaps (30+)

- **Overlays**:
  - Cadastral/Property boundaries (15)
  - Administrative boundaries (3)
  - Specialized overlays (3)

### Geographic Coverage
Maps cover multiple countries with focus on:
- Austria (primary - 30+ maps)
- Germany (15+ maps)
- Switzerland (10+ maps)
- Italy (10+ maps)
- Other European countries
- Global coverage maps

## Row Level Security (RLS) Policies

### map_configs
- **Read**: Public access for is_public = true
- **Write**: Authenticated users with 'admin' or 'editor' role
- **Delete**: Admin role only

### layer_groups
- **Read**: Public access for is_public = true
- **Write**: Authenticated users with 'admin' or 'editor' role
- **Delete**: Admin role only or creator

### layer_group_overlays
- **Read**: Public (inherits from layer_groups)
- **Write**: Same as parent layer_group
- **Delete**: Same as parent layer_group

## Important Notes for Developers

### 1. Map Category Disambiguation
- Always use the `map_category` field at the table level
- The `metadata.map_category` field may differ and should not be used for filtering
- Some maps have mismatched categories between main field and metadata

### 2. Style URLs
- Style URLs are relative paths starting with `/styles/`
- Served statically from the `public/styles` directory
- Must be accessible without authentication

### 3. Preview Images
- Stored as URLs in `preview_image_url` field
- Generated asynchronously after map upload
- May be null for older maps

### 4. Coordinate Systems
- Center coordinates: [longitude, latitude] (GeoJSON format)
- Zoom levels: Typically 0-22 (MapLibre GL standard)
- Bearing: 0-360 degrees (0 = north)
- Pitch: 0-60 degrees (0 = top-down)

### 5. Common Issues
- **Missing Overlays**: Check map_category field is set to 'overlay'
- **Missing Basemaps**: Check map_category field is set to 'background'
- **Style Loading**: Ensure style files exist in public/styles directory
- **Preview Images**: May fail for complex or large styles

## Supabase Client Usage

### TypeScript Types
```typescript
interface MapConfig {
  id: string;
  name: string;
  label: string;
  type: 'vtc' | 'wmts' | 'wms' | 'xyz';
  style: string;
  map_category: 'background' | 'overlay';
  is_active: boolean;
  // ... other fields
}

interface LayerGroup {
  id: string;
  name: string;
  description: string;
  basemap_id: string;
  is_active: boolean;
  // ... other fields
}
```

### Common Operations
```javascript
// Initialize Supabase client
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, anonKey);

// Fetch basemaps
const { data: basemaps } = await supabase
  .from('map_configs')
  .select('*')
  .eq('map_category', 'background')
  .eq('is_active', true);

// Create layer group
const { data, error } = await supabase
  .from('layer_groups')
  .insert({
    name: 'Kärnten Standard',
    basemap_id: 'basemap-uuid',
    description: 'Standard maps for Carinthia'
  })
  .select()
  .single();

// Add overlays to group
const { error } = await supabase
  .from('layer_group_overlays')
  .insert([
    {
      layer_group_id: 'group-uuid',
      overlay_id: 'overlay-uuid-1',
      display_order: 1
    },
    {
      layer_group_id: 'group-uuid',
      overlay_id: 'overlay-uuid-2',
      display_order: 2
    }
  ]);
```

## Migration History
- `001_initial_schema.sql`: Base tables setup
- `002_add_map_configs.sql`: Map configuration tables
- `003_add_profiles.sql`: User profiles
- `004_add_rls_policies.sql`: Security policies
- `005_add_map_category.sql`: Category field for maps
- `006_add_preview_fields.sql`: Preview image support
- `007_layer_groups_ultra.sql`: Layer groups feature

## Backup and Recovery
- Automatic daily backups via Supabase
- Point-in-time recovery available (Pro plan)
- Manual exports via Supabase dashboard

## Performance Considerations
- Index on `map_category` for filtering
- Index on `name` for lookups
- JSONB GIN indexes for metadata queries
- Composite index on (map_category, is_active)

## Future Enhancements
1. Map usage analytics table
2. User favorites/bookmarks
3. Map sharing and collaboration
4. Version history tracking
5. API usage quotas per application
6. Custom map collections
7. Map style templates

---

*Last Updated: January 2025*
*Database Version: 1.0.7*