# Layer Groups API Documentation

This document provides comprehensive documentation for the Layer Groups API endpoints, including request/response examples, authentication, and error handling.

## Base URL

```
https://your-domain.com/api/layer-groups
```

## Authentication

All endpoints require JWT authentication via the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

The JWT token should contain a `userId` field that identifies the authenticated user.

## Content Type

All requests and responses use `application/json` content type unless otherwise specified.

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": ["Detailed error messages"] // Optional array for validation errors
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Missing or invalid authentication token
- `FORBIDDEN` (403) - User doesn't have permission to access the resource
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Request validation failed
- `DUPLICATE_NAME` (409) - Layer group name already exists
- `METHOD_NOT_ALLOWED` (405) - HTTP method not allowed
- `INTERNAL_ERROR` (500) - Server error

---

## Endpoints

### 1. List Layer Groups

Get a paginated list of layer groups with optional filtering.

**Endpoint:** `GET /api/layer-groups`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Number of results per page (1-100) |
| `offset` | integer | 0 | Number of results to skip |
| `is_active` | boolean | true | Filter by active status |
| `is_featured` | boolean | - | Filter by featured status |
| `tags` | string/array | - | Filter by tags (comma-separated or array) |
| `search` | string | - | Search in name and description |
| `sort_by` | string | created_at | Sort field: `created_at`, `updated_at`, `name` |
| `sort_order` | string | desc | Sort order: `asc`, `desc` |

**Request Example:**

```http
GET /api/layer-groups?limit=10&is_featured=true&tags=urban,planning&search=overlay
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Urban Planning Overlays",
      "description": "Collection of overlays for urban planning analysis",
      "tags": ["urban", "planning", "zoning"],
      "is_featured": true,
      "is_active": true,
      "preview_image_url": "https://storage.supabase.com/layer-group-previews/preview.jpg",
      "metadata": {
        "category": "planning",
        "difficulty": "intermediate"
      },
      "overlays": [
        {
          "id": "overlay-uuid-1",
          "position": 0,
          "opacity": 0.7,
          "is_visible": true,
          "layer": {
            "id": "layer-uuid-1",
            "name": "zoning-boundaries",
            "label": "Zoning Boundaries",
            "type": "vtc",
            "country": "US",
            "preview_image_url": "https://example.com/preview.jpg",
            "metadata": {
              "isOverlay": true
            }
          }
        }
      ],
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-16T14:45:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  },
  "filters": {
    "is_active": true,
    "is_featured": true,
    "tags": ["urban", "planning"],
    "search": "overlay"
  }
}
```

---

### 2. Create Layer Group

Create a new layer group.

**Endpoint:** `POST /api/layer-groups`

**Request Body:**

```json
{
  "name": "My Layer Group",
  "description": "Description of the layer group",
  "tags": ["tag1", "tag2"],
  "is_featured": false,
  "preview_image_url": "https://example.com/preview.jpg",
  "metadata": {
    "category": "custom",
    "author": "John Doe"
  }
}
```

**Required Fields:**
- `name` (string, 1-100 characters)
- `description` (string, max 500 characters)

**Optional Fields:**
- `tags` (array of strings, max 20 tags, each max 50 characters)
- `is_featured` (boolean, default: false)
- `preview_image_url` (string, valid URL or null)
- `metadata` (object, arbitrary JSON data)

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "My Layer Group",
    "description": "Description of the layer group",
    "tags": ["tag1", "tag2"],
    "is_featured": false,
    "is_active": true,
    "preview_image_url": "https://example.com/preview.jpg",
    "metadata": {
      "category": "custom",
      "author": "John Doe"
    },
    "overlays": [],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Layer group created successfully"
}
```

**Error Examples:**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    "Name is required and must be a non-empty string",
    "Description must be 500 characters or less"
  ]
}
```

```json
{
  "success": false,
  "message": "A layer group with this name already exists",
  "code": "DUPLICATE_NAME"
}
```

---

### 3. Get Single Layer Group

Get detailed information about a specific layer group including all overlays.

**Endpoint:** `GET /api/layer-groups/{id}`

