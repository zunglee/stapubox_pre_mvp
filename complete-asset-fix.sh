#!/bin/bash

echo "🔧 Complete asset fix for StapuBox deployment..."

cd /apps/stapubox-replit-app

# Stop PM2
pm2 stop stapubox

# The simplest solution: rebuild with correct base path
echo "🏗️ Rebuilding with correct base path..."

# Update vite config to use correct base path for deployment
cat > fix-vite-base.js << 'EOF'
import fs from 'fs';

// Check if vite.config.ts exists and update it
if (fs.existsSync('vite.config.ts')) {
  let viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  
  // Add base: '/app/' to the vite config
  if (!viteConfig.includes('base:')) {
    viteConfig = viteConfig.replace(
      'export default defineConfig({',
      'export default defineConfig({\n  base: "/app/",'
    );
    fs.writeFileSync('vite.config.ts', viteConfig);
    console.log('✅ Updated vite.config.ts with base: "/app/"');
  }
}
EOF

node fix-vite-base.js
rm -f fix-vite-base.js

# Rebuild the frontend with correct base path
npm run build

# Update server to serve assets correctly
cat > fix-server-final.js << 'EOF'
import fs from 'fs';

let serverCode = fs.readFileSync('dist/index.js', 'utf8');
const lines = serverCode.split('\n');

// Add comprehensive static serving that works with nginx /app proxy
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const httpServer = createServer(app2)')) {
    const staticConfig = `
// Static serving for /app deployment
app2.use('/app/assets', express.static(path.join(__dirname, 'dist/public/assets')));
app2.use('/assets', express.static(path.join(__dirname, 'dist/public/assets')));
app2.use('/app', express.static(path.join(__dirname, 'dist/public')));
app2.use('/', express.static(path.join(__dirname, 'dist/public')));

// Catch-all for frontend routing
app2.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'dist/public/index.html'));
  }
});
`;
    lines.splice(i, 0, staticConfig);
    break;
  }
}

fs.writeFileSync('dist/index.js', lines.join('\n'));
console.log('✅ Server configured for comprehensive static serving');
EOF

node fix-server-final.js
rm -f fix-server-final.js

# Start PM2
pm2 start ecosystem.config.cjs

sleep 5

echo "📊 Final Status:"
pm2 status

echo "🧪 Testing assets:"
curl -I http://localhost:3000/assets/ 2>/dev/null | head -1 || echo "Asset test"

echo "✅ Complete asset fix applied!"
echo "🎯 StapuBox should now load at https://stapubox.com/app"