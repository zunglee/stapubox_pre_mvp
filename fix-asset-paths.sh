#!/bin/bash

echo "🔧 Fixing asset paths for /app deployment..."

cd /apps/stapubox-replit-app

# Stop PM2
pm2 stop stapubox

# The issue is that the built frontend has absolute paths (/assets/) 
# but your app is deployed at /app, so assets should be at /app/assets/

echo "📁 Checking current asset structure:"
ls -la dist/public/assets/ | head -5

echo ""
echo "📄 Checking index.html asset references:"
grep -n "assets/" dist/public/index.html

# Fix the asset paths in index.html to be relative or correct for /app deployment
echo ""
echo "🛠️ Fixing asset paths in index.html..."

# Create a script to fix the asset paths
cat > fix-paths.js << 'EOF'
import fs from 'fs';

// Read index.html
let indexHtml = fs.readFileSync('dist/public/index.html', 'utf8');

// Replace absolute asset paths with relative paths that work with /app deployment
// Change /assets/ to ./assets/ so they work from any base path
indexHtml = indexHtml.replace(/\/assets\//g, './assets/');

// Also ensure any other absolute paths are made relative
indexHtml = indexHtml.replace(/href="\//g, 'href="./');
indexHtml = indexHtml.replace(/src="\//g, 'src="./');

// Write the fixed file
fs.writeFileSync('dist/public/index.html', indexHtml);

console.log('✅ Fixed asset paths in index.html');
console.log('Assets now use relative paths compatible with /app deployment');
EOF

# Apply the path fix
node fix-paths.js
rm -f fix-paths.js

echo ""
echo "📄 Verifying fixed paths:"
grep -n "assets/" dist/public/index.html

# Also ensure the server properly serves assets at the /app path
echo ""
echo "🔧 Updating server to handle /app base path..."

cat > fix-server-paths.js << 'EOF'
import fs from 'fs';

let serverCode = fs.readFileSync('dist/index.js', 'utf8');
const lines = serverCode.split('\n');

// Find where static files are served and ensure they work with /app prefix
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('express.static') && lines[i].includes('dist/public')) {
    console.log(`Found static serving at line ${i + 1}`);
    
    // Add specific asset serving for the /app path
    const assetServing = `
// Serve assets specifically for /app deployment
app2.use('/app/assets', express.static(path.join(__dirname, 'dist/public/assets')));
app2.use('/app', express.static(path.join(__dirname, 'dist/public')));
`;
    
    lines.splice(i + 1, 0, assetServing);
    console.log('✅ Added /app path asset serving');
    break;
  }
}

fs.writeFileSync('dist/index.js', lines.join('\n'));
console.log('✅ Server configured for /app deployment');
EOF

node fix-server-paths.js
rm -f fix-server-paths.js

echo ""
echo "🚀 Starting server with fixed asset paths..."
pm2 start ecosystem.config.cjs

sleep 5

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🧪 Testing asset availability:"
curl -I http://localhost:3000/assets/ 2>/dev/null | head -1
curl -I http://localhost:3000/app/assets/ 2>/dev/null | head -1

echo ""
echo "🧪 Testing main page:"
curl -s http://localhost:3000 | head -5

echo ""
echo "✅ Asset path fix completed!"
echo "🎯 Your StapuBox app should now load properly at https://stapubox.com/app"
echo "Assets will be served from https://stapubox.com/app/assets/"