**Path Parameters:**
- `id` (UUID) - Layer group ID

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Urban Planning Overlays",
    "description": "Collection of overlays for urban planning analysis",
    "tags": ["urban", "planning", "zoning"],
    "is_featured": true,
    "is_active": true,
    "preview_image_url": "https://storage.supabase.com/layer-group-previews/preview.jpg",
    "metadata": {
      "category": "planning"
    },
    "overlays": [
      {
        "id": "overlay-uuid-1",
        "position": 0,
        "opacity": 0.8,
        "is_visible": true,
        "created_at": "2024-01-15T10:30:00Z",
        "layer": {
          "id": "layer-uuid-1",
          "name": "zoning-boundaries",
          "label": "Zoning Boundaries",
          "type": "vtc",
          "country": "US",
          "preview_image_url": "https://example.com/preview.jpg",
          "metadata": {
            "isOverlay": true,
            "opacity": 0.8
          },
          "is_active": true
        }
      },
      {
        "id": "overlay-uuid-2",
        "position": 1,
        "opacity": 0.6,
        "is_visible": false,
        "created_at": "2024-01-15T11:00:00Z",
        "layer": {
          "id": "layer-uuid-2",
          "name": "building-heights",
          "label": "Building Heights",
          "type": "vtc",
          "country": "US",
          "preview_image_url": "https://example.com/preview2.jpg",
          "metadata": {
            "isOverlay": true
          },
          "is_active": true
        }
      }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T14:45:00Z"
  }
}
```

---

### 4. Update Layer Group

Update an existing layer group's metadata.

**Endpoint:** `PUT /api/layer-groups/{id}`

**Request Body:**

```json
{
  "name": "Updated Layer Group Name",
  "description": "Updated description",
  "tags": ["updated", "tags"],
  "is_featured": true,
  "metadata": {
    "category": "advanced",
    "updated": true
  }
}
```

**All fields are optional** - only provided fields will be updated.

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Updated Layer Group Name",
    "description": "Updated description",
    "tags": ["updated", "tags"],
    "is_featured": true,
    "is_active": true,
    "preview_image_url": "https://storage.supabase.com/layer-group-previews/preview.jpg",
    "metadata": {
      "category": "advanced",
      "updated": true
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T16:20:00Z"
  },
  "message": "Layer group updated successfully"
}
```

---

### 5. Delete Layer Group

Soft delete a layer group (sets `is_active` to `false`).

**Endpoint:** `DELETE /api/layer-groups/{id}`

**Response Example:**

```json
{
  "success": true,
  "message": "Layer group deleted successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "deleted_at": "2024-01-16T16:25:00Z"
  }
}
```

---

### 6. Get Layer Group Overlays

Get all overlays in a specific layer group.

**Endpoint:** `GET /api/layer-groups/{id}/overlays`

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "overlay-uuid-1",
      "overlay_id": "layer-uuid-1",
      "position": 0,
      "opacity": 0.8,
      "is_visible": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T12:00:00Z",
      "layer": {
        "id": "layer-uuid-1",
        "name": "zoning-boundaries",
        "label": "Zoning Boundaries",
        "type": "vtc",
        "country": "US",
        "preview_image_url": "https://example.com/preview.jpg",
        "metadata": {
          "isOverlay": true
        }
      }
    }
  ],
  "count": 1,
  "layer_group_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

### 7. Add Overlay to Layer Group

Add a map overlay to a layer group.

**Endpoint:** `POST /api/layer-groups/{id}/overlays`

**Request Body:**

```json
{
  "overlay_id": "layer-uuid-1",
  "position": 0,
  "opacity": 0.7,
  "is_visible": true
}
```

**Required Fields:**
- `overlay_id` (UUID) - ID of the map config to add as overlay

**Optional Fields:**
- `position` (integer, 0-999) - Position in the layer stack (auto-assigned if not provided)
- `opacity` (decimal, 0-1, default: 0.7) - Overlay opacity
- `is_visible` (boolean, default: true) - Whether overlay is visible

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "overlay-uuid-1",
    "overlay_id": "layer-uuid-1",
    "position": 0,
    "opacity": 0.7,
    "is_visible": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "layer": {
      "id": "layer-uuid-1",
      "name": "zoning-boundaries",
      "label": "Zoning Boundaries",
      "type": "vtc",
      "country": "US",
      "preview_image_url": "https://example.com/preview.jpg",
      "metadata": {
        "isOverlay": true
      }
    }
  },
  "message": "Overlay added to layer group successfully"
}
```

**Error Examples:**

```json
{
  "success": false,
  "message": "Overlay not found or is not active",
  "code": "OVERLAY_NOT_FOUND"
}
```

```json
{
  "success": false,
  "message": "The specified map is not configured as an overlay",
  "code": "NOT_AN_OVERLAY"
}
```

```json
{
  "success": false,
  "message": "Overlay is already in this layer group",
  "code": "OVERLAY_EXISTS"
}
```

---

### 8. Update Overlay in Layer Group

Update properties of an overlay within a layer group.

**Endpoint:** `PUT /api/layer-groups/{id}/overlays/{overlayId}`

**Request Body:**

```json
{
  "position": 1,
  "opacity": 0.9,
  "is_visible": false
}
```

**All fields are optional** - only provided fields will be updated.

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "overlay-uuid-1",
    "overlay_id": "layer-uuid-1",
    "position": 1,
    "opacity": 0.9,
    "is_visible": false,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T16:30:00Z",
    "layer": {
      "id": "layer-uuid-1",
      "name": "zoning-boundaries",
      "label": "Zoning Boundaries",
      "type": "vtc",
      "country": "US",
      "preview_image_url": "https://example.com/preview.jpg",
      "metadata": {
        "isOverlay": true
      }
    }
  },
  "message": "Overlay updated successfully"
}
```

