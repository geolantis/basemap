#!/bin/bash

# Setup script for creating a public GitHub repository for map styles
# This will create a new repo structure with all the style JSON files

echo "🗺️  Setting up Map Styles Repository"
echo "===================================="

# Configuration
REPO_NAME="basemap-styles"
SOURCE_DIR="/Users/michael/Development/basemap"
TARGET_DIR="/Users/michael/Development/$REPO_NAME"

# Create the new repository directory
echo "📁 Creating repository structure..."
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

# Initialize git repository
echo "🔧 Initializing git repository..."
git init

# Create directory structure
mkdir -p styles
mkdir -p docs

# Copy all style JSON files
echo "📋 Copying style files..."
cp "$SOURCE_DIR"/*.json styles/ 2>/dev/null || true

# Create README
cat > README.md << 'EOF'
# Basemap Styles Repository

Public repository for hosting basemap and overlay style JSON files for Austrian maps.

## Purpose

This repository provides publicly accessible style definitions for various Austrian basemaps and overlays, including:
- Basemap Austria (multiple versions)
- Kataster overlays (BEV, KTN)
- Orthophoto styles
- Regional styles

## Usage

### Direct Access via Raw URLs

All styles can be accessed directly via GitHub raw URLs:

```
https://raw.githubusercontent.com/[YOUR-USERNAME]/basemap-styles/main/styles/[style-name].json
```

Examples:
- `https://raw.githubusercontent.com/[YOUR-USERNAME]/basemap-styles/main/styles/basemap.json`
- `https://raw.githubusercontent.com/[YOUR-USERNAME]/basemap-styles/main/styles/kataster-bev2.json`
- `https://raw.githubusercontent.com/[YOUR-USERNAME]/basemap-styles/main/styles/ovl-kataster.json`

### Available Styles

#### Basemap Styles
- `basemap.json` - Basemap Austria Standard
- `basemap2.json` through `basemap7.json` - Various versions
- `basemap-at-new.json` - New Austria basemap
- `basemap-ortho.json` - Orthophoto basemap
- `basemap-ortho-blue.json` - Blue-tinted orthophoto
- `bm.json` - Minimal basemap (referenced by basemap7)

#### Kataster Styles
- `kataster.json` - Standard Kataster
- `kataster-bev.json` - BEV Kataster v1
- `kataster-bev2.json` - BEV Kataster v2
- `kataster-light.json` - Light theme
- `kataster-ortho.json` - Kataster with orthophoto
- `ovl-kataster.json` - Kataster overlay

#### Regional Styles
- `basemapktn-ortho.json` - Kärnten orthophoto
- `grundstuecke_kataster-ktn-light.json` - KTN Grundstücke light
- `agraratlas.json` - Agricultural atlas

## Integration

### In MapLibre GL JS

```javascript
// Load a basemap style
map.setStyle('https://raw.githubusercontent.com/[YOUR-USERNAME]/basemap-styles/main/styles/basemap.json');

// Or load with local proxy to avoid CORS
map.setStyle('/styles/basemap.json'); // If proxied through your server
```

### With Supabase Integration

Update your `map_configs` table to reference these URLs:

```sql
UPDATE map_configs 
SET style_url = 'https://raw.githubusercontent.com/[YOUR-USERNAME]/basemap-styles/main/styles/kataster-bev2.json'
WHERE name = 'Kataster BEV2';
```

## Style Dependencies

Some styles reference other styles:
- `basemap7.json` → references → `bm.json`

These references are automatically resolved via relative paths in the same repository.

## License

These style definitions are provided for public use with Austrian map services.

## Contributing

To add or update styles, please submit a pull request with:
1. The updated style JSON file
2. Documentation of what changed
3. Testing confirmation

## Related Projects

- [Basemap.at](https://basemap.at)
- [BEV Kataster](https://kataster.bev.gv.at)
- [GIS Kärnten](https://gis.ktn.gv.at)
EOF

# Create a style index file for easy reference
echo "📇 Creating style index..."
cat > styles/index.json << 'EOF'
{
  "basemaps": [
    {
      "id": "basemap",
      "name": "Basemap Austria Standard",
      "url": "basemap.json"
    },
    {
      "id": "basemap2",
      "name": "Basemap Austria v2",
      "url": "basemap2.json"
    },
    {
      "id": "basemap3",
      "name": "Basemap Austria v3",
      "url": "basemap3.json"
    },
    {
      "id": "basemap4",
      "name": "Basemap Austria v4",
      "url": "basemap4.json"
    },
    {
      "id": "basemap5",
      "name": "Basemap Austria v5",
      "url": "basemap5.json"
    },
    {
      "id": "basemap6",
      "name": "Basemap Austria v6",
      "url": "basemap6.json"
    },
    {
      "id": "basemap7",
      "name": "Basemap Austria v7",
      "url": "basemap7.json",
      "dependencies": ["bm.json"]
    },
    {
      "id": "basemap-at-new",
      "name": "Basemap Austria New",
      "url": "basemap-at-new.json"
    },
    {
      "id": "basemap-ortho",
      "name": "Basemap Orthophoto",
      "url": "basemap-ortho.json"
    },
    {
      "id": "basemap-ortho-blue",
      "name": "Basemap Orthophoto Blue",
      "url": "basemap-ortho-blue.json"
    }
  ],
  "overlays": [
    {
      "id": "kataster",
      "name": "Kataster Standard",
      "url": "kataster.json",
      "type": "vector"
    },
    {
      "id": "kataster-bev",
      "name": "Kataster BEV",
      "url": "kataster-bev.json",
      "type": "vector"
    },
    {
      "id": "kataster-bev2",
      "name": "Kataster BEV v2",
      "url": "kataster-bev2.json",
      "type": "vector"
    },
    {
      "id": "ovl-kataster",
      "name": "Overlay Kataster",
      "url": "ovl-kataster.json",
      "type": "vector"
    }
  ],
  "regional": [
    {
      "id": "basemapktn-ortho",
      "name": "Kärnten Orthophoto",
      "url": "basemapktn-ortho.json"
    },
    {
      "id": "grundstuecke-ktn",
      "name": "Grundstücke Kärnten Light",
      "url": "grundstuecke_kataster-ktn-light.json"
    }
  ]
}
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
.DS_Store
node_modules/
*.log
.env
EOF

# Initial commit
echo "📝 Creating initial commit..."
git add .
git commit -m "Initial commit: Austrian basemap and overlay styles

- Added all basemap styles (basemap, basemap2-7, orthophoto variants)
- Added Kataster overlay styles (BEV, KTN)
- Added regional styles
- Created style index for easy reference
- Added comprehensive README with usage instructions"

echo ""
echo "✅ Repository structure created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new PUBLIC repository on GitHub named: $REPO_NAME"
echo "   Go to: https://github.com/new"
echo "   - Name: $REPO_NAME"
echo "   - Visibility: PUBLIC (Important!)"
echo "   - Don't initialize with README (we have one)"
echo ""
echo "2. Add the remote and push:"
echo "   cd $TARGET_DIR"
echo "   git remote add origin https://github.com/[YOUR-USERNAME]/$REPO_NAME.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Update your map_configs in Supabase to use the new URLs:"
echo "   Example: https://raw.githubusercontent.com/[YOUR-USERNAME]/$REPO_NAME/main/styles/kataster-bev2.json"
echo ""
echo "📁 Repository created at: $TARGET_DIR"