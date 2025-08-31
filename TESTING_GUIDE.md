# Testing Guide for Basemaps with Overlays

## Overview
This guide explains how to test basemaps with overlay layers, specifically testing "Basemap Standard" with overlays "dkm_bev_symbole" and "Kataster BEV2".

## Files Created

1. **mapconfig_clean.json** - Cleaned configuration with only maps from the geolantis API
2. **test-overlays.html** - Interactive test page with overlay filtering
3. **mapconfig.backup.json** - Backup of your original configuration

## Removed Maps

The following maps were removed as they weren't in the geolantis API:
- All country-specific maps (Germany, Netherlands, Belgium, Switzerland, Luxembourg, France, Italy, Spain, Portugal, etc.)
- US/Canada maps
- Australia/New Zealand maps (except overlays)
- Various other regional maps

## Testing Procedure

### Method 1: Using the Test HTML Page

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open the test page** in your browser:
   ```
   http://localhost:5173/test-overlays.html
   ```

3. **Test Basemap Standard with overlays**:
   - Select "Basemap Standard" from the dropdown
   - Check the following overlay checkboxes:
     - "BEV Kataster 2"
     - "BEV DKM Punkte & Symbole"
   - Click "Test Current Config" to generate a test report

### Method 2: Direct URL Testing

Test the following combinations by navigating to specific coordinates in Austria:

1. **Basemap Standard alone**:
   - Center on Vienna: 48.2082°N, 16.3738°E
   - Zoom level: 12-15

2. **With Kataster BEV2 overlay**:
   - The cadastral parcels should appear as overlays
   - Test interaction by clicking on parcels

3. **With dkm_bev_symbole overlay**:
   - Survey points and symbols should be visible
   - These typically appear at higher zoom levels (15+)

### Test Scenarios

#### Scenario 1: Basic Load Test
1. Load Basemap Standard
2. Verify it displays correctly
3. Pan and zoom to ensure tiles load

#### Scenario 2: Single Overlay Test
1. Load Basemap Standard
2. Enable "Kataster BEV2" overlay
3. Verify cadastral boundaries appear
4. Test transparency (should be semi-transparent)

#### Scenario 3: Multiple Overlays Test
1. Load Basemap Standard
2. Enable both "Kataster BEV2" and "dkm_bev_symbole"
3. Verify both overlays display correctly
4. Check for any rendering conflicts

#### Scenario 4: Performance Test
1. Load all overlays simultaneously
2. Pan and zoom rapidly
3. Monitor for:
   - Tile loading delays
   - Rendering issues
   - Memory usage

### Expected Results

- **Basemap Standard**: Should show a standard topographic map of Austria
- **Kataster BEV2**: Should overlay property boundaries in a semi-transparent manner
- **dkm_bev_symbole**: Should show survey points and cadastral symbols

### Troubleshooting

1. **Map doesn't load**: Check browser console for errors
2. **Overlays not visible**: Verify the overlay URLs are accessible
3. **Authentication errors**: Some BEV services may require API keys
4. **CORS errors**: May need to configure proxy or use server-side fetching

## Configuration Structure

### Background Maps (basemaps)
- Located in `backgroundMaps` object
- Types: `vtc` (vector tile), `wmts` (raster tiles)
- Required fields: `name`, `label`, `type`, `country`, `flag`

### Overlay Maps
- Located in `overlayMaps` object
- Types: `wms`, vector tiles with `tileset` and `style`
- Can be toggled on/off independently
- Support transparency for layering

## Filter Implementation

The test page includes filtering by:
- **Map type**: Basemaps vs Overlays
- **Country**: Filter by country flag
- **Interactive toggles**: Enable/disable overlays dynamically

## Next Steps

1. Replace the original mapconfig.json with mapconfig_clean.json if tests pass:
   ```bash
   cp mapconfig_clean.json mapconfig.json
   ```

2. To add back specific maps, copy them from mapconfig.backup.json

3. For production use, consider:
   - Adding API key management
   - Implementing proper error handling
   - Adding loading indicators
   - Creating a configuration validator