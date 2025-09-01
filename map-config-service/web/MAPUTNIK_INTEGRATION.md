# Maputnik Editor Integration

This document describes the comprehensive Maputnik integration that enables direct save functionality from the map style editor to your backend API.

## Features

### 🚀 Direct Save Integration
- **Save to Map Config**: Direct save from Maputnik to your cloud backend
- **Quick Save**: One-click updates for existing styles
- **Auto-save**: Automatic saving every 5 minutes (configurable)
- **Version Control**: Track style changes and versions

### 🔐 Authentication & Security
- **JWT-based Authentication**: Secure token-based auth system
- **User Registration**: Self-service account creation
- **Role-based Access**: User roles and permissions
- **Secure Token Storage**: Sessions stored securely with auto-refresh

### 📊 Style Management
- **Style Validation**: Comprehensive Mapbox GL style validation
- **Quota Management**: Per-user style limits
- **Categories & Tags**: Organize styles with metadata
- **Public/Private Styles**: Share styles or keep them private

### 🎨 User Experience
- **Seamless UI**: Modal dialogs for save and login operations
- **Progress Tracking**: Real-time save progress indicators
- **Error Handling**: Comprehensive error messages and recovery
- **Responsive Design**: Works on desktop and mobile

## Architecture

### Frontend Components

#### Core Services
- **SaveService** (`src/services/saveService.ts`): Handles all style saving operations
- **AuthService** (`src/services/authService.ts`): Manages authentication and tokens
- **MaputnikBridge** (`src/utils/maputnikBridge.ts`): Communication with Maputnik editor

#### Pinia Stores
- **Save Store** (`src/stores/save.ts`): Global state management for save operations
- **Auth Store** (`src/stores/auth.ts`): User authentication state

#### Vue Components
- **MaputnikIntegration** (`src/components/MaputnikIntegration.vue`): Main integration component
- **SaveStyleDialog** (`src/components/SaveStyleDialog.vue`): Style save modal
- **LoginModal** (`src/components/LoginModal.vue`): User authentication modal
- **RegisterModal** (`src/components/RegisterModal.vue`): Account creation modal

### Backend API

#### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/verify` - Token verification
- `POST /api/auth/logout` - User logout

#### Style Management Endpoints
- `GET /api/styles` - List user's styles
- `POST /api/styles` - Create new style
- `PUT /api/styles/:id` - Update existing style
- `DELETE /api/styles/:id` - Delete style
- `GET /api/styles/:id/download` - Download style JSON
- `POST /api/styles/validate` - Validate style structure

### Database Schema

#### user_styles table
```sql
CREATE TABLE user_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'custom',
    style_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_profiles table
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    style_quota INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000

# Authentication
VITE_AUTH_ENABLED=true
VITE_JWT_SECRET=your_secret_key_here

# Style Storage
VITE_MAX_STYLE_SIZE=10485760
VITE_MAX_STYLES_PER_USER=50

# Auto-save
VITE_AUTO_SAVE_ENABLED=true
VITE_AUTO_SAVE_INTERVAL=300000

# CORS Origins
VITE_CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://maputnik.github.io
```

### 2. Database Migration

Run the database migration to create required tables:

```sql
-- Run the migration script
\i database/migrations/002_add_user_styles_table.sql
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
# Start the main application
npm run dev

# Start the styles server (in another terminal)
npm run styles:server

# Or start both together
npm run dev:all
```

## Usage Guide

### For Developers

#### 1. Basic Integration

```typescript
import { MaputnikIntegration } from '@/components/MaputnikIntegration.vue';

// In your Vue component
<MaputnikIntegration
  v-model:visible="showEditor"
  :style-file="currentStyleFile"
  :style-name="currentStyleName"
  @style-saved="onStyleSaved"
  @style-updated="onStyleUpdated"
/>
```

#### 2. Using Save Service Directly

```typescript
import { useSaveService } from '@/services/saveService';

const saveService = useSaveService();

// Save a style
const result = await saveService.saveStyle(mapboxStyle, {
  name: 'My Custom Style',
  description: 'A beautiful custom map style',
  category: 'custom',
  isPublic: false
});

console.log('Saved style ID:', result.styleId);
```

#### 3. Authentication Integration

```typescript
import { useAuthService } from '@/services/authService';

const authService = useAuthService();

// Login
const token = await authService.login('user@example.com', 'password');

// Check authentication
if (authService.isAuthenticated()) {
  // User is logged in
}
```

### For Users

#### 1. Opening the Editor
1. Click "Edit Style" on any map configuration
2. The Maputnik editor opens in a modal dialog
3. Make your style changes in Maputnik

#### 2. Saving Changes
1. **Save to Map Config**: Opens a dialog with save options
2. **Quick Save**: Instantly saves to the current style (if logged in)
3. **Download**: Downloads the style JSON file locally

#### 3. Authentication
1. Click "Sign In" if not authenticated
2. Enter your email and password
3. Or click "Sign up" to create a new account

## API Reference

### SaveService Methods

#### `saveStyle(styleData, options)`
Saves a new style to the backend.

