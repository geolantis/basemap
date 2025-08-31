# Map Configuration Service - UI/UX Documentation

## Overview

The Map Configuration Service is a modern Vue.js application that provides a comprehensive interface for managing map configurations across different map types (Vector Tiles, WMTS, WMS). The application features a clean, responsive design built with Vue 3, Tailwind CSS, and PrimeVue components.

## Architecture & Dependencies

### Core Technologies
- **Vue 3** (Composition API) - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS 4.1.12** - Utility-first CSS framework
- **PrimeVue 4.3.7** - Rich Vue UI component library
- **PrimeIcons 7.0.0** - Comprehensive icon library
- **MapLibre GL 5.7.0** - Interactive map rendering engine

### UI Framework Configuration
- **Theme**: PrimeVue Aura preset with dark mode support
- **Responsive Design**: Mobile-first approach using Tailwind's breakpoint system
- **Color Palette**: Custom primary colors (blue: #3B82F6, secondary: #8B5CF6)
- **Typography**: Inter font family for clean readability

---

## Application Structure

### Routing System
The application uses Vue Router with the following main routes:

- `/` - Dashboard (main landing page)
- `/config/new` - Create new map configuration
- `/config/:id/edit` - Edit existing configuration
- `/config/:id/preview` - Preview map with MapLibre GL
- `/discover` - AI-powered map discovery interface
- `/settings` - Application settings
- `/login` - Authentication page

---

## Core UI Components

### 1. Dashboard View (`/src/views/Dashboard.vue`)

**Purpose**: Central hub for managing all map configurations

**Key Features**:
- **Grid/List View Toggle**: Switch between card-based grid and detailed list views
- **Country-based Filtering**: Tab navigation for different countries/regions
- **Search Functionality**: Real-time search across map names and labels
- **Statistics Cards**: Overview of total maps, countries, vector tiles, and WMTS/WMS counts
- **Batch Operations**: AI Search, Copy Existing, and Create New actions

**User Workflows**:
1. **Browse Maps**: View all maps in grid or list format with country filtering
2. **Search**: Use search bar for quick map discovery
3. **Create New**: Click "New Config" to start configuration wizard
4. **AI Discovery**: Access AI-powered map search via "AI Search" button
5. **Copy Existing**: Duplicate configurations with "Copy Existing" dialog

**Screenshots Description**:
- Header with search bar, AI search button, and action buttons
- Country tabs showing map counts (All Maps, Austria, Germany, etc.)
- Grid view with map cards showing thumbnails, types, and country flags
- List view with grouped maps by country, showing detailed information

### 2. Map Configuration Editor (`/src/views/ConfigEditor.vue`)

**Purpose**: Create and edit map configurations with form validation

**Key Features**:
- **Multi-type Support**: Handles Vector Tiles (VTC), WMTS, and WMS configurations
- **Real-time Validation**: Form validation with error highlighting
- **Template System**: Quick-start templates for popular providers (MapTiler, GitHub)
- **Country Selection**: Comprehensive country list with flag emojis
- **Live Preview**: JSON configuration preview with syntax highlighting

**Form Sections**:
1. **Basic Information**:
   - Map Name (unique identifier, no spaces)
   - Display Label (user-friendly name)
   - Map Type (VTC/WMTS/WMS dropdown)
   - Country and Flag selection

2. **Style Configuration**:
   - **VTC**: Style JSON URL with template shortcuts
   - **WMTS**: Tile URL template with placeholder syntax
   - **WMS**: Endpoint URL with layer configuration

3. **Configuration Preview**: Live JSON output with validation errors

**User Workflows**:
1. **Create New Map**: Fill basic info → Select type → Configure style → Preview → Save
2. **Edit Existing**: Load configuration → Modify fields → Validate → Update
3. **Use Templates**: Select quick templates for popular providers
4. **Validate**: Real-time validation feedback with error messages

### 3. Map Preview (`/src/views/MapPreview.vue`)

**Purpose**: Interactive map preview using MapLibre GL

**Key Features**:
- **Full MapLibre Integration**: Complete map rendering with zoom, pan, rotate
- **Interactive Controls**: Zoom, bearing, pitch sliders with live updates
- **Map Information Panel**: Display configuration metadata
- **Fullscreen Mode**: Toggle fullscreen viewing
- **Style Switching**: Multiple style options (when available)
- **Error Handling**: Graceful fallbacks for loading failures

**Control Panel**:
- Style selector dropdown
- Zoom level slider (0-22)
- Bearing control (0-360°)
- Pitch control (0-60°)
- Reset view button

**Info Panel**:
- Map type (VTC/WMTS/WMS)
- Country with flag
- Current coordinates and zoom level

**User Workflows**:
1. **View Map**: Load and interact with map using standard controls
2. **Adjust View**: Use control panels to modify zoom, bearing, pitch
3. **Test Functionality**: Verify map loads correctly and responds to interaction
4. **Fullscreen**: Toggle fullscreen for detailed inspection
5. **Edit**: Direct access to configuration editor

### 4. Map Discovery Interface (`/src/views/MapDiscovery.vue`)

**Purpose**: AI-powered search and validation of external map services

**Key Features**:
- **Advanced Search**: Multi-criteria search (name, type, country, status)
- **Batch Operations**: Select multiple maps for validation, acceptance, rejection
- **Grid/List Views**: Flexible viewing options with detailed information
- **Real-time Validation**: Automatic validation of discovered maps
- **Progress Tracking**: Visual progress indicators for batch operations

**Search Interface**:
- Text search with autocomplete
- Type filter (VTC/WMTS/WMS)
- Active status filter
- Real-time results with debounced input

**Results Display**:
- **Grid View**: Card-based layout with map previews
- **List View**: Detailed table with sorting and filtering
- Selection checkboxes for batch operations
- Validation status badges

**Validation Panel**:
- Real-time validation status
- Batch operation progress
- Error reporting and resolution

### 5. Component Library

#### MapCard (`/src/components/MapCard.vue`)
**Purpose**: Individual map representation in grid view

**Features**:
- Map thumbnail placeholder
- Type badge with country flag
- Metadata display (country, last updated, layer count)
- Action buttons (Edit, Preview, Duplicate)
- Dropdown menu with advanced options
- Export functionality

**Actions Available**:
- Edit configuration
- Preview map
- Duplicate configuration
- Clone to another country
- Export as JSON
- Open in Maputnik (VTC only)
- Delete configuration

#### SearchBar (`/src/components/SearchBar.vue`)
**Purpose**: Global search functionality

**Features**:
- Debounced input for performance
- Real-time filtering
- Clear button
- Responsive design

#### MapSearchInterface (`/src/components/MapSearchInterface.vue`)
**Purpose**: Advanced map discovery with AI integration

**Features**:
- Multi-criteria search form
- Results grid with pagination
- Batch selection and operations
- Validation status tracking
- Progress monitoring sidebar

#### MapResultsGrid (`/src/components/MapResultsGrid.vue`)
**Purpose**: Display search results in grid or list format

**Features**:
- View toggle (grid/list)
- Select all functionality
- Individual result cards
- Validation status display
- Action buttons per result

#### ValidationStatusBadge (`/src/components/ValidationStatusBadge.vue`)
**Purpose**: Visual status indicators

**Status Types**:
- **Valid** (Green): Map passed all validation tests
- **Invalid** (Red): Map failed validation
- **Validating** (Blue): Validation in progress
- **Pending** (Gray): Not yet validated
- **Error** (Orange): Validation encountered errors

---

## User Experience Features

### Responsive Design
- **Mobile-First**: Optimized for mobile devices with progressive enhancement
- **Breakpoints**: 
  - `sm:` (640px) - Small tablets
  - `md:` (768px) - Tablets
  - `lg:` (1024px) - Laptops
  - `xl:` (1280px) - Desktops
- **Touch-Friendly**: Large click targets and gesture support

### Accessibility Features
- **Semantic HTML**: Proper heading hierarchy and ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG compliant color combinations
- **Screen Reader Support**: Descriptive alt text and labels

### Performance Optimization
- **Lazy Loading**: Route-based code splitting
- **Debounced Search**: Reduced API calls during typing
- **Cached Results**: Local storage for frequently accessed data
- **Progressive Loading**: Skeleton screens during load states

### User Feedback
- **Loading States**: Spinners and progress indicators
- **Error Handling**: User-friendly error messages with retry options
- **Success Feedback**: Confirmation messages for completed actions
- **Validation Messages**: Real-time form validation with helpful hints

---

## AI-Powered Features

### Claude Integration
The application integrates with Claude AI for intelligent map discovery through:

**Search Capabilities**:
- Natural language map queries
- Intelligent provider identification
- Geographic region understanding
- Map type classification

**Validation System**:
- Automated service availability testing
- CORS policy verification
- Format validation (JSON, XML)
- Geographic coverage assessment

**Results Processing**:
- Confidence scoring for discovered maps
- Duplicate detection
- Quality assessment
- Metadata extraction

---

## MapLibre GL Integration

### Map Rendering
- **Vector Tiles**: Full style.json support with layer controls
- **Raster Tiles**: WMTS/WMS integration with proper attribution
- **Interactive Controls**: Zoom, pan, rotate, pitch
- **Custom Styling**: Support for multiple map styles

### Performance Features
- **Tile Caching**: Efficient tile management
- **Smooth Animations**: Hardware-accelerated rendering
- **Responsive Loading**: Adaptive quality based on connection
- **Error Recovery**: Graceful handling of tile loading failures

---

## Maputnik Integration

### External Editor Support
The application integrates with the Maputnik style editor for vector tile maps:

**Features**:
- **Direct Launch**: Open vector tile styles in Maputnik editor
- **Provider Detection**: Automatic identification of style providers
- **API Key Handling**: Intelligent handling of authentication requirements
- **CORS Awareness**: Detection and warning for CORS issues

**Supported Providers**:
- MapTiler (with API key detection)
- GitHub raw URLs (direct support)
- Clockwork Micro (with API key warnings)
- Public government services

**User Workflow**:
1. Select vector tile map from dashboard
2. Click "Open in Maputnik" from dropdown menu
3. Automatic provider detection and URL preparation
4. Launch Maputnik in new window with preloaded style
5. Edit style in Maputnik external editor

---

## Data Management

### State Management (Pinia)
- **Centralized Store**: Single source of truth for map configurations
- **Reactive Updates**: Real-time synchronization across components
- **Persistence**: Local storage integration for session management
- **Type Safety**: Full TypeScript support for store mutations

### API Integration
- **RESTful Services**: Standard CRUD operations for map configurations
- **Supabase Integration**: Real-time database synchronization
- **Error Handling**: Comprehensive error recovery and user feedback
- **Caching Strategy**: Intelligent data caching for performance

---

## Future Enhancements

### Planned Features
1. **Advanced Analytics**: Usage statistics and performance metrics
2. **Collaborative Editing**: Multi-user configuration editing
3. **Version Control**: Configuration history and rollback
4. **Advanced Validation**: More comprehensive map service testing
5. **Thumbnail Generation**: Automatic map preview generation
6. **Bulk Operations**: Import/export multiple configurations
7. **Custom Themes**: User-customizable UI themes
8. **Offline Support**: Progressive Web App capabilities

---

## Development Guidelines

### Component Structure
- Use Composition API for all new components
- Implement proper TypeScript typing
- Follow Vue 3 best practices
- Ensure responsive design compliance

### Styling Standards
- Utilize Tailwind utility classes
- Maintain consistent spacing using Tailwind scale
- Use PrimeVue components for complex UI elements
- Follow established color scheme

### Performance Considerations
- Implement lazy loading for routes
- Use debouncing for search inputs
- Optimize image loading and caching
- Monitor bundle size and split code appropriately

---

## Conclusion

The Map Configuration Service provides a comprehensive, user-friendly interface for managing various types of map configurations. The application successfully combines modern web technologies with intelligent features to create an efficient workflow for map service management. The clean, responsive design ensures accessibility across devices while powerful features like AI-powered discovery and real-time validation enhance productivity for both technical and non-technical users.