/**
 * Map Classification based on original mapconfig.json
 * 
 * This file contains the DEFINITIVE classification of maps as background or overlay
 * based ONLY on the original mapconfig.json structure.
 * 
 * DO NOT ADD ANY GUESSING LOGIC!
 * Only these 12 maps are overlays. Everything else is background.
 */

// EXACT list of overlay maps from original mapconfig.json overlayMaps section
// Total: 12 overlay maps (NO MORE, NO LESS)
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
// ONLY checks against the exact list - NO GUESSING!
export function isOverlayMap(mapName) {
  if (!mapName) return false;
  
  // Check exact match (case-insensitive)
  return OVERLAY_MAPS.some(overlayName => 
    overlayName.toLowerCase() === mapName.toLowerCase()
  );
}

// Everything else is a background map
export function isBackgroundMap(mapName) {
  return !isOverlayMap(mapName);
}