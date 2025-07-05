#!/bin/bash

# Complete deployment fix for Ubuntu server
# This script fixes the database connection and rebuilds the app

echo "🔧 Starting deployment fix..."

# Go to app directory
cd /apps/stapubox-replit-app

# Stop PM2
echo "⏹️  Stopping PM2..."
pm2 stop stapubox 2>/dev/null || true
pm2 delete stapubox 2>/dev/null || true

# Install missing dependencies
echo "📦 Installing dependencies..."
npm install pg @types/pg

# Fix the database connection in server/db.ts
echo "🔧 Fixing database connection..."
cat > server/db.ts << 'EOF'
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use standard PostgreSQL connection for local server
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false // Disable SSL for local PostgreSQL
});
export const db = drizzle(pool, { schema });
EOF

# Build the app
echo "🏗️  Building application..."
npm run build

# Update PM2 configuration with environment variables
echo "⚙️  Updating PM2 configuration..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'stapubox',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://stapubox_user:npg_dwAQM3ULCKs5@localhost:5432/stapubox_db',
      TWOFACTOR_API_KEY: '8e3fbee1-37bf-11f0-8b17-0200cd936042'
    }
  }]
};
EOF

# Start PM2
echo "🚀 Starting PM2..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Show status
echo "📊 PM2 Status:"
pm2 status

# Test the application
echo "🧪 Testing application..."
sleep 3
curl -s http://localhost:3000 > /dev/null && echo "✅ App is responding on port 3000" || echo "❌ App is not responding"

# Check what's listening on port 3000
echo "🔍 Port 3000 status:"
netstat -tlnp | grep 3000

echo "✅ Deployment fix completed!"
echo "🌐 Your app should now be accessible at https://stapubox.com/app"