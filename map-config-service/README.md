# Map Configuration Service

A modern, secure map configuration service built with Vue 3 and Vercel Edge Functions that provides a beautiful UI for managing map configurations while protecting API keys from client exposure.

## 🚀 Features

### Core Features
- ✅ **Secure API Key Protection** - Keys are never exposed to clients, handled server-side via Edge Functions
- ✅ **Beautiful Vue 3 Interface** - Modern, responsive UI with Tailwind CSS and PrimeVue
- ✅ **Configuration Duplication** - Multiple duplication modes (exact, country-specific, template, merge)
- ✅ **Map Preview** - Real-time preview with MapLibre GL JS
- ✅ **Export/Import** - Compatible with existing mapconfig.json format
- ✅ **Maputnik Integration** - Direct editing in Maputnik editor
- 🔧 **GitHub Sync** - Version control integration (coming soon)
- 🔧 **Database Storage** - Supabase/PostgreSQL backend (setup required)

### Duplication Features
- **Exact Copy** - Create identical configuration with new name
- **Country Adaptation** - Copy and adapt for different regions
- **Template Creation** - Use existing configs as templates
- **Configuration Merging** - Combine layers from multiple configs
- **Bulk Duplication** - Duplicate multiple configurations at once

## 📁 Project Structure

```
map-config-service/
├── web/
│   ├── api/                 # Vercel Edge Functions
│   │   ├── proxy/           # Style proxy for API key protection
│   │   └── config/          # Configuration CRUD endpoints
│   ├── src/
│   │   ├── components/      # Vue components
│   │   ├── views/          # Page components
│   │   ├── stores/         # Pinia stores
│   │   ├── types/          # TypeScript definitions
│   │   └── router/         # Vue Router config
│   └── vercel.json         # Vercel configuration
└── MAP_CONFIG_SERVICE_PLAN.md  # Detailed implementation plan
```

## 🛠️ Technology Stack

- **Frontend**: Vue 3, TypeScript, Vite, Tailwind CSS, PrimeVue
- **Backend**: Vercel Edge Functions
- **Map Rendering**: MapLibre GL JS
- **State Management**: Pinia
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm
- Vercel account
- Supabase account (for database)

### Installation

1. Clone the repository:
```bash
cd map-config-service/web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file:
```env
# API Keys (keep these secret!)
MAPTILER_API_KEY=your_maptiler_key
CLOCKWORK_API_KEY=your_clockwork_key
BEV_API_KEY=your_bev_key

# Supabase (optional for now)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Auth
JWT_SECRET=your_jwt_secret
```

4. Run development server:
```bash
npm run dev
```

5. Open http://localhost:5173

### Demo Mode
The app currently runs in demo mode without database setup. To test:
1. Go to http://localhost:5173/login
2. Enter any email/password (demo mode)
3. You'll be redirected to the dashboard

## 🔑 API Key Security

The service protects API keys through a proxy pattern:

1. **Client Request** → Requests style without API key
2. **Edge Function** → Injects appropriate API key server-side
3. **External Service** → Receives request with valid key
4. **Response** → Sanitized response sent to client (keys removed)

### Supported Providers
- MapTiler
- Clockwork Micro
- BEV Austria
- IGN France
- Ordnance Survey GB

## 📦 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

### Production Setup

1. **Database Setup** (Supabase):
   - Create new Supabase project
   - Run database migrations (see `/docs/schema.sql`)
   - Update environment variables

2. **Authentication**:
   - Configure JWT secrets
   - Set up OAuth providers (optional)

3. **API Keys**:
   - Add all map provider API keys to Vercel env

## 🗺️ Map Configuration Format

The service maintains compatibility with existing `mapconfig.json`:

```json
{
  "backgroundMaps": {
    "MapName": {
      "name": "MapName",
      "style": "https://api.provider.com/style.json",
      "label": "Display Name",
      "type": "vtc",
      "flag": "🌐",
      "country": "Global"
    }
  }
}
```

## 🔧 API Endpoints

### Configuration Management
- `GET /api/config` - List all configurations
- `POST /api/config` - Create new configuration
- `GET /api/config/:id` - Get single configuration
- `PUT /api/config/:id` - Update configuration
- `DELETE /api/config/:id` - Delete configuration

### Duplication
- `POST /api/config/duplicate` - Duplicate single configuration
- `POST /api/config/bulk-duplicate` - Duplicate multiple configs

### Style Proxy
- `POST /api/proxy/style` - Proxy style.json with API keys

## 📈 Current Status

### ✅ Completed
- Vue 3 project setup with TypeScript
- Vercel configuration
- API proxy service for secure key handling
- Basic UI components (Dashboard, MapCard, SearchBar)
- Configuration duplication API
- Router and state management setup

### 🔧 In Progress
- Map preview with MapLibre
- Configuration editor interface
- Database integration

### 📋 TODO
- Complete Supabase integration
- Implement authentication system
- Add MapLibre preview functionality
- GitHub sync integration
- Comprehensive testing
- Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary. All rights reserved.

## 🆘 Support

For issues or questions, please create an issue in the repository.

## 🎯 Roadmap

- [ ] Phase 1: Core functionality (Current)
- [ ] Phase 2: Database integration
- [ ] Phase 3: Authentication system
- [ ] Phase 4: MapLibre preview
- [ ] Phase 5: GitHub integration
- [ ] Phase 6: Production deployment
- [ ] Phase 7: Advanced features (analytics, versioning)

---

Built with ❤️ for secure map configuration management