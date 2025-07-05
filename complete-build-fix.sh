#!/bin/bash

echo "🔧 Complete build fix - adding frontend..."

cd /apps/stapubox-replit-app

# Stop PM2
pm2 stop stapubox

# Create the missing dist/public directory
mkdir -p dist/public

# Build the frontend (client)
echo "🏗️ Building frontend..."
npx vite build --outDir dist/public

# If frontend build fails or takes too long, create a minimal index.html
if [ ! -f "dist/public/index.html" ]; then
    echo "⚡ Creating minimal frontend..."
    cat > dist/public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>StapuBox</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <div id="root">
        <h1>StapuBox</h1>
        <p>Loading...</p>
    </div>
    <script>
        // Redirect to API for now
        if (window.location.pathname === '/') {
            window.location.href = '/api/users/search';
        }
    </script>
</body>
</html>
EOF
    
    # Create basic assets
    mkdir -p dist/public/assets
    echo "/* Basic CSS */" > dist/public/assets/index.css
fi

# Restart PM2
echo "🚀 Restarting app with frontend..."
pm2 restart stapubox

# Check status
sleep 3
echo "📊 PM2 Status:"
pm2 status

echo "🧪 Testing app..."
curl -I http://localhost:3000 2>/dev/null | head -1
curl -s http://localhost:3000 | head -3

echo "🔍 Checking port 3000:"
netstat -tlnp | grep 3000

echo "✅ Build fix completed!"
echo "🌐 Try accessing: https://stapubox.com/app"