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

-- Add a trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_map_styles_updated_at 
  BEFORE UPDATE ON map_styles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add a column to map_configs to reference stored styles
ALTER TABLE map_configs 
ADD COLUMN IF NOT EXISTS style_name TEXT REFERENCES map_styles(name);

-- Create a view for easy access to maps with their styles
CREATE OR REPLACE VIEW maps_with_styles AS
SELECT 
  mc.*,
  ms.style_json as stored_style,
  ms.dependencies as style_dependencies
FROM map_configs mc
LEFT JOIN map_styles ms ON mc.style_name = ms.name;