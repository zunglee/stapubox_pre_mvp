#!/bin/bash

echo "Emergency restore to working state..."

cd /apps/stapubox-replit-app

pm2 stop stapubox

# Quick rebuild from scratch
npm run build

# Apply only the proven port fix that worked before
cat > emergency-fix.js << 'EOF'
import fs from 'fs';

let code = fs.readFileSync('dist/index.js', 'utf8');

// Find httpServer creation
code = code.replace(
    'const httpServer = createServer(app2);',
    `const httpServer = createServer(app2);

const __server = httpServer.listen(3000, '0.0.0.0', () => {
  console.log('🚀 Server running on port 3000');
});`
);

// Remove conflicting server.listen
code = code.replace(/server\.listen\(\{[\s\S]*?\}\);/, '// disabled');

fs.writeFileSync('dist/index.js', code);
EOF

node emergency-fix.js
rm emergency-fix.js

pm2 start ecosystem.config.cjs

sleep 3

netstat -tlnp | grep 3000
curl -I http://localhost:3000 2>/dev/null | head -1 || echo "Still not responding"