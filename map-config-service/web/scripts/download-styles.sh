#!/bin/bash

# Create styles directory
mkdir -p public/styles

# Download all style files from the private repository
# Note: You'll need to be authenticated or do this while the repo is still public

STYLES=(
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/osmliberty.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/maptiler3d.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap-ortho.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemapktn-ortho.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster-light.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster-ortho.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap-ortho-blue.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/bev-katasterlight.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap-at-new.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/agraratlas.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap2.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap3.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/basemap7.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/de_brandenburg.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/plan_ign.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/nz-basemap-topographic.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/nz-topolite-ortho.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/nzortho.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kiinteistojaotus-taustakartalla.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster-bev2.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/kataster-bev.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/grundstuecke_kataster-ktn-light.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/ovl-kataster.json"
  "https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/nz-parcels.json"
)

for url in "${STYLES[@]}"; do
  filename=$(basename "$url")
  echo "Downloading $filename..."
  curl -H "Authorization: Bearer $GITHUB_TOKEN" \
       -H "Accept: application/vnd.github.v3.raw" \
       -L "$url" \
       -o "public/styles/$filename"
done

echo "✅ All style files downloaded!"
