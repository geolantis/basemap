# 🚀 Maputnik Live Integration with Auto-Save

## Overview

This integration provides **automatic, real-time saving** of map styles edited in Maputnik, eliminating the need for manual export/upload workflows.

## ✨ Features

- **Automatic Save**: Changes are automatically saved to the database as you edit
- **Real-time Sync**: WebSocket connection provides instant feedback
- **No Manual Steps**: Edit and save happens automatically in the background
- **Multiple Instances**: Edit multiple styles simultaneously
- **Fallback Support**: Works with or without Supabase database

## 🛠️ Setup Instructions

### 1. Install Maputnik CLI

```bash
# Install globally
npm install -g maputnik

# Or use the provided script
npm run maputnik:install
```

### 2. Install Dependencies

```bash
# Install required packages
npm install
```

### 3. Start the Development Environment

```bash
# Start with live editing support
npm run dev:live

# This runs:
# - Vite dev server (port 5173)
# - Maputnik sync server (port 3002)
```

## 📖 How It Works

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser       │────▶│  Maputnik CLI    │────▶│   Database  │
│  (Vue App)      │     │  (Watch Mode)    │     │  (Supabase) │
└─────────────────┘     └──────────────────┘     └─────────────┘
        │                        │                        ▲
        │                        ▼                        │
        │               ┌──────────────────┐             │
        └──────────────▶│   Sync Server    │─────────────┘
                        │  (WebSocket)     │
                        └──────────────────┘
```

### Workflow

1. **User clicks "Edit with Live Sync"** in the map preview
2. **Sync server starts Maputnik CLI** in watch mode for that specific style
3. **Maputnik opens** in localhost with the style loaded
4. **User edits** the style in Maputnik's visual editor
5. **Maputnik saves** changes to the watched file
6. **File watcher detects** changes immediately
7. **Sync server saves** to database automatically
8. **WebSocket notifies** the frontend of successful save
9. **UI shows** "Auto-saved" confirmation

## 🎯 Usage

### For Users

1. Open any map in the dashboard
2. Click on **"Preview"** to view the map
3. Click **"Edit with Live Sync"** (instead of regular Maputnik)
4. Edit your style - changes save automatically!
5. See real-time save confirmations in the UI
6. Click **"Stop Editing"** when done

### For Developers

#### Start Individual Services

```bash
# Frontend only
npm run dev

# Sync server only
npm run maputnik:sync

# Both together
npm run dev:live
```

#### API Endpoints

```javascript
// Start editing session
POST http://localhost:3002/api/maputnik/start
{
  "styleId": "map-123",
  "styleName": "basemap2"
}

// Stop editing session
POST http://localhost:3002/api/maputnik/stop
{
  "styleId": "map-123"
}

// Get active sessions
GET http://localhost:3002/api/maputnik/status
```

## 🔧 Configuration

### Environment Variables

```env
# Supabase (optional - falls back to local storage)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_KEY=your-service-key  # For server-side writes

# Ports
MAPUTNIK_PORT_START=8000  # First Maputnik instance
API_PORT=3002              # Sync server port
```

### File Locations

- **Style files**: `/public/styles/`
- **Temp files**: `/temp/styles/` (created automatically)
- **Sync server**: `/server/maputnik-sync.js`
- **Vue component**: `/src/views/MaputnikLiveEditor.vue`

## 🚨 Important Notes

### Production Deployment

For production, you'll need to:

1. **Run sync server** on a Node.js host (not Vercel edge)
2. **Configure CORS** for your domain
3. **Use HTTPS** WebSocket (wss://)
4. **Set proper** environment variables

### Alternative: Local Development Only

If you can't run Node.js in production, use this for local development only:
- Keep the existing iframe integration for production
- Use live sync for local development
- Styles still save to `/public/styles/` for deployment

### Security Considerations

- The sync server should be behind authentication
- Validate style JSON before saving
- Limit file write permissions
- Use service role key for database writes

## 🐛 Troubleshooting

### Maputnik CLI not found
```bash
npm install -g maputnik
```

### Port already in use
Check if another Maputnik instance is running:
```bash
lsof -i :8000
```

### WebSocket connection failed
- Check if sync server is running
- Verify CORS settings
- Check firewall/proxy settings

### Styles not saving
- Check Supabase credentials
- Verify database permissions
- Check browser console for errors

## 📊 Benefits Over Iframe Integration

| Feature | Iframe Integration | Live Sync Integration |
|---------|-------------------|----------------------|
| **Save Method** | Manual export/upload | Automatic |
| **User Steps** | 3-4 steps | 0 steps |
| **Save Time** | 30-60 seconds | < 1 second |
| **Feedback** | After upload | Real-time |
| **Multiple Edits** | One at a time | Simultaneous |
| **Database Sync** | Manual | Automatic |

## 🎉 Summary

With this integration, editing map styles becomes a seamless experience:

- ✅ **Zero manual steps** - Just edit and it saves
- ✅ **Real-time feedback** - See saves as they happen
- ✅ **Multiple styles** - Edit many maps at once
- ✅ **Reliable** - Fallback to local storage if needed
- ✅ **Fast** - Sub-second save times

No more downloading JSON files, no more upload buttons - just pure creative flow! 🚀