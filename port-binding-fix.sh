#!/bin/bash

echo "🔧 Fixing port binding issue in the main application..."

cd /apps/stapubox-replit-app

# Stop PM2
pm2 stop stapubox

# Check what's in the current server file - look for the express app.listen call
echo "🔍 Examining server startup code..."
grep -n "app.listen\|listen(" dist/index.js | head -5

# Create a patched version of the server that forces port binding
echo "🔧 Creating port binding patch..."

# Backup the original
cp dist/index.js dist/index.js.backup

# Create a simple patch script
cat > patch-server.js << 'EOF'
import fs from 'fs';

// Read the current server file
let serverCode = fs.readFileSync('dist/index.js', 'utf8');

// Add explicit port binding and error handling at the end
const patchCode = `
// DEPLOYMENT FIX: Force port binding
const __server = httpServer.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(\`🚀 StapuBox server running on port \${process.env.PORT || 3000}\`);
  console.log(\`📡 Server accessible at http://localhost:\${process.env.PORT || 3000}\`);
});

__server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(\`Port \${process.env.PORT || 3000} is already in use\`);
  }
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  __server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
`;

// Find the last occurrence of httpServer and add our patch
const lines = serverCode.split('\n');
let lastHttpServerLine = -1;
let foundServerCreation = false;

for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('httpServer') && lines[i].includes('createServer')) {
    lastHttpServerLine = i;
    foundServerCreation = true;
    break;
  }
}

if (foundServerCreation) {
  // Add our patch after the server creation
  lines.splice(lastHttpServerLine + 1, 0, patchCode);
  fs.writeFileSync('dist/index.js', lines.join('\n'));
  console.log('✅ Server patched successfully');
} else {
  console.log('❌ Could not find server creation code to patch');
}
EOF

# Run the patch
node patch-server.js

# Clean up
rm -f patch-server.js

echo "🚀 Starting patched server..."
pm2 start ecosystem.config.cjs

# Wait and check
sleep 5

echo "📊 PM2 Status:"
pm2 status

echo "🔍 Port check:"
netstat -tlnp | grep 3000

echo "🧪 Connection test:"
curl -I http://localhost:3000 2>/dev/null | head -1 || echo "No response"

echo "📋 Recent logs:"
pm2 logs stapubox --lines 3 --nostream

echo "✅ Port binding fix completed!"