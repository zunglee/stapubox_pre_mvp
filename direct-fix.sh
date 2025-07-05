#!/bin/bash

echo "🔧 Direct fix for TLS certificate error..."

cd /apps/stapubox-replit-app

# Stop PM2 completely
pm2 stop all
pm2 delete all

# Check if build succeeded - if dist/index.js doesn't exist or is old, the build failed
if [ ! -f "dist/index.js" ]; then
    echo "❌ dist/index.js not found - build failed"
else
    echo "📅 dist/index.js last modified: $(stat -c %y dist/index.js)"
fi

# Force a clean build
echo "🧹 Clean build process..."
rm -rf dist/
rm -rf node_modules/.vite/
npm cache clean --force

# Install dependencies
npm install

# Try building just the server without frontend
echo "🏗️ Building server only..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js

# Check if server build succeeded
if [ -f "dist/index.js" ]; then
    echo "✅ Server build successful"
    
    # Check for Neon references in built file
    if grep -q "neonConfig\|@neondatabase" dist/index.js; then
        echo "❌ Built file still contains Neon database code"
        echo "🔄 Patching built file directly..."
        
        # Direct patch of the built file
        sed -i 's/@neondatabase\/serverless/pg/g' dist/index.js
        sed -i 's/neon-serverless/node-postgres/g' dist/index.js
        sed -i 's/neonConfig\.webSocketConstructor = ws;//g' dist/index.js
        
        echo "✅ Patched built file"
    else
        echo "✅ Built file uses correct PostgreSQL configuration"
    fi
else
    echo "❌ Server build failed"
fi

# Update PM2 config
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
      DATABASE_URL: 'postgresql://stapubox_user:npg_dwAQM3ULCKs5@localhost:5432/stapubox_db?sslmode=disable',
      TWOFACTOR_API_KEY: '8e3fbee1-37bf-11f0-8b17-0200cd936042'
    }
  }]
};
EOF

# Start PM2
echo "🚀 Starting app..."
pm2 start ecosystem.config.cjs

# Check immediately
sleep 2
pm2 logs stapubox --lines 10

echo "🧪 Testing connection..."
curl -s http://localhost:3000 && echo "✅ App responding" || echo "❌ App not responding"

netstat -tlnp | grep 3000