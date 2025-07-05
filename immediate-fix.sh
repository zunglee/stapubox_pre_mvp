#!/bin/bash

echo "🔍 Checking current app status and fixing immediate issues..."

cd /apps/stapubox-replit-app

# Check current PM2 logs for the exact error
echo "📋 Current PM2 Error Logs:"
pm2 logs stapubox --err --lines 5 --nostream

echo ""
echo "📋 Current PM2 Output Logs:"
pm2 logs stapubox --out --lines 5 --nostream

# The issue is likely the static file serving error - let's fix the server configuration
echo ""
echo "🔧 Checking if dist/public exists and has content:"
ls -la dist/public/

# Test if we can start the server with a basic configuration that bypasses static file serving
echo ""
echo "🧪 Testing basic server startup..."

# Create a minimal test server to verify the core app works
cat > test-server.js << 'EOF'
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('<h1>StapuBox Test Server</h1><p>Server is working!</p>');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});
EOF

# Test the basic server
echo "Starting test server..."
NODE_ENV=production PORT=3000 DATABASE_URL='postgresql://stapubox_user:npg_dwAQM3ULCKs5@localhost:5432/stapubox_db?sslmode=disable' node test-server.js &
TEST_PID=$!

sleep 3

# Check if test server is listening
echo "🔍 Test server port check:"
netstat -tlnp | grep 3000

if netstat -tlnp | grep -q 3000; then
    echo "✅ Basic Node.js server CAN listen on port 3000"
    curl -s http://localhost:3000/health
else
    echo "❌ Even basic server cannot listen on port 3000"
fi

# Kill test server
kill $TEST_PID 2>/dev/null

# Clean up
rm -f test-server.js

echo ""
echo "🔧 The issue is in the main application. Let's check for static file serving errors..."

# Check if the static file path exists as expected by the server
echo "Static file check:"
echo "dist/public exists: $([ -d dist/public ] && echo YES || echo NO)"
echo "index.html exists: $([ -f dist/public/index.html ] && echo YES || echo NO)"
echo "index.html size: $([ -f dist/public/index.html ] && stat -c%s dist/public/index.html || echo N/A) bytes"

# Try restarting PM2 once more
echo ""
echo "🔄 Restarting PM2 one more time..."
pm2 restart stapubox

sleep 3
echo "Port check after restart:"
netstat -tlnp | grep 3000