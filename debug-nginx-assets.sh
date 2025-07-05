#!/bin/bash

echo "🔍 Debugging nginx asset serving for /app deployment..."

cd /apps/stapubox-replit-app

# Check the nginx configuration
echo "📋 Current nginx configuration:"
cat /etc/nginx/sites-available/stapubox.com | grep -A 10 -B 5 "/app"

echo ""
echo "📁 Current asset structure in app:"
ls -la dist/public/assets/ | head -3

echo ""
echo "🧪 Testing direct asset access:"
curl -I http://localhost:3000/assets/index-5c0OIWvd.js 2>/dev/null | head -2 || echo "Asset not found locally"

echo ""
echo "📄 Current index.html content:"
head -20 dist/public/index.html

echo ""
echo "🔧 Creating nginx-compatible configuration..."

# The issue might be that nginx needs to serve assets directly
# Let's create a version that works with nginx proxy

# Stop PM2
pm2 stop stapubox

# Create a build that works with nginx /app proxy
cat > fix-nginx-assets.js << 'EOF'
import fs from 'fs';
import path from 'path';

// The issue is that nginx is proxying /app to localhost:3000
// So when the browser requests /app/assets/file.js, 
// nginx should proxy it to localhost:3000/assets/file.js

// First, let's rebuild index.html with the correct base path
let indexHtml = fs.readFileSync('dist/public/index.html', 'utf8');

// For nginx /app proxy, assets should be referenced as /app/assets/
indexHtml = indexHtml.replace(/href="\.\/assets\//g, 'href="/app/assets/');
indexHtml = indexHtml.replace(/src="\.\/assets\//g, 'src="/app/assets/');
indexHtml = indexHtml.replace(/href="\.\/"/g, 'href="/app/"');
indexHtml = indexHtml.replace(/src="\.\/"/g, 'src="/app/"');

fs.writeFileSync('dist/public/index.html', indexHtml);
console.log('✅ Updated index.html for nginx /app proxy');

// Now update the server to serve assets at the root level
// so nginx can proxy /app/assets/ to localhost:3000/assets/
let serverCode = fs.readFileSync('dist/index.js', 'utf8');
const lines = serverCode.split('\n');

// Find and update static serving
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('express.static') && lines[i].includes('dist/public')) {
    // Replace with simple asset serving that works with nginx proxy
    lines[i] = `app2.use('/assets', express.static(path.join(__dirname, 'dist/public/assets')));`;
    
    // Add fallback serving for index.html
    const fallbackRoute = `
// Serve index.html for all non-API routes
app2.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'dist/public/index.html'));
  }
});`;
    
    lines.splice(i + 1, 0, fallbackRoute);
    console.log('✅ Updated server for nginx compatibility');
    break;
  }
}

fs.writeFileSync('dist/index.js', lines.join('\n'));
console.log('✅ Server configured for nginx /app proxy');
EOF

node fix-nginx-assets.js
rm -f fix-nginx-assets.js

echo ""
echo "📄 Updated index.html asset references:"
grep "assets/" dist/public/index.html

echo ""
echo "🚀 Starting server with nginx-compatible configuration..."
pm2 start ecosystem.config.cjs

sleep 5

echo ""
echo "🧪 Testing asset serving:"
curl -I http://localhost:3000/assets/ 2>/dev/null | head -2

echo ""
echo "🧪 Testing index.html serving:"
curl -s http://localhost:3000 | grep "StapuBox\|assets" | head -3

echo ""
echo "✅ Nginx asset configuration completed!"
echo "🎯 Assets should now load at https://stapubox.com/app/"