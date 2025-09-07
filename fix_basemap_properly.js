#!/usr/bin/env node

const fs = require('fs');

// Read the backup of original basemap8.json
const originalBasemap = JSON.parse(fs.readFileSync('/Users/michael/Development/basemap/basemap8_backup.json', 'utf8'));

// HL layers to add on top
const hlLayers = [
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/10",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL",
    "filter": ["==", "_symbol", 0],
    "minzoom": 17,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,102,89,0.5)", "line-width": 0.533333 }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/10_1",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL",
    "filter": ["==", "_symbol", 0],
    "minzoom": 16,
    "maxzoom": 17,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,111,102,0.5)", "line-width": 0.533333 }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/50",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL",
    "filter": ["==", "_symbol", 1],
    "minzoom": 16,
    "maxzoom": 17,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,102,89,0.5)", "line-width": 1.06667 }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/20",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL",
    "filter": ["==", "_symbol", 2],
    "minzoom": 17,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,102,89,0.5)", "line-width": 1.53333 }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/20_1",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL",
    "filter": ["==", "_symbol", 2],
    "minzoom": 16,
    "maxzoom": 17,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,111,102,0.5)", "line-width": 0.533333 }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/100",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL",
    "filter": ["==", "_symbol", 3],
    "minzoom": 17,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,102,89,0.5)", "line-width": 2.66667 }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/100_1",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL",
    "filter": ["==", "_symbol", 3],
    "minzoom": 16,
    "maxzoom": 17,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,102,89,0.5)", "line-width": 1.6 }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/1000",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL",
    "filter": ["==", "_symbol", 4],
    "minzoom": 17,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,102,89,0.5)", "line-width": 2.66667 }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/1000_1",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL",
    "filter": ["==", "_symbol", 4],
    "minzoom": 16,
    "maxzoom": 17,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,102,89,0.5)", "line-width": 1.6 }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/5",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL",
    "filter": ["==", "_symbol", 5],
    "minzoom": 17,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,102,89,0.5)", "line-width": 0.533333 }
  },
  {
    "id": "AUSTRIA_HL_20_100_1000_HL/20",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_20_100_1000_HL",
    "filter": ["==", "_symbol", 0],
    "minzoom": 14,
    "maxzoom": 16,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,111,102,0.5)", "line-width": 0.8 }
  },
  {
    "id": "AUSTRIA_HL_20_100_1000_HL/100; 1000",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_20_100_1000_HL",
    "filter": ["==", "_symbol", 1],
    "minzoom": 14,
    "maxzoom": 16,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,111,102,0.5)", "line-width": 1.6 }
  },
  {
    "id": "AUSTRIA_HL_50_100_1000_smooth200m_HL/50er",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_50_100_1000_smooth200m_HL",
    "filter": ["==", "_symbol", 0],
    "minzoom": 12,
    "maxzoom": 14,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,111,102,0.5)", "line-width": 0.8 }
  },
  {
    "id": "AUSTRIA_HL_50_100_1000_smooth200m_HL/1000; 2000; 3000; 200; 400; 600; 800; 1200; 1400; 1600; 1800; 2200; 2400; 2600; 2800; 3200; 3400; 3600",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_50_100_1000_smooth200m_HL",
    "filter": ["==", "_symbol", 1],
    "minzoom": 12,
    "maxzoom": 14,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,111,102,0.5)", "line-width": 1.6 }
  },
  {
    "id": "AUSTRIA_HL50_100_1000_smooth500m_HL/200; 300; 400; 600; 700; 800; 900; 1100; 1200; 1300; 1400; 1600; 1700; 1800; 1900; 2100; 2200; 2300; 2400; 2600; 2700; 2800; 2900; 3100; 3200; 3300; 3400; 3600; 3700",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL50_100_1000_smooth500m_HL",
    "filter": ["==", "_symbol", 0],
    "minzoom": 11,
    "maxzoom": 12,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,111,102,0.5)", "line-width": 0.8 }
  },
  {
    "id": "AUSTRIA_HL50_100_1000_smooth500m_HL/200; 300; 400; 600; 700; 800; 900; 1100; 1200; 1300; 1400; 1600; 1700; 1800; 1900; 2100; 2200; 2300; 2400; 2600; 2700; 2800; 2900; 3100; 3200; 3300; 3400; 3600; 3700_1",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL50_100_1000_smooth500m_HL",
    "filter": ["==", "_symbol", 0],
    "minzoom": 10,
    "maxzoom": 11,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,111,102,0.4)", "line-width": 0.8 }
  },
  {
    "id": "AUSTRIA_HL50_100_1000_smooth500m_HL/1000; 2000; 3000; 500; 1500; 2500; 3500",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL50_100_1000_smooth500m_HL",
    "filter": ["==", "_symbol", 1],
    "minzoom": 11,
    "maxzoom": 12,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,111,102,0.5)", "line-width": 1.6 }
  },
  {
    "id": "AUSTRIA_HL50_100_1000_smooth500m_HL/1000; 2000; 3000; 500; 1500; 2500; 3500_1",
    "type": "line",
    "source": "esri",
    "source-layer": "AUSTRIA_HL50_100_1000_smooth500m_HL",
    "filter": ["==", "_symbol", 1],
    "minzoom": 10,
    "maxzoom": 11,
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "rgba(128,111,102,0.4)", "line-width": 1.6 }
  },
  // Label layers
  {
    "id": "AUSTRIA_HL_20_100_1000_HL/label/HL15-16_100er,1000er",
    "type": "symbol",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_20_100_1000_HL/label",
    "minzoom": 14,
    "maxzoom": 15.91,
    "layout": {
      "symbol-placement": "line",
      "symbol-spacing": 1000,
      "text-font": ["Corbel Bold Italic"],
      "text-size": 13.3333,
      "text-field": "{_name}",
      "text-optional": true
    },
    "paint": {
      "text-color": "#4E4E4E",
      "text-halo-color": "rgba(230,230,230,0.5)",
      "text-halo-width": 1.06667
    }
  },
  {
    "id": "AUSTRIA_HL_50_100_1000_smooth200m_HL/label/HL13_14_HL",
    "type": "symbol",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_50_100_1000_smooth200m_HL/label",
    "minzoom": 12,
    "maxzoom": 13.91,
    "layout": {
      "symbol-placement": "line",
      "symbol-spacing": 1000,
      "text-font": ["Corbel Bold Italic"],
      "text-size": 12,
      "text-field": "{_name}",
      "text-optional": true
    },
    "paint": {
      "text-color": "#806659",
      "text-halo-color": "rgba(230,230,230,0.5)",
      "text-halo-width": 1.06667
    }
  },
  {
    "id": "AUSTRIA_HL50_100_1000_smooth500m_HL/label/HL_11500er, 1000er",
    "type": "symbol",
    "source": "esri",
    "source-layer": "AUSTRIA_HL50_100_1000_smooth500m_HL/label",
    "filter": ["==", "_label_class", 0],
    "minzoom": 10,
    "maxzoom": 10.91,
    "layout": {
      "symbol-placement": "line",
      "symbol-spacing": 1000,
      "text-font": ["Corbel Bold Italic"],
      "text-size": 13.3333,
      "text-field": "{_name}",
      "text-optional": true
    },
    "paint": {
      "text-color": "#997A6B",
      "text-halo-color": "rgba(220,220,220,0.4)",
      "text-halo-width": 1.06667
    }
  },
  {
    "id": "AUSTRIA_HL50_100_1000_smooth500m_HL/label/HL12_Contour2",
    "type": "symbol",
    "source": "esri",
    "source-layer": "AUSTRIA_HL50_100_1000_smooth500m_HL/label",
    "filter": ["==", "_label_class1", 1],
    "minzoom": 10.91,
    "maxzoom": 11.91,
    "layout": {
      "symbol-placement": "line",
      "symbol-spacing": 1000,
      "text-font": ["Corbel Bold Italic"],
      "text-size": 12,
      "text-field": "{_name1}",
      "text-optional": true
    },
    "paint": {
      "text-color": "#806659",
      "text-halo-color": "rgba(220,220,220,0.5)",
      "text-halo-width": 1.06667
    }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/label/HL18-20_100er",
    "type": "symbol",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/label",
    "filter": ["==", "_label_class2", 2],
    "minzoom": 16,
    "layout": {
      "symbol-placement": "line",
      "symbol-spacing": 1000,
      "text-font": ["Corbel Bold Italic"],
      "text-size": 17.3333,
      "text-field": "{_name2}",
      "text-optional": true
    },
    "paint": {
      "text-color": "#806659",
      "text-halo-color": "rgba(230,230,230,0.5)",
      "text-halo-width": 1.06667
    }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/label/HL18-20_20er",
    "type": "symbol",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/label",
    "filter": ["==", "_label_class3", 3],
    "minzoom": 16,
    "layout": {
      "symbol-placement": "line",
      "symbol-spacing": 1000,
      "text-font": ["Corbel Bold Italic"],
      "text-size": 14.6667,
      "text-field": "{_name3}",
      "text-optional": true
    },
    "paint": {
      "text-color": "#806659",
      "text-halo-color": "rgba(230,230,230,0.5)",
      "text-halo-width": 1.06667
    }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/label/HL17_50er",
    "type": "symbol",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/label",
    "filter": ["==", "_label_class1", 1],
    "minzoom": 16,
    "maxzoom": 16.91,
    "layout": {
      "symbol-placement": "line",
      "symbol-spacing": 1000,
      "text-font": ["Corbel Bold Italic"],
      "text-size": 12,
      "text-field": "{_name1}",
      "text-optional": true
    },
    "paint": {
      "text-color": "#806659",
      "text-halo-color": "rgba(230,230,230,0.5)",
      "text-halo-width": 1.06667
    }
  },
  {
    "id": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/label/HL17_1000er",
    "type": "symbol",
    "source": "esri",
    "source-layer": "AUSTRIA_HL_Gesamt_gen20cm_smooth20m_HL/label",
    "filter": ["==", "_label_class", 0],
    "minzoom": 16,
    "maxzoom": 16.91,
    "layout": {
      "symbol-placement": "line",
      "symbol-spacing": 1000,
      "text-font": ["Corbel Bold Italic"],
      "text-size": 14.6667,
      "text-field": "{_name}",
      "text-optional": true
    },
    "paint": {
      "text-color": "#806659",
      "text-halo-color": "rgba(230,230,230,0.5)",
      "text-halo-width": 1.06667
    }
  }
];

