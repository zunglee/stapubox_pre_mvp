#!/bin/bash

# StapuBox Development Startup Script
echo "🚀 Starting StapuBox in Development Mode..."

# Set environment
export NODE_ENV=development

# Start the application with development configuration
npm run dev

echo "✅ StapuBox development server started!"
echo "🌐 Application available at: http://localhost:5000"