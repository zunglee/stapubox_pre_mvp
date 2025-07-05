#!/bin/bash

echo "🔧 Fixing frontend serving to show StapuBox application..."

cd /apps/stapubox-replit-app

# Check what's currently being served
echo "🔍 Checking current response from localhost:3000:"
curl -s http://localhost:3000 | head -10

echo ""
echo "📁 Checking static files structure:"
ls -la dist/public/

echo ""
echo "📄 Checking index.html content:"
head -20 dist/public/index.html

# The issue is likely that the static files aren't being served correctly
# Let's create a simple fix to ensure the frontend is served properly

echo ""
echo "🛠️ Updating server to properly serve frontend..."

# Create a patch to fix static file serving
cat > fix-static-serving.js << 'EOF'
import fs from 'fs';

// Read the current server file
let serverCode = fs.readFileSync('dist/index.js', 'utf8');

// Find the static file serving setup and ensure it's correct
const lines = serverCode.split('\n');
let modified = false;

// Look for the express.static setup and ensure it's pointing to the right directory
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('express.static') && lines[i].includes('dist/public')) {
    console.log(`Found static serving at line ${i + 1}: ${lines[i]}`);
    // This should already be correct, just verify
  }
  
  // Also check for any catch-all route that serves index.html
  if (lines[i].includes('sendFile') && lines[i].includes('index.html')) {
    console.log(`Found catch-all route at line ${i + 1}: ${lines[i]}`);
  }
}

// Add a simple catch-all route if it doesn't exist
let hascatchAll = serverCode.includes('sendFile') && serverCode.includes('index.html');

if (!hascatchAll) {
  console.log('Adding catch-all route for frontend...');
  
  // Find where to insert the catch-all route (before the server.listen)
  let insertIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('__server = httpServer.listen')) {
      insertIndex = i;
      break;
    }
  }
  
  if (insertIndex > 0) {
    const catchAllRoute = `
// Catch-all route for frontend
app2.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});
`;
    lines.splice(insertIndex, 0, catchAllRoute);
    modified = true;
    console.log('✅ Added catch-all route for frontend');
  }
}

if (modified) {
  fs.writeFileSync('dist/index.js', lines.join('\n'));
  console.log('✅ Frontend serving fixed');
} else {
  console.log('ℹ️ Frontend serving appears to be configured correctly');
}
EOF

# Apply the fix
node fix-static-serving.js

# Clean up
rm -f fix-static-serving.js

# Restart PM2 to apply changes
echo ""
echo "🔄 Restarting server..."
pm2 restart stapubox

# Wait for restart
sleep 5

echo ""
echo "🧪 Testing frontend serving:"
curl -s http://localhost:3000 | head -5

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📋 Recent logs:"
pm2 logs stapubox --lines 5 --nostream

echo ""
echo "✅ Frontend serving fix completed!"
echo "🎯 Visit https://stapubox.com/app to see your StapuBox application"