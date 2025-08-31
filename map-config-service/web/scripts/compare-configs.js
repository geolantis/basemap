#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Load configuration files
const originalPath = '/Users/michael/Development/basemap/mapconfig.json';
const databasePath = '/Users/michael/Development/basemap/map-config-service/web/src/data/mapconfig-full.json';

console.log(`${colors.cyan}${colors.bright}📊 MAP CONFIGURATION COMPARISON REPORT${colors.reset}`);
console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);

// Read and parse both files
const original = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));

// Normalize data structures
function normalizeConfig(config) {
  const maps = {};
  
  // Handle backgroundMaps
  if (config.backgroundMaps) {
    Object.entries(config.backgroundMaps).forEach(([key, value]) => {
      maps[value.name || key] = { ...value, source: 'background' };
    });
  }
  
  // Handle regular array format
  if (Array.isArray(config)) {
    config.forEach(map => {
      maps[map.name] = { ...map, source: 'array' };
    });
  }
  
  return maps;
}

const originalMaps = normalizeConfig(original);
const databaseMaps = normalizeConfig(database);

// Get all unique map names
const allMapNames = new Set([...Object.keys(originalMaps), ...Object.keys(databaseMaps)]);

// Statistics
const stats = {
  totalOriginal: Object.keys(originalMaps).length,
  totalDatabase: Object.keys(databaseMaps).length,
  matching: 0,
  missingInDb: [],
  extraInDb: [],
  fieldDifferences: [],
  apiKeyExposures: []
};

// Country statistics
const countryStats = {
  original: {},
  database: {}
};

// Count maps by country
Object.values(originalMaps).forEach(map => {
  const country = map.country || 'Unknown';
  countryStats.original[country] = (countryStats.original[country] || 0) + 1;
});

Object.values(databaseMaps).forEach(map => {
  const country = map.country || 'Unknown';
  countryStats.database[country] = (countryStats.database[country] || 0) + 1;
});

// Compare each map
allMapNames.forEach(mapName => {
  const origMap = originalMaps[mapName];
  const dbMap = databaseMaps[mapName];
  
  if (origMap && dbMap) {
    stats.matching++;
    
    // Compare fields
    const differences = {};
    const allFields = new Set([...Object.keys(origMap), ...Object.keys(dbMap)]);
    
    allFields.forEach(field => {
      if (field === 'source') return; // Skip our added field
      
      const origValue = origMap[field];
      const dbValue = dbMap[field];
      
      if (JSON.stringify(origValue) !== JSON.stringify(dbValue)) {
        differences[field] = {
          original: origValue,
          database: dbValue
        };
      }
    });
    
    if (Object.keys(differences).length > 0) {
      stats.fieldDifferences.push({
        map: mapName,
        differences
      });
    }
  } else if (origMap && !dbMap) {
    stats.missingInDb.push({
      name: mapName,
      country: origMap.country,
      type: origMap.type,
      label: origMap.label
    });
  } else if (!origMap && dbMap) {
    stats.extraInDb.push({
      name: mapName,
      country: dbMap.country,
      type: dbMap.type,
      label: dbMap.label
    });
  }
});

