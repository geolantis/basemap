#!/bin/bash

# Set Vercel environment variables for production
echo "Setting up Vercel environment variables..."

# Core Supabase configuration
echo "https://wphrytrrikfkwehwahqc.supabase.co" | vercel env add VITE_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHJ5dHJyaWtma3dlaHdhaHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTI5NzUsImV4cCI6MjA3MjEyODk3NX0.8E7_6gTc4guWSB2lI-hFQfGSEs6ziLmIT3P8xPbmz_k" | vercel env add VITE_SUPABASE_ANON_KEY production

# Claude API key
echo "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" | vercel env add VITE_CLAUDE_API_KEY production

# API Keys for map providers
echo "ldV32HV5eBdmgfE7vZJI" | vercel env add MAPTILER_API_KEY production
echo "9G4F5b99xO28esL8tArIO2Bbp8sGhURW5qIieYTy" | vercel env add CLOCKWORK_API_KEY production

# Default API keys for 3rd party access
echo "development-key" | vercel env add API_KEYS production

# CORS origins (allow all for now)
echo "*" | vercel env add ALLOWED_ORIGINS production

echo "Environment variables set up successfully!"