# Layer Groups Management System

This document describes the Layer Groups Management system components for combining basemaps with overlay layers in a visual interface.

## Components Overview

### 1. BasemapCard.vue
A card component for displaying basemap layers with:
- Visual preview image
- Type badge (VTC, WMTS, WMS, XYZ)
- Country and provider information
- Selection state and compatibility indicators
- Click-to-select functionality

**Props:**
- `basemap`: BasemapLayer object
- `selected`: boolean (selection state)
- `disabled`: boolean (disable interaction)
- `showCompatibility`: boolean (show compatibility score)
- `compatibilityScore`: number (0-100)

**Events:**
- `select`: Emitted when card is clicked

### 2. OverlayCard.vue
A card component for displaying overlay layers with:
- Visual preview image with opacity applied
- Drag-and-drop support for reordering
- Opacity and blend mode controls
- Order indicators and action buttons
- Support for various overlay types (Vector, GeoJSON, etc.)

**Props:**
- `overlay`: OverlayLayer object
- `selected`: boolean
- `draggable`: boolean (enable drag-and-drop)
- `showControls`: boolean (show opacity/blend controls)
- `showActions`: boolean (show action buttons)
- `showOrder`: boolean (show order indicator)
- `order`: number (position in stack)
- `opacity`: number (0-100)
- `blendMode`: string

**Events:**
- `select`: Card selection
- `remove`: Remove overlay
- `drag-start`: Drag operation started
- `drag-end`: Drag operation ended
- `opacity-change`: Opacity value changed
- `blend-mode-change`: Blend mode changed

### 3. LayerGroupConfigurator.vue
A comprehensive dialog for creating and editing layer groups with:
- Multi-step wizard interface (Basemap → Overlays → Configure → Preview)
- Visual grid selection for basemaps and overlays
- Drag-and-drop reordering of overlays
- Real-time preview with layer stack visualization
- Compatibility filtering and validation

**Props:**
- `visible`: boolean (dialog visibility)
- `layerGroup`: LayerGroup | undefined (for editing)
- `basemaps`: BasemapLayer[] (available basemaps)
- `overlays`: OverlayLayer[] (available overlays)

**Events:**
- `update:visible`: Dialog visibility change
- `save`: Layer group configuration saved
- `close`: Dialog closed

### 4. LayerGroupCard.vue
Display card for layer groups showing:
- Composite preview of basemap + overlays
- Layer count and composition info
- Status indicators and metadata
- Quick action buttons (Preview, Edit, Delete, Duplicate)
- Stack visualization with opacity indicators

**Props:**
- `layerGroup`: LayerGroup object
- `selected`: boolean (for bulk selection)
- `showSelection`: boolean (show selection checkbox)

**Events:**
- `preview`: Open preview
- `edit`: Edit layer group
- `duplicate`: Duplicate group
- `delete`: Delete group
- `toggle-selection`: Selection state changed

### 5. LayerGroupsManagement.vue
Main management interface featuring:
- Grid and list view modes
- Advanced search and filtering
- Bulk operations (activate, deactivate, delete)
- Pagination and sorting
- Statistics and status overview
- Integration with configurator dialog

### 6. LayerGroupPreview.vue
Full-screen preview of layer groups with:
- Layer stack panel showing rendering order
- Interactive controls for layer properties
- Real-time opacity and blend mode adjustments
- Export and sharing options

### 7. LayerGroupDemo.vue
Interactive demonstration component showcasing:
- All components with sample data
- Drag-and-drop functionality
- Step-by-step workflow demonstration
- Instructions and usage examples

## Key Features

### Drag-and-Drop Functionality
- Native HTML5 drag-and-drop API
- Visual feedback during drag operations
- Automatic reordering with order updates
- Smooth animations and transitions

### Visual Layer Stack
- Real-time preview of layer combinations
- Color-coded layer type indicators
- Opacity visualization with progress bars
- Rendering order display (top-to-bottom)

### Compatibility System
- Smart filtering of compatible overlays
- Compatibility scoring (0-100%)
- Automatic validation of layer combinations
- Warning indicators for potential issues

### Responsive Design
- Mobile-friendly responsive layout
- Touch-friendly drag-and-drop on mobile
- Adaptive grid layouts for different screen sizes
- Accessible keyboard navigation

## Usage Examples

### Basic Layer Group Creation
```vue
<template>
  <LayerGroupConfigurator
    v-model:visible="showConfigurator"
    :basemaps="basemaps"
    :overlays="overlays"
    @save="handleSave"
  />
</template>

<script setup>
const showConfigurator = ref(false);
const basemaps = ref([...]);
const overlays = ref([...]);

const handleSave = (config) => {
  console.log('New layer group:', config);
};
</script>
```

### Basemap Selection Grid
```vue
<template>
  <div class="grid grid-cols-4 gap-4">
    <BasemapCard
      v-for="basemap in basemaps"
      :key="basemap.id"
      :basemap="basemap"
      :selected="selected === basemap.id"
      @select="selected = basemap.id"
    />
  </div>
</template>
```

### Draggable Overlay List
```vue
<template>
  <div class="space-y-3">
    <OverlayCard
      v-for="(overlay, index) in overlays"
      :key="overlay.id"
      :overlay="overlay"
      :draggable="true"
      :show-controls="true"
      :order="index + 1"
      @drag-start="handleDragStart(index, $event)"
      @drag-end="handleDragEnd"
    />
  </div>
</template>
```

## Type Definitions

The system uses comprehensive TypeScript types defined in `src/types/index.ts`:

- `BasemapLayer`: Base map layer definition
- `OverlayLayer`: Overlay layer definition
- `LayerGroup`: Complete layer group with metadata
- `LayerGroupConfig`: Configuration for creating groups
- `OverlayConfig`: Overlay-specific settings (opacity, blend mode, order)

## Integration Notes

### API Integration
Components are designed to work with RESTful APIs:
- GET `/api/basemaps` - Fetch available basemaps
- GET `/api/overlays` - Fetch available overlays
- POST `/api/layer-groups` - Create layer group
- PUT `/api/layer-groups/:id` - Update layer group
- DELETE `/api/layer-groups/:id` - Delete layer group

### State Management
Compatible with Pinia stores for:
- Layer groups management
- User preferences
- Selection states
- Real-time updates

### Performance Considerations
- Lazy loading of preview images
- Virtualization for large lists
- Debounced search and filtering
- Optimized drag-and-drop operations

## Browser Compatibility

- Modern browsers supporting HTML5 drag-and-drop
- Touch devices with pointer events
- Screen readers and keyboard navigation
- Progressive enhancement for older browsers

## Demo and Testing

Access the interactive demo at `/demo/layer-groups` to:
- Test all components with sample data
- Experience drag-and-drop functionality
- See responsive behavior
- Verify accessibility features

The demo includes step-by-step instructions and showcases all major features of the layer groups management system.