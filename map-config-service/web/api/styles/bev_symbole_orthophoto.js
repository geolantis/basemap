/**
 * Static endpoint for BEV Symbole Orthophoto style
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
    "name": "BEV Symbole + Orthophoto optimiert",
    "metadata": {"maputnik:renderer": "mlgljs"},
    "sources": {
      "kataster": {
        "type": "vector",
        "url": "https://kataster.bev.gv.at/styles/kataster/tiles.json"
      },
      "orthophoto": {
        "type": "raster",
        "tiles": ["https://maps1.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg"],
        "tileSize": 256,
        "maxzoom": 19,
        "attribution": "© basemap.at"
      }
    },
    "sprite": "https://kataster.bev.gv.at/styles/sprite",
    "glyphs": "https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=ldV32HV5eBdmgfE7vZJI",
    "layers": [
      {
        "id": "orthophoto",
        "type": "raster",
        "source": "orthophoto",
        "minzoom": 0,
        "maxzoom": 22,
        "paint": {
          "raster-opacity": 1
        }
      },
      {
        "id": "Grundstücksgrenzen",
        "type": "line",
        "source": "kataster",
        "source-layer": "gst",
        "paint": {
          "line-color": "#ff0000",
          "line-width": 2,
          "line-opacity": 0.9
        }
      },
      {
        "id": "Grenzpunkte",
        "type": "circle",
        "source": "kataster",
        "source-layer": "gp",
        "paint": {
          "circle-color": "#ff0000",
          "circle-radius": 3,
          "circle-opacity": 1,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1
        }
      },
      {
        "id": "Symbole",
        "type": "symbol",
        "source": "kataster",
        "source-layer": "vermessungspunkt",
        "layout": {
          "icon-image": "vermessungspunkt",
          "icon-size": 1.0,
          "text-field": "{bezeichnung}",
          "text-font": ["Open Sans Bold"],
          "text-size": 11,
          "text-offset": [0, 1.5],
          "text-anchor": "top"
        },
        "paint": {
          "text-color": "#000000",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2
        }
      }
    ]
  };

  return res.status(200).json(style);
}