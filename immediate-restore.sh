#!/bin/bash

echo "Restoring working server immediately..."

cd /apps/stapubox-replit-app

pm2 stop stapubox

# Restore from the original backup if it exists
if [ -f "dist/index.js.original" ]; then
    cp dist/index.js.original dist/index.js
    echo "Restored from backup"
else
    # Quick rebuild
    npm run build
    echo "Rebuilt from source"
fi

# Apply only the proven working port fix
cat > quick-port-fix.js << 'EOF'
import fs from 'fs';

let serverCode = fs.readFileSync('dist/index.js', 'utf8');

// Add port binding after httpServer creation
if (!serverCode.includes('__server = httpServer.listen')) {
    serverCode = serverCode.replace(
        'const httpServer = createServer(app2);',
        `const httpServer = createServer(app2);

// DEPLOYMENT FIX: Force port binding
const __server = httpServer.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(\`🚀 StapuBox server running on port \${process.env.PORT || 3000}\`);
});

__server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});`
    );
}

// Disable conflicting server.listen
serverCode = serverCode.replace(
    /(\s+)server\.listen\(\{[\s\S]*?\}\);/g,
    '$1// DISABLED: server.listen block'
);

fs.writeFileSync('dist/index.js', serverCode);
console.log('✅ Applied working port fix');
EOF

node quick-port-fix.js
rm -f quick-port-fix.js

pm2 start ecosystem.config.cjs

sleep 3

echo "Status:"
pm2 status | grep stapubox

echo "Port check:"
netstat -tlnp | grep 3000

echo "Connection test:"
curl -I http://localhost:3000 2>/dev/null | head -1 || echo "No response"