**Parameters:**
- `styleData`: Mapbox GL style object
- `options`: Save options object
  - `name`: Style name (required)
  - `description`: Style description
  - `category`: Style category
  - `isPublic`: Whether style is public
  - `overwrite`: Whether to overwrite existing

**Returns:** Promise<SaveResponse>

#### `updateStyle(styleId, styleData, options)`
Updates an existing style.

#### `validateStyle(styleData)`
Validates a Mapbox GL style.

**Returns:** Promise<ValidationResult>

#### `getUserStyles()`
Gets all styles for the current user.

#### `deleteStyle(styleId)`
Deletes a style (soft delete).

### AuthService Methods

#### `login(email, password)`
Authenticates a user.

#### `register(userData)`
Registers a new user.

#### `logout()`
Logs out the current user.

#### `refreshToken()`
Refreshes the authentication token.

#### `isAuthenticated()`
Checks if user is authenticated.

## Error Handling

The integration includes comprehensive error handling:

### Client-Side Errors
- **Network Errors**: Connection issues, timeouts
- **Validation Errors**: Invalid style structure
- **Authentication Errors**: Token expiry, invalid credentials
- **Quota Errors**: Style limit exceeded

### Server-Side Errors
- **400 Bad Request**: Validation failures
- **401 Unauthorized**: Authentication required
- **409 Conflict**: Duplicate names, quota exceeded
- **500 Internal Error**: Server issues

### Error Codes
- `VALIDATION_ERROR`: Style validation failed
- `UNAUTHORIZED`: Authentication required
- `QUOTA_EXCEEDED`: User quota exceeded
- `DUPLICATE_NAME`: Style name already exists
- `NETWORK_ERROR`: Connection issues
- `TIMEOUT`: Request timed out

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:run
```

### Manual Testing Checklist
- [ ] Open Maputnik editor
- [ ] Make style changes
- [ ] Save to Map Config (authenticated)
- [ ] Save to Map Config (unauthenticated - should prompt login)
- [ ] Quick save existing style
- [ ] Auto-save functionality
- [ ] Error handling (network issues, validation errors)
- [ ] User registration flow
- [ ] Token refresh
- [ ] Style validation

## Security Considerations

### Authentication
- JWT tokens with expiration
- Secure token storage (sessionStorage + localStorage fallback)
- Automatic token refresh
- Secure logout with server notification

### API Security
- CORS configuration for allowed origins
- Input validation on all endpoints
- SQL injection prevention
- Rate limiting (recommended)

### Data Protection
- User data stored securely in database
- Passwords hashed with bcrypt
- Row-level security policies
- Audit trails for sensitive operations

## Troubleshooting

### Common Issues

#### 1. CORS Errors
**Problem**: Requests blocked by CORS policy
**Solution**: Check `VITE_CORS_ORIGINS` environment variable includes your domain

#### 2. Authentication Failures
**Problem**: Login requests fail
**Solution**: Verify `VITE_JWT_SECRET` is set and Supabase credentials are correct

#### 3. Style Save Failures
**Problem**: Style saves return validation errors
**Solution**: Check style structure using the validation endpoint

#### 4. Auto-save Not Working
**Problem**: Auto-save doesn't trigger
**Solution**: Check that auto-save is enabled and user is authenticated

### Debug Mode
Enable debug logging by setting:
```env
VITE_LOG_LEVEL=debug
```

### API Testing
Use the included test files to verify API functionality:
```bash
npm run test src/test/integration/saveIntegration.spec.ts
```

## Performance Considerations

### Frontend
- **Lazy Loading**: Components loaded on demand
- **Debounced Saves**: Auto-save debounced to prevent excessive requests
- **Caching**: User styles cached locally
- **Progressive Enhancement**: Works without JavaScript (basic functionality)

### Backend
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connections
- **Compression**: Response compression enabled
- **Rate Limiting**: Prevents abuse (recommended)

### Style Optimization
- **Validation Caching**: Validation results cached temporarily
- **Chunked Uploads**: Large styles uploaded in chunks
- **Thumbnail Generation**: Style thumbnails generated asynchronously

## Roadmap

### Planned Features
- [ ] Style thumbnails and previews
- [ ] Style sharing and collaboration
- [ ] Version history and diff viewer
- [ ] Bulk style operations
- [ ] Advanced style analytics
- [ ] Custom Maputnik instance hosting
- [ ] Real-time collaborative editing
- [ ] Style marketplace

### Technical Improvements
- [ ] WebSocket support for real-time updates
- [ ] Progressive Web App features
- [ ] Offline support with service workers
- [ ] Advanced caching strategies
- [ ] Performance monitoring
- [ ] Automated testing pipeline

## Support

For issues and questions:
1. Check this documentation
2. Review the troubleshooting section
3. Run the test suite
4. Check the browser console for errors
5. File an issue with detailed reproduction steps

## Contributing

When contributing to the Maputnik integration:
1. Follow the existing code style
2. Add tests for new functionality
3. Update documentation
4. Test with real Maputnik editor
5. Verify CORS and security implications