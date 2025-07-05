#!/bin/bash

echo "🔍 Debugging app startup issue..."

cd /apps/stapubox-replit-app

# Check PM2 logs for errors
echo "📋 PM2 Error Logs:"
pm2 logs stapubox --err --lines 20 --nostream

echo ""
echo "📋 PM2 Output Logs:"
pm2 logs stapubox --out --lines 10 --nostream

echo ""
echo "🔧 PM2 Process Info:"
pm2 show stapubox

echo ""
echo "📁 Checking required files:"
echo "Server file: $(ls -la dist/index.js 2>/dev/null || echo 'Missing')"
echo "Frontend file: $(ls -la dist/public/index.html 2>/dev/null || echo 'Missing')"

echo ""
echo "⚙️ Environment variables in PM2 config:"
cat ecosystem.config.cjs

echo ""
echo "🧪 Testing server file directly:"
node dist/index.js &
SERVER_PID=$!
sleep 3
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "✅ Server starts successfully when run directly"
    kill $SERVER_PID
else
    echo "❌ Server crashes when run directly"
fi

echo ""
echo "🔍 Checking for missing dependencies:"
npm ls --depth=0 | grep MISSING || echo "All dependencies installed"