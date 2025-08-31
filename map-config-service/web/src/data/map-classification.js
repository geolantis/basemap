/**
 * Map Classification based on original mapconfig.json
 * 
 * This file contains the definitive classification of maps as background or overlay
 * based on the original mapconfig.json structure.
 */

// Maps that are definitively overlays (from original mapconfig.json)
// Total: 12 overlay maps
export const OVERLAY_MAPS = [
  'Kataster',
  'Kataster BEV',
  'Kataster BEV2',
  'KatasterKTNLight',
  'Kataster OVL',
  'dkm_bev_symbole',
  'flawi',
  'gefahr',
  'NZParcels',
  'NSW BaseMap Overlay',
  'Inspire WMS',
  'BEV DKM GST'
];

// Function to determine if a map is an overlay
export function isOverlayMap(mapName) {
  if (!mapName) return false;
  
  const normalized = mapName.toLowerCase().replace(/[\s_-]/g, '');
  
  // Check exact matches
  for (const overlayName of OVERLAY_MAPS) {
    if (normalized === overlayName.toLowerCase().replace(/[\s_-]/g, '')) {
      return true;
    }
  }
  
  // Check if name contains overlay keywords
  if (normalized.includes('overlay') || 
      normalized.includes('kataster') ||
      normalized.includes('cadastr') ||
      normalized.includes('dkm') ||
      normalized.includes('flawi') ||
      normalized.includes('gefahr') ||
      normalized.includes('parcel') ||
      normalized.includes('grundst')) {
    return true;
  }
  
  return false;
}

// Maps from the original overlayMaps section (12 total)
export const ORIGINAL_OVERLAY_MAPS = {
  "Kataster": true,
  "Kataster BEV": true,
  "Kataster BEV2": true,
  "KatasterKTNLight": true,
  "Kataster OVL": true,
  "dkm_bev_symbole": true,
  "flawi": true,
  "gefahr": true,
  "NZParcels": true,
  "NSW BaseMap Overlay": true,
  "Inspire WMS": true,
  "BEV DKM GST": true
};

// Everything else is a background map
export function isBackgroundMap(mapName) {
  return !isOverlayMap(mapName);
}