# Map Style Storage Setup Guide

Since the GitHub repository is now public and direct raw URLs don't work, we're implementing a Supabase-based storage solution for map styles.

## Setup Instructions

### Step 1: Create the Database Table

1. Go to your Supabase SQL Editor:
   https://app.supabase.com/project/wphrytrrikfkwehwahqc/sql/new

2. Copy and paste the SQL from `scripts/create-styles-table.sql` or use this:

```sql
-- Create table for storing map style JSON files
CREATE TABLE IF NOT EXISTS map_styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  style_json JSONB NOT NULL,
  is_overlay BOOLEAN DEFAULT false,
  dependencies TEXT[], -- List of other style names this style depends on
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_map_styles_name ON map_styles(name);
CREATE INDEX IF NOT EXISTS idx_map_styles_overlay ON map_styles(is_overlay);

-- Add a column to map_configs to reference stored styles
ALTER TABLE map_configs 
ADD COLUMN IF NOT EXISTS style_name TEXT REFERENCES map_styles(name);
```

3. Click "Run" to create the table

### Step 2: Import Style Files

After creating the table, run:

```bash
cd /Users/michael/Development/basemap/map-config-service/web
node scripts/setup-style-storage.js
```

This will import all style JSON files from your local basemap repository into Supabase.

### Step 3: Update Your Application

The application now has two ways to access styles:

#### Option A: Direct Database Access (Frontend)
```javascript
import { getStyle } from './src/api/styles';

// Load a style from Supabase
const style = await getStyle('kataster-bev2');
map.setStyle(style);
```

#### Option B: API Endpoint (For External Access)
Create an API endpoint at `/api/styles/:styleName` that serves the styles.

### Benefits of This Approach

1. **No External Dependencies**: All styles are stored in your Supabase database
2. **Handles References**: Automatically resolves references between styles (e.g., basemap7.json → bm.json)
3. **CORS-Friendly**: Served from your own domain with proper proxy configuration
4. **Versioned**: Can track changes and updates to styles
5. **Fast**: Cached for performance

### How It Works

1. **Storage**: Style JSON files are stored in the `map_styles` table
2. **References**: Dependencies between styles are tracked and resolved
3. **Proxy**: Vector tile URLs are automatically proxied through Vite config to avoid CORS
4. **Caching**: Styles are cached in memory for 5 minutes to reduce database calls

### Testing

Once set up, test with:

1. Open http://localhost:5173/vector-overlay-inspector.html
2. Click "Test Kataster Proxy" to test vector overlays
3. The styles will be loaded from Supabase and tiles proxied through Vite

### Files Created

- `scripts/setup-style-storage.js` - Imports styles to Supabase
- `scripts/create-styles-table.sql` - SQL to create the table
- `src/api/styles.js` - API for fetching styles
- `vector-overlay-inspector.html` - Test page for vector overlays

### Next Steps

1. Run the SQL to create the table
2. Import the styles using the script
3. Update map_configs to reference stored styles using `style_name` column
4. Test with the vector overlay inspector

This solution elegantly handles the GitHub raw URL issue while providing better control and performance.