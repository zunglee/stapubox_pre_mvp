#!/bin/bash

echo "🔧 Restoring nginx and fixing with simpler approach..."

cd /apps/stapubox-replit-app

# First restore the original working nginx config
echo "📋 Original working nginx config for /app:"
echo "    location /app {"
echo "        proxy_pass http://localhost:3000;"
echo "        proxy_set_header Host \$host;"
echo "        proxy_set_header X-Real-IP \$remote_addr;"
echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
echo "    }"
echo ""
echo "Restore this in your nginx config, then run the fix below."

# The simpler solution: make our app work with the existing nginx /app proxy
# by serving assets correctly and updating the frontend to use relative paths

pm2 stop stapubox

# Rebuild with base path configuration
echo "🏗️ Rebuilding with proper base path..."

# Update vite config for /app base
cat > update-vite-config.js << 'EOF'
import fs from 'fs';

if (fs.existsSync('vite.config.ts')) {
    let config = fs.readFileSync('vite.config.ts', 'utf8');
    
    if (!config.includes('base:')) {
        config = config.replace(
            'export default defineConfig({',
            'export default defineConfig({\n  base: "/app/",'
        );
        fs.writeFileSync('vite.config.ts', config);
        console.log('✅ Updated vite.config.ts with base: "/app/"');
    }
}
EOF

node update-vite-config.js
rm -f update-vite-config.js

# Rebuild
npm run build

# Configure server for the nginx /app proxy (simple version)
cat > simple-server-config.js << 'EOF'
import fs from 'fs';

let serverCode = fs.readFileSync('dist/index.js', 'utf8');

// Simple approach: serve everything at root so nginx /app proxy works
const simpleConfig = `
// Simple static serving for nginx /app proxy
app2.use(express.static(path.join(__dirname, 'dist/public')));

// API routes (existing routes will be preserved)
`;

// Insert before httpServer creation
serverCode = serverCode.replace(
    'const httpServer = createServer(app2);',
    simpleConfig + '\nconst httpServer = createServer(app2);'
);

// Add the working port binding
if (!serverCode.includes('__server = httpServer.listen')) {
    serverCode = serverCode.replace(
        'const httpServer = createServer(app2);',
        `const httpServer = createServer(app2);

// DEPLOYMENT FIX: Force port binding
const __server = httpServer.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(\`🚀 StapuBox server running on port \${process.env.PORT || 3000}\`);
});`
    );
}

// Disable conflicting server.listen
serverCode = serverCode.replace(
    /(\s+)server\.listen\(\{[\s\S]*?\}\);/g,
    '$1// DISABLED: conflicting server.listen'
);

fs.writeFileSync('dist/index.js', serverCode);
console.log('✅ Configured server for nginx /app proxy');
EOF

node simple-server-config.js
rm -f simple-server-config.js

# Start server
pm2 start ecosystem.config.cjs

sleep 5

echo "📊 Status:"
pm2 status | grep stapubox

echo "🧪 Testing localhost:3000:"
curl -I http://localhost:3000 2>/dev/null | head -1

echo ""
echo "✅ Server configuration completed!"
echo ""
echo "Next steps:"
echo "1. Restore the original nginx config (remove /app/ from location /app)"
echo "2. Test: sudo nginx -t"  
echo "3. Reload: sudo systemctl reload nginx"
echo "4. Visit: https://stapubox.com/app"
echo ""
echo "The app is now built with base: '/app/' so assets will load correctly."