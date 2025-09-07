#!/usr/bin/env node

/**
 * Identify and fix missing style configurations
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wphrytrrikfkwehwahqc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHJ5dHJyaWtma3dlaHdhaHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTI5NzUsImV4cCI6MjA3MjEyODk3NX0.8E7_6gTc4guWSB2lI-hFQfGSEs6ziLmIT3P8xPbmz_k';

const supabase = createClient(supabaseUrl, supabaseKey);

// Failed styles from the test
const failedStyles = [
  'Agrar', 'CanadaNRCan', 'CanadaSentinel2', 'CanTopo', 'NLSFinlandCadaster',
  'FranceCadastralParcels', 'FranceAdminExpress', 'FranceVector', 'BrandenburgDE',
  'DENiedersachenColor', 'DENiedersachenGrey', 'DENiedersachenLight', 'DENiedersachenClassic',
  'DENiedersachenNight', 'DENiedersachenOSMCombi', 'DENiedersachenOSMBW', 'GermanyTopPlusOpen',
  'GlobalSat', 'GoogleRoadmap', 'OSM3D', 'OSMBright', 'OSMLiberty', 'EmiliaRomagnaBase',
  'ItalyCadastre', 'ItalyIGM', 'ItalyOrtofoto', 'LombardyCTR', 'PiedmontBase', 'SardiniaCTR',
  'SouthTyrolTopo', 'TuscanyCTR', 'VenetoCTR', 'Luxembourg', 'LuxembourgMobiliteit',
  'LuxembourgRoadmap', 'LuxembourgTopo', 'NLLuchtfoto', 'NLTopo', 'NZ', 'SloveniaDOF',
  'Spain_BTN_Completa', 'ICGCStandard', 'Swisstopo', 'SwisstopoLight', 'SwisstopoSat',
  'SwisstopoLightWinter', 'Switzerland', 'OSGB', 'OSGBGrey', 'USGSTopo', 'AustriaIsolines',
  'dkm_bev_symbole', 'KatasterBEV', 'KatasterBEV2', 'bev_kataster_amtlich', 'bev_kataster_gis',
  'bev_kataster_light', 'KatasterOVL', 'flawi', 'gefahr', 'KatasterKTNLight', 'NZParcels'
];

// Static style files available (from ls output)
const staticStyles = [
  'agraratlas', 'austria_isolines', 'basemap-at-new', 'basemap-ortho-blue', 'basemap-ortho',
  'basemap', 'basemap2', 'basemap3', 'basemap4', 'basemap5', 'basemap6', 'basemap7',
  'basemapktn-ortho', 'basemapv-bmapv-3857', 'bev_symbole_amtlich', 'bev_symbole_gis',
  'bev_symbole_orthophoto', 'bev-katasterlight', 'bm', 'de_brandenburg', 'global2',
  'grundstuecke_kataster-ktn-light', 'kataster-bev', 'kataster-bev2', 'kataster-light',
  'kataster-ortho', 'kataster', 'kiinteistojaotus-taustakartalla', 'maptiler3d',
  'nz-basemap-topographic', 'nz-parcels', 'nz-topolite-ortho', 'nzortho', 'osmliberty',
  'ovl-kataster', 'plan_ign'
];

// Map of failed styles to correct static files (where they exist)
const styleMapping = {
  'Agrar': '/styles/agraratlas.json',
  'AustriaIsolines': '/styles/austria_isolines.json',
  'dkm_bev_symbole': '/styles/bev_symbole_orthophoto.json',
  'KatasterBEV': '/styles/kataster-bev.json',
  'KatasterBEV2': '/styles/kataster-bev2.json',
  'bev_kataster_amtlich': '/styles/bev_symbole_amtlich.json',
  'bev_kataster_gis': '/styles/bev_symbole_gis.json',
  'bev_kataster_light': '/styles/bev-katasterlight.json',
  'KatasterOVL': '/styles/ovl-kataster.json',
  'KatasterKTNLight': '/styles/grundstuecke_kataster-ktn-light.json',
  'NZParcels': '/styles/nz-parcels.json',
  'NZ': '/styles/nz-basemap-topographic.json',
  'OSMLiberty': '/styles/osmliberty.json',
  'BrandenburgDE': '/styles/de_brandenburg.json',
  
  // WMTS/Raster maps that should use dynamic generation
  'GermanyTopPlusOpen': 'WMTS',
  'GoogleRoadmap': 'GOOGLE',
  'GoogleSatellite': 'GOOGLE',
  
  // Commercial vector services that need proper proxy setup
  'OSM3D': '/api/proxy/style/maptiler-3d',
  'OSMBright': '/api/proxy/style/maptiler-bright',
  'GlobalSat': '/api/proxy/style/maptiler-satellite',
  
  // Switzerland maps - need special handling
  'Swisstopo': 'SWISSTOPO',
  'SwisstopoLight': 'SWISSTOPO',
  'SwisstopoSat': 'SWISSTOPO',
  'SwisstopoLightWinter': 'SWISSTOPO',
  'Switzerland': 'SWISSTOPO',
};

async function fixMissingStyles() {
  console.log('🔍 Analyzing failed styles...\n');
  
  const updates = [];
  const needsManualReview = [];
  
  for (const name of failedStyles) {
    const mapping = styleMapping[name];
    
    if (mapping) {
      if (mapping.startsWith('/styles/')) {
        // Static file exists
        updates.push({
          name,
          style: `https://mapconfig.geolantis.com${mapping}`,
          note: 'Static style file exists'
        });
      } else if (mapping.startsWith('/api/proxy/')) {
        // Needs proxy endpoint
        updates.push({
          name,
          style: `https://mapconfig.geolantis.com${mapping}`,
          note: 'Commercial service proxy'
        });
      } else {
        // Special cases needing manual review
        needsManualReview.push({
          name,
          type: mapping,
          note: 'Needs special configuration'
        });
      }
    } else {
      needsManualReview.push({
        name,
        type: 'UNKNOWN',
        note: 'No mapping found'
      });
    }
  }
  
  console.log(`📊 Summary:`);
  console.log(`  • Can fix automatically: ${updates.length}`);
  console.log(`  • Need manual review: ${needsManualReview.length}`);
  console.log(`  • Total failed: ${failedStyles.length}\n`);
  
  if (updates.length > 0) {
    console.log('✅ Styles that can be fixed automatically:\n');
    for (const update of updates) {
      console.log(`  ${update.name}:`);
      console.log(`    → ${update.style}`);
      console.log(`    (${update.note})\n`);
    }
    
    // Apply updates to database
    console.log('📝 Updating database...\n');
    
    for (const update of updates) {
      const { error } = await supabase
        .from('map_configs')
        .update({ 
          style: update.style,
          updated_at: new Date().toISOString()
        })
        .eq('name', update.name);
      
      if (error) {
        console.error(`  ❌ Failed to update ${update.name}:`, error.message);
      } else {
        console.log(`  ✅ Updated ${update.name}`);
      }
    }
  }
  
  if (needsManualReview.length > 0) {
    console.log('\n⚠️ Styles needing manual review:\n');
    
    // Group by type
    const byType = {};
    for (const item of needsManualReview) {
      if (!byType[item.type]) byType[item.type] = [];
      byType[item.type].push(item.name);
    }
    
    for (const [type, names] of Object.entries(byType)) {
      console.log(`  ${type}:`);
      names.forEach(name => console.log(`    • ${name}`));
      console.log();
    }
  }
  
  // Generate a SQL script for manual updates
  console.log('\n📄 SQL for manual review (save as fix-styles.sql):\n');
  console.log('-- Review and customize these updates before running');
  console.log('-- Some may need different URLs or special handling\n');
  
  for (const item of needsManualReview) {
    console.log(`-- ${item.name} (${item.type})`);
    if (item.type === 'WMTS') {
      console.log(`UPDATE map_configs SET style = 'https://mapconfig.geolantis.com/api/styles/${item.name}.json' WHERE name = '${item.name}';`);
    } else if (item.type === 'GOOGLE') {
      console.log(`-- Needs Google Maps API configuration`);
      console.log(`-- UPDATE map_configs SET style = 'GOOGLE_MAPS_URL' WHERE name = '${item.name}';`);
    } else if (item.type === 'SWISSTOPO') {
      console.log(`-- Needs Swisstopo API configuration`);
      console.log(`-- UPDATE map_configs SET style = 'SWISSTOPO_URL' WHERE name = '${item.name}';`);
    } else {
      console.log(`-- UPDATE map_configs SET style = 'PROPER_URL_HERE' WHERE name = '${item.name}';`);
    }
    console.log();
  }
}

fixMissingStyles().catch(console.error);