# Maputnik Integration Plan - Style Editing Workflow

## Current State Analysis

### Problem Statement
When editing a map style in Maputnik:
1. Users can modify the style visually
2. They must download the modified style.json file manually
3. There's no direct path to get this edited style back into the map configuration system
4. The edited style needs to be hosted somewhere accessible
5. The map config database needs to be updated with the new style URL

### Current Manual Workflow
1. **Edit in Maputnik** → Opens style in editor
2. **Make changes** → Visual editing of style
3. **Export** → Download as style.json file
4. **??? Gap ???** → No clear path forward
5. **Need to host** → File needs to be accessible via URL
6. **Update database** → Map config needs new style URL

## Proposed Solution Architecture

### Option 1: Direct Save Integration (Recommended)
**Automated workflow with minimal user interaction**

#### Components Needed:
1. **Style Storage Service**
   - Endpoint: `POST /api/styles/save`
   - Stores uploaded style JSON files
   - Returns public URL for the saved style
   - Could use Vercel Blob Storage or Supabase Storage

2. **Maputnik Save Button Integration**
   - Custom save handler in the app
   - When user clicks "Save" in map preview
   - Fetches current Maputnik state via postMessage API
   - Sends style to storage service
   - Updates map config with new URL

3. **Database Update Flow**
   ```
   Maputnik → Save Button → Storage Service → Database → Reload Map
   ```

#### Implementation Steps:
1. Create storage endpoint in existing server
2. Add "Save from Maputnik" button in MapPreview
3. Implement cross-window communication
4. Update map config with new style URL
5. Refresh map preview automatically

### Option 2: Upload Interface
**Semi-automated with file upload step**

#### Components:
1. **Upload UI in Config Editor**
   - "Upload Custom Style" button
   - File picker for .json files
   - Preview before saving

2. **Style Hosting Service**
   - Store in `/public/custom-styles/`
   - Or use cloud storage (Vercel Blob)
   - Generate unique URLs

3. **Workflow:**
   ```
   Edit in Maputnik → Download JSON → Upload to App → Auto-save & Update
   ```

### Option 3: GitHub Integration
**Version-controlled style management**

#### Components:
1. **GitHub Repository for Styles**
   - Fork of basemap repo
   - `/styles/custom/` directory
   - Automatic PR creation

2. **GitHub API Integration**
   - Commit style file
   - Create PR
   - Get raw GitHub URL
   - Update database

3. **Workflow:**
   ```
   Maputnik → Download → Upload → GitHub Commit → PR → Merge → Update URL
   ```

## Recommended Implementation Plan

### Phase 1: Storage Infrastructure (Week 1)
- [ ] Set up Vercel Blob Storage or Supabase Storage bucket
- [ ] Create API endpoint for style upload
- [ ] Implement unique naming/versioning system
- [ ] Add CORS headers for Maputnik access

### Phase 2: Upload Interface (Week 1)
- [ ] Add "Upload Style" button to MapCard/ConfigEditor
- [ ] Create upload modal with drag-drop
- [ ] Validate JSON structure
- [ ] Show preview of style metadata
- [ ] Save to storage and update database

### Phase 3: Direct Integration (Week 2)
- [ ] Research Maputnik's postMessage API
- [ ] Create browser extension or bookmarklet
- [ ] Implement "Save to Map Config" button
- [ ] Handle authentication/authorization
- [ ] Test cross-origin communication

### Phase 4: Advanced Features (Week 3)
- [ ] Version history for styles
- [ ] Diff viewer for changes
- [ ] Rollback functionality
- [ ] Share/collaborate features
- [ ] Style templates library

## Technical Architecture

### Storage Options Comparison

| Feature | Vercel Blob | Supabase Storage | GitHub | Custom Server |
|---------|------------|------------------|---------|---------------|
| Setup Complexity | Low | Medium | Medium | High |
| Cost | Pay per GB | Free tier available | Free | Server costs |
| Version Control | Manual | Manual | Automatic | Manual |
| CDN | Included | Available | Raw URLs | Need CDN |
| Access Control | API Keys | RLS Policies | Public/Private | Custom |
| Direct URL | Yes | Yes | Yes (raw) | Yes |

### Database Schema Updates

```sql
-- Add style versioning
ALTER TABLE map_configs ADD COLUMN style_version INTEGER DEFAULT 1;
ALTER TABLE map_configs ADD COLUMN custom_style_url TEXT;
ALTER TABLE map_configs ADD COLUMN style_updated_at TIMESTAMP;
ALTER TABLE map_configs ADD COLUMN style_updated_by TEXT;

-- Style history table
CREATE TABLE style_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_config_id UUID REFERENCES map_configs(id),
  style_url TEXT NOT NULL,
  style_data JSONB,
  version INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT,
  change_summary TEXT
);
```

### API Endpoints Needed

```typescript
// Style management endpoints
POST   /api/styles/upload      // Upload new style file
GET    /api/styles/:id         // Get style by ID
PUT    /api/styles/:id         // Update existing style
DELETE /api/styles/:id         // Delete style
GET    /api/styles/:id/history // Get version history

// Map config style endpoints  
POST   /api/maps/:id/style     // Update map's style URL
GET    /api/maps/:id/style     // Get current style
POST   /api/maps/:id/style/revert // Revert to previous version
```

## Quick Win: Immediate Solution

### Manual Process Documentation (Can implement today)

1. **Create a `custom-styles` directory** in the web project:
   ```
   /web/public/custom-styles/
   ```

2. **Document the process** for users:
   - Edit style in Maputnik
   - Click Export → Download
   - Save as `[mapname]-[version].json`
   - Place in `/web/public/custom-styles/`
   - Update map config with URL: `/custom-styles/[mapname]-[version].json`
   - Commit and deploy

3. **Add helper UI** in ConfigEditor:
   - Text field: "Custom Style Path"
   - Instructions panel
   - Validation for URL format
   - Test button to verify style loads

## Security Considerations

1. **Validation**
   - Validate JSON structure
   - Check for malicious code
   - Limit file size (max 10MB)
   - Sanitize style names

2. **Access Control**
   - Only authenticated users can upload
   - Rate limiting on uploads
   - Audit trail of changes

3. **CORS Configuration**
   - Allow Maputnik domain
   - Restrict other origins
   - Handle preflight requests

## Success Metrics

- Time from edit to deployment: < 2 minutes
- Number of manual steps: < 3
- Style versioning enabled: Yes
- Rollback capability: Yes
- User training required: Minimal

## Next Steps

1. **Immediate** (Today):
   - Create custom-styles directory
   - Document manual process
   - Add instructions to UI

2. **Short-term** (This Week):
   - Implement upload interface
   - Set up storage solution
   - Create API endpoints

3. **Medium-term** (Next 2 Weeks):
   - Direct Maputnik integration
   - Version history UI
   - Automated testing

4. **Long-term** (Month):
   - Collaborative editing
   - Style marketplace
   - AI-assisted style generation

## Alternative: Maputnik Fork

Consider forking Maputnik to add direct integration:
- Add "Save to Map Config" button
- Implement OAuth with your app
- Direct API calls to your backend
- Custom UI elements
- Hosted on your domain

This would provide the most seamless experience but requires maintaining a fork.

## Conclusion

The recommended approach is to start with **Option 2 (Upload Interface)** as it provides immediate value with reasonable implementation effort. Then progressively enhance toward **Option 1 (Direct Save)** for the best user experience.

The key is to reduce friction in the workflow:
- Current: Edit → Download → ??? → Manual work → Update
- Target: Edit → Save → Automatic update → Done

This plan provides both quick wins and a path to full automation.