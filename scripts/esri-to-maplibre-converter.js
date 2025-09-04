#!/usr/bin/env node

/**
 * ESRI Vector Tile Style to MapLibre Style Converter
 * Converts ESRI ArcGIS vector tile styles to MapLibre GL compatible format
 * 
 * Main conversions:
 * - Fixes relative paths for sprites and glyphs
 * - Converts font references
 * - Adjusts layer properties for MapLibre compatibility
 * - Handles ESRI-specific properties
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class ESRIToMapLibreConverter {
  constructor(options = {}) {
    this.options = {
      baseUrl: options.baseUrl || '',
      outputPath: options.outputPath || './converted-style.json',
      fontMapping: options.fontMapping || this.getDefaultFontMapping(),
      spriteBaseUrl: options.spriteBaseUrl || null,
      glyphsBaseUrl: options.glyphsBaseUrl || null,
      ...options
    };
  }

  getDefaultFontMapping() {
    // Map ESRI fonts to MapLibre-compatible fonts
    return {
      'Public Sans Regular': ['Noto Sans Regular', 'Open Sans Regular', 'Arial Unicode MS Regular'],
      'Public Sans Medium': ['Noto Sans Medium', 'Open Sans SemiBold', 'Arial Unicode MS Bold'],
      'Public Sans Bold': ['Noto Sans Bold', 'Open Sans Bold', 'Arial Unicode MS Bold'],
      'Public Sans Italic': ['Noto Sans Italic', 'Open Sans Italic', 'Arial Unicode MS Regular'],
      'Public Sans Light': ['Noto Sans Light', 'Open Sans Light', 'Arial Unicode MS Regular'],
      // Add more mappings as needed
    };
  }

  async fetchStyle(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  convertStyle(esriStyle, styleUrl) {
    const converted = { ...esriStyle };
    
    // Extract base URL from the style URL
    const baseUrl = this.extractBaseUrl(styleUrl);
    
    // 1. Fix sprite URL (convert relative to absolute)
    if (converted.sprite) {
      converted.sprite = this.convertSpriteUrl(converted.sprite, baseUrl);
    }
    
    // 2. Fix glyphs URL (convert relative to absolute)
    if (converted.glyphs) {
      converted.glyphs = this.convertGlyphsUrl(converted.glyphs, baseUrl);
    }
    
    // 3. Convert sources
    if (converted.sources) {
      converted.sources = this.convertSources(converted.sources, baseUrl);
    }
    
    // 4. Convert layers
    if (converted.layers) {
      converted.layers = this.convertLayers(converted.layers);
    }
    
    // 5. Add metadata
    converted.metadata = {
      ...converted.metadata,
      'maplibre:converted': true,
      'maplibre:convertedFrom': 'ESRI',
      'maplibre:convertedAt': new Date().toISOString(),
      'maplibre:originalUrl': styleUrl
    };
    
    return converted;
  }

  extractBaseUrl(styleUrl) {
    // Extract base URL from the style URL
    const url = new URL(styleUrl);
    const pathParts = url.pathname.split('/');
    
    // Remove 'root.json' and 'styles' from the path
    const resourcesIndex = pathParts.indexOf('resources');
    if (resourcesIndex > 0) {
      pathParts.length = resourcesIndex + 1;
    }
    
    return `${url.protocol}//${url.host}${pathParts.join('/')}`;
  }

  convertSpriteUrl(spriteUrl, baseUrl) {
    if (this.options.spriteBaseUrl) {
      return this.options.spriteBaseUrl;
    }
    
    // Convert relative path to absolute
    if (spriteUrl.startsWith('../')) {
      // Remove the leading '../' and construct absolute URL
      const spritePath = spriteUrl.replace(/^\.\.\//, '');
      return `${baseUrl}/${spritePath}`;
    }
    
    // If already absolute, return as is
    if (spriteUrl.startsWith('http://') || spriteUrl.startsWith('https://')) {
      return spriteUrl;
    }
    
    // Otherwise, assume it's relative to base URL
    return `${baseUrl}/${spriteUrl}`;
  }

  convertGlyphsUrl(glyphsUrl, baseUrl) {
    if (this.options.glyphsBaseUrl) {
      return this.options.glyphsBaseUrl;
    }
    
    // Convert relative path to absolute
    if (glyphsUrl.startsWith('../')) {
      // Remove the leading '../' and construct absolute URL
      const glyphsPath = glyphsUrl.replace(/^\.\.\//, '');
      return `${baseUrl}/${glyphsPath}`;
    }
    
    // If already absolute, return as is
    if (glyphsUrl.startsWith('http://') || glyphsUrl.startsWith('https://')) {
      return glyphsUrl;
    }
    
    // Otherwise, assume it's relative to base URL
    return `${baseUrl}/${glyphsUrl}`;
  }

  convertSources(sources, baseUrl) {
    const converted = {};
    
    for (const [key, source] of Object.entries(sources)) {
      const convertedSource = { ...source };
      
      // Convert tile URLs if present
      if (convertedSource.tiles && Array.isArray(convertedSource.tiles)) {
        convertedSource.tiles = convertedSource.tiles.map(tileUrl => {
          if (tileUrl.startsWith('../')) {
            const tilePath = tileUrl.replace(/^\.\.\//, '');
            return `${baseUrl}/${tilePath}`;
          }
          return tileUrl;
        });
      }
      
      // Convert URL if present
      if (convertedSource.url) {
        if (convertedSource.url.startsWith('../')) {
          const urlPath = convertedSource.url.replace(/^\.\.\//, '');
          convertedSource.url = `${baseUrl}/${urlPath}`;
        }
      }
      
      // Add scheme if needed for vector sources
      if (convertedSource.type === 'vector' && !convertedSource.scheme) {
        convertedSource.scheme = 'xyz';
      }
      
      converted[key] = convertedSource;
    }
    
    return converted;
  }

  convertLayers(layers) {
    return layers.map(layer => this.convertLayer(layer));
  }

  convertLayer(layer) {
    const converted = { ...layer };
    
    // Convert text font if present
    if (converted.layout && converted.layout['text-font']) {
      converted.layout['text-font'] = this.convertFontStack(converted.layout['text-font']);
    }
    
    // Convert ESRI-specific properties to MapLibre equivalents
    // This is where you'd handle any ESRI-specific properties that need conversion
    
    // Remove any ESRI-specific properties that MapLibre doesn't support
    this.cleanLayerProperties(converted);
    
    return converted;
  }

  convertFontStack(fontStack) {
    // Convert ESRI font names to MapLibre-compatible ones
    const converted = [];
    
    for (const font of fontStack) {
      if (this.options.fontMapping[font]) {
        // Use the first mapped font as primary
        const mappedFonts = this.options.fontMapping[font];
        converted.push(mappedFonts[0]);
      } else {
        // Keep original if no mapping exists
        converted.push(font);
      }
    }
    
    // Always add fallback fonts
    if (!converted.some(f => f.includes('Arial'))) {
      converted.push('Arial Unicode MS Regular');
    }
    
    return converted;
  }

  cleanLayerProperties(layer) {
    // Remove ESRI-specific properties that might cause issues in MapLibre
    const esriSpecificProps = [
      'esri:defaultVisibility',
      'esri:labelingInfo',
      // Add more ESRI-specific properties as discovered
    ];
    
    for (const prop of esriSpecificProps) {
      delete layer[prop];
    }
    
    // Clean layout properties
    if (layer.layout) {
      for (const prop of Object.keys(layer.layout)) {
        if (prop.startsWith('esri:')) {
          delete layer.layout[prop];
        }
      }
    }
    
    // Clean paint properties
    if (layer.paint) {
      for (const prop of Object.keys(layer.paint)) {
        if (prop.startsWith('esri:')) {
          delete layer.paint[prop];
        }
      }
    }
  }

  async convertFromUrl(styleUrl, outputPath) {
    console.log('Fetching ESRI style from:', styleUrl);
    
    try {
      const esriStyle = await this.fetchStyle(styleUrl);
      console.log('Style fetched successfully');
      
      const converted = this.convertStyle(esriStyle, styleUrl);
      console.log('Style converted successfully');
      
      const finalOutputPath = outputPath || this.options.outputPath;
      fs.writeFileSync(finalOutputPath, JSON.stringify(converted, null, 2));
      console.log('Converted style saved to:', finalOutputPath);
      
      // Generate a summary of changes
      this.printConversionSummary(esriStyle, converted);
      
      return converted;
    } catch (error) {
      console.error('Error during conversion:', error);
      throw error;
    }
  }

  printConversionSummary(original, converted) {
    console.log('\n=== Conversion Summary ===');
    console.log(`Original sprite URL: ${original.sprite}`);
    console.log(`Converted sprite URL: ${converted.sprite}`);
    console.log(`Original glyphs URL: ${original.glyphs}`);
    console.log(`Converted glyphs URL: ${converted.glyphs}`);
    console.log(`Number of layers: ${converted.layers?.length || 0}`);
    console.log(`Number of sources: ${Object.keys(converted.sources || {}).length}`);
    console.log('==========================\n');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
ESRI to MapLibre Style Converter

Usage:
  node esri-to-maplibre-converter.js <style-url> [output-path] [options]

Example:
  node esri-to-maplibre-converter.js "https://portal.spatial.nsw.gov.au/vectortileservices/rest/services/Hosted/NSW_BaseMap_VectorTile_Streets/VectorTileServer/resources/styles/root.json?f=pjson" ./nsw-basemap.json

Options can be provided as environment variables:
  SPRITE_BASE_URL - Override sprite URL
  GLYPHS_BASE_URL - Override glyphs URL
    `);
    process.exit(1);
  }
  
  const styleUrl = args[0];
  const outputPath = args[1] || './converted-style.json';
  
  const converter = new ESRIToMapLibreConverter({
    outputPath,
    spriteBaseUrl: process.env.SPRITE_BASE_URL,
    glyphsBaseUrl: process.env.GLYPHS_BASE_URL
  });
  
  converter.convertFromUrl(styleUrl, outputPath).catch(error => {
    console.error('Conversion failed:', error);
    process.exit(1);
  });
}

module.exports = ESRIToMapLibreConverter;