// Check for API key exposures
function findApiKeys(obj, path = '') {
  const apiKeyPatterns = [
    /key=/i,
    /api[_-]?key=/i,
    /apikey=/i,
    /x-api-key=/i,
    /token=/i,
    /auth=/i,
    /\b[a-zA-Z0-9]{32,}\b/, // Long alphanumeric strings
  ];
  
  const exposures = [];
  
  if (typeof obj === 'string') {
    apiKeyPatterns.forEach(pattern => {
      if (pattern.test(obj)) {
        exposures.push({
          path,
          value: obj,
          pattern: pattern.toString()
        });
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      exposures.push(...findApiKeys(value, path ? `${path}.${key}` : key));
    });
  }
  
  return exposures;
}

// Find API keys in both configs
const originalApiKeys = findApiKeys(originalMaps);
const databaseApiKeys = findApiKeys(databaseMaps);

// Print report
console.log(`${colors.bright}📈 SUMMARY STATISTICS${colors.reset}`);
console.log(`${'-'.repeat(40)}`);
console.log(`Original maps: ${colors.green}${stats.totalOriginal}${colors.reset}`);
console.log(`Database maps: ${colors.blue}${stats.totalDatabase}${colors.reset}`);
console.log(`Matching maps: ${colors.green}${stats.matching}${colors.reset}`);
console.log(`Missing in DB: ${colors.red}${stats.missingInDb.length}${colors.reset}`);
console.log(`Extra in DB: ${colors.yellow}${stats.extraInDb.length}${colors.reset}`);
console.log(`Maps with differences: ${colors.yellow}${stats.fieldDifferences.length}${colors.reset}\n`);

// Country breakdown
console.log(`${colors.bright}🌍 COUNTRY DISTRIBUTION${colors.reset}`);
console.log(`${'-'.repeat(40)}`);
console.log(`${'Country'.padEnd(20)} ${'Original'.padEnd(10)} ${'Database'.padEnd(10)} ${'Difference'}`);
console.log(`${'-'.repeat(50)}`);

const allCountries = new Set([...Object.keys(countryStats.original), ...Object.keys(countryStats.database)]);
allCountries.forEach(country => {
  const orig = countryStats.original[country] || 0;
  const db = countryStats.database[country] || 0;
  const diff = db - orig;
  const diffStr = diff > 0 ? `+${diff}` : diff.toString();
  const diffColor = diff > 0 ? colors.green : diff < 0 ? colors.red : colors.reset;
  
  console.log(`${country.padEnd(20)} ${orig.toString().padEnd(10)} ${db.toString().padEnd(10)} ${diffColor}${diffStr}${colors.reset}`);
});

// Missing maps
if (stats.missingInDb.length > 0) {
  console.log(`\n${colors.bright}${colors.red}❌ MAPS MISSING IN DATABASE (${stats.missingInDb.length})${colors.reset}`);
  console.log(`${'-'.repeat(40)}`);
  stats.missingInDb.forEach(map => {
    console.log(`  • ${map.name} (${map.country}) - ${map.label || 'No label'}`);
  });
}

// Extra maps
if (stats.extraInDb.length > 0) {
  console.log(`\n${colors.bright}${colors.green}➕ EXTRA MAPS IN DATABASE (${stats.extraInDb.length})${colors.reset}`);
  console.log(`${'-'.repeat(40)}`);
  stats.extraInDb.forEach(map => {
    console.log(`  • ${map.name} (${map.country}) - ${map.label || 'No label'}`);
  });
}

// Field differences (showing first 5)
if (stats.fieldDifferences.length > 0) {
  console.log(`\n${colors.bright}${colors.yellow}🔄 FIELD DIFFERENCES (showing first 5 of ${stats.fieldDifferences.length})${colors.reset}`);
  console.log(`${'-'.repeat(40)}`);
  stats.fieldDifferences.slice(0, 5).forEach(({ map, differences }) => {
    console.log(`\n  ${colors.cyan}${map}:${colors.reset}`);
    Object.entries(differences).forEach(([field, values]) => {
      console.log(`    ${field}:`);
      console.log(`      Original: ${colors.red}${JSON.stringify(values.original, null, 2).split('\n').join('\n      ')}${colors.reset}`);
      console.log(`      Database: ${colors.green}${JSON.stringify(values.database, null, 2).split('\n').join('\n      ')}${colors.reset}`);
    });
  });
  
  if (stats.fieldDifferences.length > 5) {
    console.log(`\n  ... and ${stats.fieldDifferences.length - 5} more maps with differences`);
  }
}

// API Key Security Analysis
console.log(`\n${colors.bright}${colors.red}🔐 API KEY EXPOSURE ANALYSIS${colors.reset}`);
console.log(`${'-'.repeat(40)}`);

// Find unique API keys
const uniqueApiKeys = new Set();
originalApiKeys.forEach(exposure => {
  const match = exposure.value.match(/key=([^&]+)/i) || 
                exposure.value.match(/x-api-key=([^&]+)/i) ||
                exposure.value.match(/apikey=([^&]+)/i);
  if (match) uniqueApiKeys.add(match[1]);
});

console.log(`Total API key exposures in original: ${colors.red}${originalApiKeys.length}${colors.reset}`);
console.log(`Total API key exposures in database: ${colors.red}${databaseApiKeys.length}${colors.reset}`);
console.log(`Unique API keys found: ${colors.red}${uniqueApiKeys.size}${colors.reset}`);

if (uniqueApiKeys.size > 0) {
  console.log(`\n${colors.bright}Exposed API Keys:${colors.reset}`);
  Array.from(uniqueApiKeys).forEach(key => {
    const masked = key.substring(0, 8) + '...' + key.substring(key.length - 4);
    console.log(`  • ${colors.red}${masked}${colors.reset}`);
  });
}

// Service providers affected
const providers = new Set();
originalApiKeys.forEach(exposure => {
  if (exposure.value.includes('maptiler.com')) providers.add('MapTiler');
  if (exposure.value.includes('clockworkmicro.com')) providers.add('Clockwork Micro');
  if (exposure.value.includes('os.uk')) providers.add('Ordnance Survey');
  if (exposure.value.includes('googleapis.com')) providers.add('Google Maps');
  if (exposure.value.includes('linz.govt.nz')) providers.add('LINZ (New Zealand)');
});

if (providers.size > 0) {
  console.log(`\n${colors.bright}Affected Service Providers:${colors.reset}`);
  providers.forEach(provider => {
    console.log(`  • ${colors.yellow}${provider}${colors.reset}`);
  });
}

// Data integrity check
console.log(`\n${colors.bright}✅ DATA INTEGRITY CHECK${colors.reset}`);
console.log(`${'-'.repeat(40)}`);

const requiredFields = ['name', 'type', 'country', 'flag', 'label'];
let missingRequiredFields = 0;

Object.entries(databaseMaps).forEach(([mapName, map]) => {
  const missing = requiredFields.filter(field => !map[field]);
  if (missing.length > 0) {
    missingRequiredFields++;
    if (missingRequiredFields <= 3) {
      console.log(`  ${colors.yellow}${mapName}${colors.reset} missing: ${missing.join(', ')}`);
    }
  }
});

if (missingRequiredFields > 3) {
  console.log(`  ... and ${missingRequiredFields - 3} more maps with missing required fields`);
} else if (missingRequiredFields === 0) {
  console.log(`  ${colors.green}✓ All maps have required fields${colors.reset}`);
}

// Final recommendations
console.log(`\n${colors.bright}${colors.magenta}💡 RECOMMENDATIONS${colors.reset}`);
console.log(`${'-'.repeat(40)}`);
console.log(`1. ${colors.red}URGENT:${colors.reset} Rotate all exposed API keys immediately`);
console.log(`2. Implement server-side proxy to hide API keys from client`);
console.log(`3. Add missing maps to database: ${stats.missingInDb.length} maps`);
console.log(`4. Review field differences for ${stats.fieldDifferences.length} maps`);
console.log(`5. Validate extra maps in database: ${stats.extraInDb.length} maps`);
console.log(`6. Set up environment variables for all sensitive credentials`);
console.log(`7. Implement API key rotation schedule`);
console.log(`8. Add monitoring for API key usage and quotas`);

// Export detailed report
const reportPath = path.join(__dirname, 'comparison-report.json');
const detailedReport = {
  timestamp: new Date().toISOString(),
  summary: stats,
  countryStats,
  missingMaps: stats.missingInDb,
  extraMaps: stats.extraInDb,
  fieldDifferences: stats.fieldDifferences,
  apiKeyExposures: {
    original: originalApiKeys.length,
    database: databaseApiKeys.length,
    uniqueKeys: Array.from(uniqueApiKeys).map(k => k.substring(0, 8) + '...')
  },
  providers: Array.from(providers)
};

fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
console.log(`\n${colors.green}📄 Detailed report saved to: ${reportPath}${colors.reset}`);