---

### 9. Remove Overlay from Layer Group

Remove an overlay from a layer group.

**Endpoint:** `DELETE /api/layer-groups/{id}/overlays/{overlayId}`

**Response Example:**

```json
{
  "success": true,
  "message": "Overlay removed from layer group successfully",
  "data": {
    "id": "overlay-uuid-1",
    "layer_group_id": "123e4567-e89b-12d3-a456-426614174000",
    "removed_at": "2024-01-16T16:35:00Z"
  }
}
```

---

### 10. Upload Preview Image

Upload a preview image for a layer group.

**Endpoint:** `POST /api/layer-groups/{id}/preview`

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `preview` or `file` or `image` (file) - Image file to upload

**File Requirements:**
- **Formats:** JPEG, PNG, WebP
- **Size:** 1KB - 5MB
- **Extensions:** .jpg, .jpeg, .png, .webp

**Request Example:**

```http
POST /api/layer-groups/123e4567-e89b-12d3-a456-426614174000/preview
Content-Type: multipart/form-data
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

--boundary
Content-Disposition: form-data; name="preview"; filename="preview.jpg"
Content-Type: image/jpeg

[binary image data]
--boundary--
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Urban Planning Overlays",
    "preview_image_url": "https://storage.supabase.com/layer-group-previews/layer-group-123e4567-preview-1642678934-a1b2c3.jpg",
    "updated_at": "2024-01-16T16:40:00Z"
  },
  "upload": {
    "filename": "layer-group-123e4567-preview-1642678934-a1b2c3.jpg",
    "originalName": "preview.jpg",
    "size": 245760,
    "mimetype": "image/jpeg",
    "url": "https://storage.supabase.com/layer-group-previews/layer-group-123e4567-preview-1642678934-a1b2c3.jpg"
  },
  "message": "Preview image uploaded successfully"
}
```

**Error Examples:**

```json
{
  "success": false,
  "message": "No preview image file uploaded",
  "code": "NO_FILE"
}
```

```json
{
  "success": false,
  "message": "File validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    "File size must be less than 5MB",
    "Only JPEG, PNG, and WebP images are allowed"
  ]
}
```

```json
{
  "success": false,
  "message": "File too large. Maximum size is 5MB",
  "code": "FILE_TOO_LARGE"
}
```

---

## Usage Examples

### JavaScript/Node.js

```javascript
// List layer groups with filtering
const response = await fetch('/api/layer-groups?is_featured=true&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Create a new layer group
const newGroup = await fetch('/api/layer-groups', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Planning Layers',
    description: 'Urban planning overlay collection',
    tags: ['planning', 'urban', 'zoning'],
    is_featured: false
  })
});

// Add overlay to layer group
const overlay = await fetch(`/api/layer-groups/${groupId}/overlays`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    overlay_id: 'overlay-uuid',
    position: 0,
    opacity: 0.8,
    is_visible: true
  })
});

// Upload preview image
const formData = new FormData();
formData.append('preview', imageFile);

const uploadResponse = await fetch(`/api/layer-groups/${groupId}/preview`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### cURL Examples

```bash
# List layer groups
curl -X GET "https://your-domain.com/api/layer-groups?limit=10&is_featured=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create layer group
curl -X POST "https://your-domain.com/api/layer-groups" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Layer Group",
    "description": "A test layer group",
    "tags": ["test", "demo"]
  }'

# Upload preview image
curl -X POST "https://your-domain.com/api/layer-groups/GROUP_ID/preview" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "preview=@/path/to/image.jpg"
```

## Rate Limiting

The API includes basic rate limiting:
- **Default:** 100 requests per minute per user
- **Headers:** Rate limit information is included in response headers when limits are approached

## Best Practices

1. **Authentication:** Always include valid JWT tokens
2. **Error Handling:** Check the `success` field and handle errors appropriately
3. **Pagination:** Use pagination for large datasets
4. **File Uploads:** Validate file size and type before uploading
5. **Caching:** Cache responses where appropriate to reduce API calls
6. **Retry Logic:** Implement exponential backoff for failed requests

## Testing

Use the provided SQL setup script to create test data and verify the API functionality. The API includes comprehensive validation and error handling for robust operation.