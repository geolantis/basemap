-- Fix uploaded styles with incorrect paths
-- Run this in Supabase SQL editor

-- First, let's see what we have
SELECT id, name, label, style, country, created_at 
FROM map_configs 
WHERE style LIKE '/api/styles/temp/%'
ORDER BY created_at DESC;

-- Update the paths to the correct format
UPDATE map_configs
SET 
  style = REPLACE(style, '/api/styles/temp/', '/styles/'),
  original_style = REPLACE(original_style, '/api/styles/temp/', '/styles/'),
  updated_at = NOW()
WHERE style LIKE '/api/styles/temp/%';

-- Fix country names if they're codes
UPDATE map_configs
SET 
  country = CASE 
    WHEN country = 'at' THEN 'Austria'
    WHEN country = 'de' THEN 'Germany'
    WHEN country = 'ch' THEN 'Switzerland'
    WHEN country = 'fr' THEN 'France'
    WHEN country = 'it' THEN 'Italy'
    ELSE country
  END,
  updated_at = NOW()
WHERE country IN ('at', 'de', 'ch', 'fr', 'it');

-- Verify the fixes
SELECT id, name, label, style, country, created_at 
FROM map_configs 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;