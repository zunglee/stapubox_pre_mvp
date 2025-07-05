#!/bin/bash

echo "🔍 Examining the actual server code structure..."

cd /apps/stapubox-replit-app

# Look for the server.listen call and surrounding context
echo "📋 Finding server.listen calls:"
grep -n -A 5 -B 5 "listen(" dist/index.js

echo ""
echo "📋 Finding HTTP server creation:"
grep -n -A 3 -B 3 "createServer\|httpServer" dist/index.js

echo ""
echo "📋 Finding port references:"
grep -n "PORT\|port\|3000" dist/index.js | head -10

echo ""
echo "📋 Finding the end of the file (where we can add code):"
tail -20 dist/index.js

echo ""
echo "📋 Checking if our patch was actually added:"
grep -n "StapuBox server running" dist/index.js || echo "Patch not found in file"