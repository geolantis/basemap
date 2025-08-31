-- Clean API keys from database - IMPORTANT SECURITY FIX
-- This removes hardcoded API keys from style URLs

-- Step 1: Update MapTiler URLs to remove API keys
UPDATE map_configs 
SET style_url = REGEXP_REPLACE(style_url, '\?key=[^&\s]+', '')
WHERE style_url LIKE '%maptiler.com%' AND style_url LIKE '%key=%';

-- Step 2: Update Clockwork Micro URLs to remove API keys  
UPDATE map_configs 
SET style_url = REGEXP_REPLACE(style_url, '\?apikey=[^&\s]+', '')
WHERE style_url LIKE '%clockworkmicro.com%' AND style_url LIKE '%apikey=%';

-- Step 3: Clean BEV URLs
UPDATE map_configs 
SET style_url = REGEXP_REPLACE(style_url, 'key=[^&\s]+&?', '')
WHERE style_url LIKE '%basemap.at%' AND style_url LIKE '%key=%';

-- Step 4: Add a new column to track which provider needs keys
ALTER TABLE map_configs 
ADD COLUMN IF NOT EXISTS requires_api_key VARCHAR(50);

-- Step 5: Mark which configs need API keys injected
UPDATE map_configs 
SET requires_api_key = 'maptiler' 
WHERE style_url LIKE '%maptiler.com%';

UPDATE map_configs 
SET requires_api_key = 'clockwork' 
WHERE style_url LIKE '%clockworkmicro.com%';

UPDATE map_configs 
SET requires_api_key = 'bev' 
WHERE style_url LIKE '%basemap.at%';

-- Verify the changes (this will show you the cleaned URLs)
SELECT name, style_url, requires_api_key 
FROM map_configs 
WHERE requires_api_key IS NOT NULL
ORDER BY name;