#!/bin/bash

# Simple build script for Cloudflare Pages
# This avoids lockfile issues by using npm install without package-lock

echo "🚀 Starting Cloudflare Pages build..."

# Install dependencies without lockfile
echo "📦 Installing dependencies..."
npm install --no-package-lock

# Create environment file from secrets (if available)
if [ -n "$VITE_OPENROUTER_API_KEY" ]; then
  echo "🔐 Setting up environment variables..."
  echo "VITE_OPENROUTER_API_KEY=$VITE_OPENROUTER_API_KEY" > .env
  echo "VITE_ASSEMBLYAI_API_KEY=$VITE_ASSEMBLYAI_API_KEY" >> .env
  echo "VITE_NEWSDATA_API_KEY=$VITE_NEWSDATA_API_KEY" >> .env
fi

# Build the application
echo "🏗️ Building application..."
npm run build

echo "Build completed successfully!"
