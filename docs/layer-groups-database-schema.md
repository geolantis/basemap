# Layer Groups Database Schema Documentation

This document describes the database schema required for the Layer Groups feature in the Basemap API.

## Overview

The Layer Groups feature allows users to create collections of map overlays that can be managed as a single unit. This includes:

- Creating, updating, and deleting layer groups
- Adding and removing overlays from groups
- Managing overlay properties (position, opacity, visibility)
- Uploading preview images for layer groups

## Database Tables

### 1. layer_groups

The main table that stores layer group metadata.

```sql
CREATE TABLE layer_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    preview_image_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT layer_groups_name_check CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT layer_groups_description_check CHECK (description IS NULL OR LENGTH(description) <= 500),
    CONSTRAINT layer_groups_user_name_unique UNIQUE (user_id, name, is_active)
);
```

**Indexes:**
```sql
-- Performance indexes
CREATE INDEX idx_layer_groups_user_id ON layer_groups(user_id);
CREATE INDEX idx_layer_groups_is_active ON layer_groups(is_active);
CREATE INDEX idx_layer_groups_is_featured ON layer_groups(is_featured);
CREATE INDEX idx_layer_groups_created_at ON layer_groups(created_at DESC);
CREATE INDEX idx_layer_groups_updated_at ON layer_groups(updated_at DESC);

-- Search indexes
CREATE INDEX idx_layer_groups_tags ON layer_groups USING GIN(tags);
CREATE INDEX idx_layer_groups_name_trgm ON layer_groups USING GIN(name gin_trgm_ops);
CREATE INDEX idx_layer_groups_description_trgm ON layer_groups USING GIN(description gin_trgm_ops);
```

### 2. layer_group_overlays

Junction table that links layer groups with map overlays and stores overlay-specific properties.

```sql
CREATE TABLE layer_group_overlays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    layer_group_id UUID NOT NULL REFERENCES layer_groups(id) ON DELETE CASCADE,
    overlay_id UUID NOT NULL REFERENCES map_configs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    opacity DECIMAL(3,2) DEFAULT 0.70 CHECK (opacity >= 0 AND opacity <= 1),
    is_visible BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT layer_group_overlays_position_check CHECK (position >= 0 AND position < 1000),
    CONSTRAINT layer_group_overlays_unique_active UNIQUE (layer_group_id, overlay_id, is_active)
);
```

**Indexes:**
```sql
-- Performance indexes
CREATE INDEX idx_layer_group_overlays_layer_group_id ON layer_group_overlays(layer_group_id);
CREATE INDEX idx_layer_group_overlays_overlay_id ON layer_group_overlays(overlay_id);
CREATE INDEX idx_layer_group_overlays_position ON layer_group_overlays(layer_group_id, position);
CREATE INDEX idx_layer_group_overlays_is_active ON layer_group_overlays(is_active);
```

## Database Functions

### Position Management Functions

These functions help manage overlay positions within layer groups:

```sql
-- Function to shift overlay positions up or down
CREATE OR REPLACE FUNCTION shift_overlay_positions(
    p_layer_group_id UUID,
    p_start_position INTEGER,
    p_shift_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE layer_group_overlays
    SET position = position + p_shift_amount,
        updated_at = NOW()
    WHERE layer_group_id = p_layer_group_id
      AND position >= p_start_position
      AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to shift positions within a range
CREATE OR REPLACE FUNCTION shift_overlay_positions_range(
    p_layer_group_id UUID,
    p_start_position INTEGER,
    p_end_position INTEGER,
    p_shift_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE layer_group_overlays
    SET position = position + p_shift_amount,
        updated_at = NOW()
    WHERE layer_group_id = p_layer_group_id
      AND position >= p_start_position
      AND position <= p_end_position
      AND is_active = true;
END;
$$ LANGUAGE plpgsql;
```

### Cleanup Functions

```sql
-- Function to clean up inactive records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_inactive_layer_groups()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete layer groups that have been inactive for more than 30 days
    DELETE FROM layer_groups
    WHERE is_active = false
      AND updated_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### Automatic Timestamp Updates

```sql
-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to layer_groups table
CREATE TRIGGER update_layer_groups_updated_at
    BEFORE UPDATE ON layer_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to layer_group_overlays table
CREATE TRIGGER update_layer_group_overlays_updated_at
    BEFORE UPDATE ON layer_group_overlays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Layer Group Updates on Overlay Changes