// Create new style keeping all original layers and adding HL on top
const updatedStyle = {
  ...originalBasemap,
  // Update sprite and glyphs for HL layers
  sprite: "https://mapsneu.wien.gv.at/basemapv/bmapvhl/3857/resources/sprites/sprite",
  glyphs: "https://mapsneu.wien.gv.at/basemapv/bmapvhl/3857/resources/fonts/{fontstack}/{range}.pbf",
  sources: {
    ...originalBasemap.sources,
    // Add/update the esri source to support HL layers
    "esri": {
      "type": "vector",
      "tiles": [
        "https://mapsneu.wien.gv.at/basemapv/bmapvhl/3857/tile/{z}/{y}/{x}.pbf"
      ],
      "minzoom": 0,
      "maxzoom": 23
    }
  },
  // Keep all original layers and add HL layers on top
  layers: [...originalBasemap.layers, ...hlLayers]
};

// Write the updated style
fs.writeFileSync('/Users/michael/Development/basemap/basemap8.json', JSON.stringify(updatedStyle, null, 2));

console.log('Successfully updated basemap8.json');
console.log(`- Original layers preserved: ${originalBasemap.layers.length}`);
console.log(`- HL layers added on top: ${hlLayers.length}`);
console.log(`- Total layers: ${updatedStyle.layers.length}`);