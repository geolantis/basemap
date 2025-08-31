/**
 * Map Classification based on original mapconfig.json
 * 
 * This file contains the definitive classification of maps as background or overlay
 * based on the original mapconfig.json structure.
 */

// Maps that are definitively overlays (from original mapconfig.json)
export const OVERLAY_MAPS = [
  'Kataster',
  'Kataster BEV',
  'Kataster BEV2',
  'Spain BTN Completa',
  // Add any map with these keywords
  'overlay',
  'kataster'
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
      normalized.includes('cadastr')) {
    return true;
  }
  
  return false;
}

// Maps from the original overlayMaps section
export const ORIGINAL_OVERLAY_MAPS = {
  "Kataster": true,
  "Kataster BEV": true,
  "Kataster BEV2": true,
  "Spain BTN Completa": true
};

// Everything else is a background map
export function isBackgroundMap(mapName) {
  return !isOverlayMap(mapName);
}