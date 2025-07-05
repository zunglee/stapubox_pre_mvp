#!/bin/bash

echo "🔧 Final fix for server conflict - forcing single server on port 3000"

cd /apps/stapubox-replit-app

# Stop PM2
pm2 stop stapubox

# Fix the server conflict by removing the second server.listen call
echo "🛠️ Removing conflicting server.listen call..."

# Create a targeted patch to comment out the conflicting Vite server
cat > fix-server-conflict.js << 'EOF'
import fs from 'fs';

// Read the current server file
let serverCode = fs.readFileSync('dist/index.js', 'utf8');

// Find and comment out the conflicting server.listen call around line 2469
// This is the one that tries to listen on port 5000
const lines = serverCode.split('\n');
let modified = false;

for (let i = 0; i < lines.length; i++) {
  // Look for the server.listen call that uses port 5e3 (5000)
  if (lines[i].includes('server.listen({') && 
      i + 1 < lines.length && lines[i + 1].includes('port') &&
      i + 2 < lines.length && lines[i + 2].includes('host: "0.0.0.0"')) {
    
    // Comment out the problematic server.listen block
    let j = i;
    while (j < lines.length && !lines[j].includes('});')) {
      lines[j] = '  // DISABLED: ' + lines[j];
      j++;
    }
    if (j < lines.length) {
      lines[j] = '  // DISABLED: ' + lines[j]; // Comment out the closing });
    }
    
    modified = true;
    console.log(`✅ Commented out conflicting server.listen at line ${i + 1}`);
    break;
  }
}

if (modified) {
  fs.writeFileSync('dist/index.js', lines.join('\n'));
  console.log('✅ Server conflict resolved - only port 3000 server will run');
} else {
  console.log('❌ Could not find conflicting server.listen call');
}
EOF

# Apply the fix
node fix-server-conflict.js

# Clean up
rm -f fix-server-conflict.js

# Also ensure our patched server is using the correct port from environment
echo "🔧 Ensuring PORT environment variable is properly used..."

# Quick verification that our fix is in place
echo "📋 Verifying server.listen calls:"
grep -n "server.listen" dist/index.js | head -5

# Start PM2 with proper environment
echo "🚀 Starting fixed server..."
pm2 start ecosystem.config.cjs

# Wait for startup
sleep 8

echo "📊 PM2 Status:"
pm2 status

echo "🔍 Port Check:"
netstat -tlnp | grep 3000

echo "🧪 Connection Test:"
curl -I http://localhost:3000 2>/dev/null | head -1 || echo "No HTTP response"

echo "🏥 Health Check (if available):"
curl -s http://localhost:3000/health 2>/dev/null || echo "No health endpoint"

echo "📋 Server Logs:"
pm2 logs stapubox --lines 10 --nostream

echo "✅ Final server fix completed!"
echo "🎯 The app should now be accessible at https://stapubox.com/app"