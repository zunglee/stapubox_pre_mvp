#!/bin/bash

echo "Immediate server fix..."

cd /apps/stapubox-replit-app

# Check current PM2 status
echo "PM2 Status:"
pm2 status

# Check if port 3000 is listening
echo "Port 3000 status:"
netstat -tlnp | grep 3000

# Stop and clean restart
pm2 stop stapubox
pm2 delete stapubox

# Quick rebuild
npm run build

# Apply minimal working configuration
cat > minimal-fix.js << 'EOF'
import fs from 'fs';

let code = fs.readFileSync('dist/index.js', 'utf8');

// Ensure clean server setup
code = code.replace(
    'const httpServer = createServer(app2);',
    `// Static serving
app2.use(express.static(path.join(__dirname, 'dist/public')));

const httpServer = createServer(app2);

// Force port binding
const server = httpServer.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});`
);

// Remove any conflicting server.listen calls
code = code.replace(/server\.listen\(\{[\s\S]*?\}\);/g, '');

fs.writeFileSync('dist/index.js', code);
console.log('Applied minimal server configuration');
EOF

node minimal-fix.js
rm -f minimal-fix.js

# Start fresh
pm2 start ecosystem.config.cjs

sleep 3

echo "Final check:"
pm2 status
netstat -tlnp | grep 3000
curl -I http://localhost:3000 2>/dev/null || echo "No response"