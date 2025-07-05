#!/bin/bash

echo "Fixing white screen by configuring assets for /app deployment..."

cd /apps/stapubox-replit-app

pm2 stop stapubox

# Check what's in the current index.html
echo "Current index.html asset paths:"
grep -n "assets\|href\|src" dist/public/index.html | head -3

# Fix the index.html to use absolute paths that work with nginx /app proxy
cat > fix-assets.js << 'EOF'
import fs from 'fs';

let html = fs.readFileSync('dist/public/index.html', 'utf8');

// Replace relative paths with absolute paths that work with nginx /app proxy
html = html.replace(/href="\.\/assets\//g, 'href="/app/assets/');
html = html.replace(/src="\.\/assets\//g, 'src="/app/assets/');
html = html.replace(/href="\.\//g, 'href="/app/');
html = html.replace(/src="\.\//g, 'src="/app/');

// Fix any /assets/ to /app/assets/
html = html.replace(/href="\/assets\//g, 'href="/app/assets/');
html = html.replace(/src="\/assets\//g, 'src="/app/assets/');

fs.writeFileSync('dist/public/index.html', html);
console.log('✅ Fixed asset paths in index.html');
EOF

node fix-assets.js
rm -f fix-assets.js

echo "Updated index.html asset paths:"
grep -n "assets\|href\|src" dist/public/index.html | head -3

# Configure server to serve assets at both /assets/ and /app/assets/ paths
cat > configure-server.js << 'EOF'
import fs from 'fs';

let code = fs.readFileSync('dist/index.js', 'utf8');

// Add static serving before httpServer creation
const staticConfig = `
// Serve assets for nginx /app proxy
app2.use('/app/assets', express.static(path.join(__dirname, 'dist/public/assets')));
app2.use('/assets', express.static(path.join(__dirname, 'dist/public/assets')));
app2.use('/app', express.static(path.join(__dirname, 'dist/public')));
app2.use('/', express.static(path.join(__dirname, 'dist/public')));

// Catch-all for React routing
app2.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'dist/public/index.html'));
  }
});
`;

// Insert before httpServer creation
code = code.replace(
    'const httpServer = createServer(app2);',
    staticConfig + '\nconst httpServer = createServer(app2);'
);

fs.writeFileSync('dist/index.js', code);
console.log('✅ Configured comprehensive static serving');
EOF

node configure-server.js
rm -f configure-server.js

pm2 start ecosystem.config.cjs

sleep 5

echo "Testing asset serving:"
curl -I http://localhost:3000/assets/ 2>/dev/null | head -1
curl -I http://localhost:3000/app/assets/ 2>/dev/null | head -1

echo "Testing main page:"
curl -s http://localhost:3000 | grep -i "stapubox\|html" | head -2

echo "PM2 Status:"
pm2 list | grep stapubox

echo "✅ White screen fix applied!"
echo "Visit https://stapubox.com/app - assets should now load correctly"