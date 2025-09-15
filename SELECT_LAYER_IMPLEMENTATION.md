# Select Layer Implementation Documentation

## Overview
This document describes the implementation of the `selectLayer` attribute for overlay maps, which allows specifying the primary selectable layer for feature interaction.

## Changes Made

### 1. Database Schema
- **File**: `database/migrations/005_add_select_layer.sql`
- Added `select_layer` column (VARCHAR 255) to `map_configs` table
- Created index for efficient queries on overlay maps with select layers
- Added migration script with automatic update for existing overlays

### 2. Backend API

#### Models & Types
- **File**: `src/types/index.ts`
- Added `selectLayer?: string` to `MapConfig` interface

#### Layer Extraction Utility
- **File**: `src/utils/layerExtractor.ts`
- Created comprehensive layer extraction utilities:
  - `extractLayersFromStyle()` - Extract all layers from style JSON
  - `getSelectableLayers()` - Filter for interactive layer types
  - `suggestPrimarySelectLayer()` - Auto-suggest best layer for overlays
  - `validateLayerId()` - Verify layer exists in style
  - `getLayerOptions()` - Format layers for dropdown display

#### API Endpoints
- **File**: `api/layers/extract.ts`
- Created POST endpoint `/api/layers/extract` for layer extraction
- Supports both style URLs and inline JSON
- Returns selectable layers with type information
- Provides automatic layer suggestion for overlays

#### Store Implementation
- **File**: `src/stores/mapConfig.ts`
- Created complete config store with CRUD operations
- Maps `selectLayer` to `select_layer` database column
- Handles create, read, update, delete with selectLayer support

### 3. Frontend UI

#### Configuration Editor
- **File**: `src/views/ConfigEditor.vue`
- Added select layer dropdown for overlay configurations
- Dynamic layer fetching when style URL is provided
- Auto-population of available layers
- Automatic suggestion of primary layer
- Real-time layer refresh on style change
- Proper persistence of selectLayer value

### 4. Testing & Validation
- **File**: `test-select-layer.html`
- Comprehensive test page with 5 test scenarios:
  1. Layer extraction from style URL/JSON
  2. API endpoint validation
  3. Configuration save with selectLayer
  4. Interactive map layer selection
  5. Database schema verification

## Usage Instructions

### 1. Run Database Migration

```bash
# Option 1: Using the migration script
./scripts/run-select-layer-migration.sh

# Option 2: Direct SQL execution
psql $DATABASE_URL -f database/migrations/005_add_select_layer.sql

# Option 3: Via Supabase Dashboard
# Copy contents of 005_add_select_layer.sql and run in SQL Editor
```

### 2. Using the Feature

#### In Edit Configuration UI:
1. Select "Overlay (Transparent Layer)" as Map Category
2. Choose "Vector Tiles (VTC)" as Map Type
3. Enter or paste style URL/JSON
4. Click refresh button or wait for auto-fetch
5. Select primary layer from dropdown
6. Save configuration

#### Via API:
```javascript
// Extract layers from a style
const response = await fetch('/api/layers/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    styleUrl: 'https://example.com/style.json',
    selectableOnly: true
  })
});

// Save configuration with selectLayer
const config = {
  name: 'overlay_cadastral',
  label: 'Cadastral Overlay',
  type: 'vtc',
  style: 'https://example.com/style.json',
  map_category: 'overlay',
  selectLayer: 'parcels_fill', // Primary selectable layer
  // ... other fields
};
```

### 3. Testing

Open `test-select-layer.html` in a browser to:
- Test layer extraction from various style sources
- Verify API endpoint functionality
- Test configuration saving with selectLayer
- Validate database schema changes

## Implementation Details

### Layer Selection Logic
The system prioritizes layers for selection based on type:
1. **Fill layers** (highest priority for overlays)
2. **Fill-extrusion layers**
3. **Line layers**
4. **Circle layers**
5. **Symbol layers**

### Auto-Suggestion Algorithm
When no layer is explicitly selected, the system:
1. Filters for selectable layer types
2. Prioritizes fill/polygon layers for overlays
3. Returns the first matching layer as suggestion

### Database Mapping
- Frontend field: `selectLayer`
- Database column: `select_layer`
- Automatic mapping in store operations

## Example Configurations

### Cadastral Overlay (Austria)
```json
{
  "name": "kataster_ktn",
  "label": "KTN Kataster",
  "type": "vtc",
  "tileset": "https://gis.ktn.gv.at/osgdi/tilesets/gst_bev.json",
  "style": "https://raw.githubusercontent.com/geolantis/basemap/main/kataster.json",
  "selectLayer": "gst_bev_fill",
  "map_category": "overlay",
  "country": "Austria",
  "flag": "🇦🇹"
}
```

### BEV Kataster
```json
{
  "name": "kataster_bev",
  "label": "BEV Kataster",
  "type": "vtc",
  "tileset": "https://kataster.bev.gv.at/styles/kataster/tiles.json",
  "style": "https://raw.githubusercontent.com/geolantis/basemap/main/kataster-bev2.json",
  "selectLayer": "Grundstücke - Flächen",
  "map_category": "overlay",
  "country": "Austria",
  "flag": "🇦🇹"
}
```

## Benefits

1. **Improved User Experience**: Applications can automatically enable interaction on the correct layer
2. **Consistency**: Standardized way to specify interactive layers across all overlays
3. **Performance**: Only the specified layer needs event handlers
4. **Flexibility**: Each overlay can have its own specific selectable layer
5. **Auto-Configuration**: Automatic layer suggestion reduces configuration effort

## Future Enhancements

1. **Multiple Select Layers**: Support array of selectable layers with priorities
2. **Layer Groups**: Define groups of related layers for selection
3. **Style Validation**: Verify selectLayer exists when saving configuration
4. **Visual Preview**: Show layer boundaries in configuration UI
5. **Batch Updates**: Tool to update all existing overlays with appropriate selectLayers

## Migration Notes

- The migration is backward compatible
- Existing overlays continue to work without selectLayer
- The field is optional and can be added gradually
- Common patterns are automatically detected and populated

## Troubleshooting

### Layer not appearing in dropdown
- Verify style URL is accessible
- Check if style contains valid MapLibre layers
- Ensure CORS headers allow access to style

### SelectLayer not persisting
- Verify database migration was successful
- Check browser console for API errors
- Ensure proper field mapping in store

### Interactive features not working
- Confirm layer ID matches exactly
- Verify layer exists in loaded style
- Check map event handlers are properly configured