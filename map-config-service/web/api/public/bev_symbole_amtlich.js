/**
 * Static endpoint for BEV Symbole Amtlich style
 * This is a workaround for the dynamic route issue
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const style = {
    "version": 8,
    "name": "BEV Symbole amtlich (Vermessungsverordnung)",
    "metadata": {"maputnik:renderer": "mlgljs"},
    "sources": {
      "kataster": {
        "type": "vector",
        "url": "https://kataster.bev.gv.at/styles/kataster/tiles.json"
      }
    },
    "sprite": "https://kataster.bev.gv.at/styles/sprite",
    "glyphs": "https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=ldV32HV5eBdmgfE7vZJI",
    "layers": [
      {
        "id": "Landwirtschaftlich genutzte Grundflächen",
        "type": "fill",
        "source": "kataster",
        "source-layer": "nfl",
        "filter": ["==", "ns", 40],
        "paint": {"fill-color": "#badd69", "fill-opacity": 0.3}
      },
      {
        "id": "Gewässer",
        "type": "fill",
        "source": "kataster",
        "source-layer": "nfl",
        "filter": ["==", "ns", 20],
        "paint": {"fill-color": "#6bb6ff", "fill-opacity": 0.8}
      },
      {
        "id": "Bauflächen",
        "type": "fill",
        "source": "kataster",
        "source-layer": "nfl",
        "filter": ["==", "ns", 10],
        "paint": {"fill-color": "#ff9999", "fill-opacity": 0.5}
      },
      {
        "id": "Grundstücksgrenzen",
        "type": "line",
        "source": "kataster",
        "source-layer": "gst",
        "paint": {
          "line-color": "#333333",
          "line-width": 1,
          "line-opacity": 0.8
        }
      },
      {
        "id": "Grenzpunkte",
        "type": "circle",
        "source": "kataster",
        "source-layer": "gp",
        "paint": {
          "circle-color": "#ff0000",
          "circle-radius": 2,
          "circle-opacity": 0.9
        }
      },
      {
        "id": "Symbole",
        "type": "symbol",
        "source": "kataster",
        "source-layer": "vermessungspunkt",
        "layout": {
          "icon-image": "vermessungspunkt",
          "icon-size": 0.8,
          "text-field": "{bezeichnung}",
          "text-font": ["Open Sans Regular"],
          "text-size": 10,
          "text-offset": [0, 1.5],
          "text-anchor": "top"
        },
        "paint": {
          "text-color": "#000000",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1
        }
      }
    ]
  };

  return res.status(200).json(style);
}