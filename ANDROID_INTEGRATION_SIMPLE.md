# Android App - Simple Integration Guide

## ✅ One Line Change Required

### Update Your Android App

**File:** `/app/src/main/assets/engine_ml/src/mapConfigLoader.js`  
**Line:** 13

```javascript
// OLD - GitHub URL (exposes API keys in repository):
const defaultConfigUrl = 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/mapconfig.json';

// NEW - Production Service URL (API keys injected server-side):
const defaultConfigUrl = 'https://mapconfig.geolantis.com/api/public/mapconfig?format=legacy';
```

That's it! Your app will now:
- ✅ Get the exact same format it expects (backgroundMaps/overlayMaps)
- ✅ Receive API keys injected server-side (secure)
- ✅ No longer expose keys in your GitHub repository
- ✅ Work with all existing code unchanged

---

## 🔐 How It Works

### Security Benefits

1. **API Keys Protected**
   - MapTiler key: Injected server-side
   - Clockwork key: Injected server-side  
   - BEV key: Injected server-side
   - Keys never stored in GitHub or database

2. **Same Format**
   ```javascript
   {
     "backgroundMaps": {
       "Global": { 
         "style": "https://api.maptiler.com/maps/streets-v2/style.json?key=INJECTED_KEY"
         // Key is added by server, not in repository
       }
     },
     "overlayMaps": { ... }
   }
   ```

3. **Cached Response**
   - 1 hour cache for better performance
   - Reduces server load

---

## 📱 Testing

### Quick Test in Browser
```bash
# Test the legacy format endpoint
curl "https://mapconfig.geolantis.com/api/public/mapconfig?format=legacy" | jq '.'

# You should see:
{
  "backgroundMaps": {
    "Global": { ... },
    "Global2": { ... },
    ...
  },
  "overlayMaps": {
    "kataster": { ... },
    ...
  }
}
```

### Test in Android App
1. Make the one-line change above
2. Build and run your app
3. Maps should load exactly as before
4. Check that MapTiler/Clockwork maps work (API keys are injected)

---

## 🚀 Deployment Checklist

- [ ] Update `mapConfigLoader.js` with new URL
- [ ] Test in Android emulator
- [ ] Verify maps load correctly
- [ ] Check MapTiler maps work (Global, Landscape, etc.)
- [ ] Check Clockwork maps work (Global2)
- [ ] Deploy to production

---

## 🔄 Rollback (If Needed)

If any issues occur, you can instantly rollback:

```javascript
// Temporary rollback to GitHub
const defaultConfigUrl = 'https://raw.githubusercontent.com/geolantis/basemap/refs/heads/main/mapconfig.json';
```

But remember: this exposes your API keys again!

---

## 📊 Benefits Summary

| Aspect | Before (GitHub) | After (Service) |
|--------|-----------------|-----------------|
| **API Keys** | ❌ Exposed in repo | ✅ Injected server-side |
| **Security** | ❌ Keys visible to anyone | ✅ Keys hidden |
| **Performance** | ❌ No caching | ✅ 1-hour cache |
| **Management** | ❌ Edit JSON in GitHub | ✅ Admin portal |
| **Format** | ✅ Legacy format | ✅ Same legacy format |
| **Code Changes** | - | ✅ One line only |

---

## 🛠️ Admin Portal

Manage your map configurations at:
https://mapconfig.geolantis.com/login

- Add/edit/remove maps
- No code changes needed
- Changes reflect immediately (after cache expires)

---

## ❓ FAQ

**Q: Will my app still work exactly the same?**  
A: Yes, the `?format=legacy` parameter ensures you get the exact same JSON structure.

**Q: What about offline mode?**  
A: Your existing fallback to `defaultMapConfig` still works unchanged.

**Q: Can I test locally first?**  
A: Yes, just change the URL and test. You can always change it back.

**Q: Are the API keys really secure now?**  
A: Yes, they're stored as environment variables on the server and injected at runtime. They never appear in any repository or database.

---

## 📞 Support

If you have any issues:
1. Check the endpoint is working: https://mapconfig.geolantis.com/api/public/mapconfig?format=legacy
2. Verify the format matches your expectations
3. Check browser console for any errors

The service is already running in production and ready to use!