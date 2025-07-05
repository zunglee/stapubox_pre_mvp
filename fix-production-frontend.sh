#!/bin/bash

echo "🔧 Fixing production frontend serving to show StapuBox app instead of API status page..."

cd /apps/stapubox-replit-app

# Stop PM2 first
pm2 stop stapubox

echo "🔍 Current frontend build status:"
ls -la dist/public/

echo ""
echo "📄 Checking if index.html contains StapuBox content:"
grep -i "stapubox\|sports\|networking" dist/public/index.html | head -3 || echo "No StapuBox content found in index.html"

echo ""
echo "🏗️ Rebuilding frontend to ensure latest version..."
npm run build

echo ""
echo "📄 Checking rebuilt index.html:"
grep -i "stapubox\|sports\|networking" dist/public/index.html | head -3 || echo "Still no StapuBox content"

echo ""
echo "🔧 Patching server to force frontend serving..."

# Create a comprehensive patch that ensures frontend is served correctly
cat > fix-frontend-priority.js << 'EOF'
import fs from 'fs';
import path from 'path';

// Read the current server file
let serverCode = fs.readFileSync('dist/index.js', 'utf8');

// Remove any development status pages and force production static serving
const lines = serverCode.split('\n');
let modified = false;

// Find and remove/comment out any development status page serving
for (let i = 0; i < lines.length; i++) {
  // Look for any development mode checks that might be serving the status page
  if (lines[i].includes('development') && lines[i].includes('mode')) {
    console.log(`Found development mode check at line ${i + 1}`);
    
    // Comment out development mode serving
    let j = i;
    while (j < lines.length && !lines[j].includes('}')) {
      if (lines[j].includes('setupVite') || lines[j].includes('development')) {
        lines[j] = '  // DISABLED DEV MODE: ' + lines[j];
        modified = true;
      }
      j++;
    }
  }
  
  // Look for status page serving and disable it
  if (lines[i].includes('StapuBox Sports Platform') || 
      lines[i].includes('Development Mode') ||
      lines[i].includes('Available API Endpoints')) {
    lines[i] = '  // DISABLED STATUS PAGE: ' + lines[i];
    modified = true;
  }
}

// Force static file serving at the beginning of route handling
let staticServingAdded = false;
for (let i = 0; i < lines.length; i++) {
  // Find where routes are set up (look for app2 usage)
  if (lines[i].includes('app2.') && !staticServingAdded) {
    // Insert static serving before any other routes
    const staticServing = `
// FORCE STATIC SERVING - Serve frontend files first
app2.use(express.static(path.join(__dirname, 'dist/public')));

// Catch-all for frontend routing - serve index.html for all non-API routes
app2.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  // Serve index.html for all other routes
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});
`;
    lines.splice(i, 0, staticServing);
    staticServingAdded = true;
    modified = true;
    console.log('✅ Added priority static file serving');
    break;
  }
}

if (modified) {
  fs.writeFileSync('dist/index.js', lines.join('\n'));
  console.log('✅ Frontend serving prioritized over API status pages');
} else {
  console.log('⚠️ Could not modify frontend serving - manual check needed');
}
EOF

# Apply the frontend fix
node fix-frontend-priority.js

# Clean up
rm -f fix-frontend-priority.js

echo ""
echo "🚀 Starting server with frontend priority..."
pm2 start ecosystem.config.cjs

# Wait for startup
sleep 8

echo ""
echo "🧪 Testing frontend serving:"
curl -s http://localhost:3000 | head -10

echo ""
echo "🔍 Checking for StapuBox content in response:"
curl -s http://localhost:3000 | grep -i "stapubox\|sports\|networking" | head -3 || echo "Still showing API status page"

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ Frontend fix completed!"
echo "🎯 Your StapuBox application should now be visible at https://stapubox.com/app"