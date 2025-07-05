#!/bin/bash

# StapuBox Production Startup Script
echo "🚀 Starting StapuBox in Production Mode..."

# Set environment
export NODE_ENV=production

# Build the application
echo "📦 Building application..."
npm run build

# Start the application with production configuration
echo "🌐 Starting production server..."
npm run start

echo "✅ StapuBox production server started!"
echo "🌐 Application available at: https://stapubox.com"