```sql
-- Trigger to update layer group timestamp when overlays change
CREATE OR REPLACE FUNCTION update_layer_group_on_overlay_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the parent layer group's timestamp
    UPDATE layer_groups
    SET updated_at = NOW()
    WHERE id = COALESCE(NEW.layer_group_id, OLD.layer_group_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_layer_group_on_overlay_change
    AFTER INSERT OR UPDATE OR DELETE ON layer_group_overlays
    FOR EACH ROW
    EXECUTE FUNCTION update_layer_group_on_overlay_change();
```

## Row Level Security (RLS)

Enable RLS to ensure users can only access their own layer groups:

```sql
-- Enable RLS on layer_groups
ALTER TABLE layer_groups ENABLE ROW LEVEL SECURITY;

-- Policy for layer groups: users can only see/modify their own
CREATE POLICY "Users can view their own layer groups" ON layer_groups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own layer groups" ON layer_groups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own layer groups" ON layer_groups
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own layer groups" ON layer_groups
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on layer_group_overlays
ALTER TABLE layer_group_overlays ENABLE ROW LEVEL SECURITY;

-- Policy for overlays: users can only modify overlays in their own layer groups
CREATE POLICY "Users can view overlays in their layer groups" ON layer_group_overlays
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM layer_groups
            WHERE layer_groups.id = layer_group_overlays.layer_group_id
            AND layer_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert overlays in their layer groups" ON layer_group_overlays
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM layer_groups
            WHERE layer_groups.id = layer_group_overlays.layer_group_id
            AND layer_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update overlays in their layer groups" ON layer_group_overlays
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM layer_groups
            WHERE layer_groups.id = layer_group_overlays.layer_group_id
            AND layer_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete overlays in their layer groups" ON layer_group_overlays
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM layer_groups
            WHERE layer_groups.id = layer_group_overlays.layer_group_id
            AND layer_groups.user_id = auth.uid()
        )
    );
```

## Storage Setup

For preview image storage, ensure the Supabase Storage bucket is configured:

```sql
-- Create storage bucket for layer group previews
INSERT INTO storage.buckets (id, name, public)
VALUES ('layer-group-previews', 'layer-group-previews', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload layer group previews" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'layer-group-previews'
        AND auth.role() = 'authenticated'
    );

-- Allow users to update their own files
CREATE POLICY "Users can update their own layer group previews" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'layer-group-previews'
        AND auth.role() = 'authenticated'
    );

-- Allow public read access to preview images
CREATE POLICY "Public read access to layer group previews" ON storage.objects
    FOR SELECT USING (bucket_id = 'layer-group-previews');
```

## Data Relationships

### Foreign Key Relationships

- `layer_groups.user_id` → `auth.users.id`
- `layer_group_overlays.layer_group_id` → `layer_groups.id`
- `layer_group_overlays.overlay_id` → `map_configs.id`

### Business Rules

1. **Soft Deletes**: Records are marked as `is_active = false` instead of being physically deleted
2. **Unique Names**: Layer group names must be unique per user (when active)
3. **Position Management**: Overlay positions are automatically managed to prevent gaps
4. **Overlay Validation**: Only map configs marked as overlays (`metadata->>'isOverlay' = 'true'`) can be added to layer groups
5. **User Isolation**: Users can only access their own layer groups through RLS policies

## Performance Considerations

1. **Indexes**: Comprehensive indexing for user queries, filtering, and sorting
2. **Materialized Views**: Consider creating materialized views for complex aggregations
3. **Partitioning**: For large datasets, consider partitioning by user_id or created_at
4. **Connection Pooling**: Use connection pooling for high-traffic scenarios

## Migration Scripts

See the separate SQL setup files for step-by-step migration scripts to implement this schema in an existing database.

## API Endpoints That Use This Schema

- `GET /api/layer-groups` - Lists layer groups with filtering
- `POST /api/layer-groups` - Creates new layer groups
- `GET /api/layer-groups/[id]` - Gets single layer group with overlays
- `PUT /api/layer-groups/[id]` - Updates layer group metadata
- `DELETE /api/layer-groups/[id]` - Soft deletes layer group
- `POST /api/layer-groups/[id]/overlays` - Adds overlay to layer group
- `DELETE /api/layer-groups/[id]/overlays/[overlayId]` - Removes overlay from layer group
- `POST /api/layer-groups/[id]/preview` - Uploads preview image

## Testing Considerations

1. **Unit Tests**: Test all constraints, triggers, and functions
2. **Integration Tests**: Test complete workflows through the API
3. **Performance Tests**: Test with realistic data volumes
4. **Security Tests**: Verify RLS policies work correctly
5. **Data Integrity Tests**: Test cascade deletes and referential integrity