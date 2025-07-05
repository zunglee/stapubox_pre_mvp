#!/bin/bash

echo "🧪 Testing StapuBox deployment..."

cd /apps/stapubox-replit-app

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

# Check if port 3000 is listening
echo "🔍 Port 3000 status:"
netstat -tlnp | grep 3000

# Test local connection
echo "🌐 Testing local connection:"
curl -I http://localhost:3000 2>/dev/null || echo "❌ No response from localhost:3000"

# Test if frontend files exist
echo "📁 Frontend files check:"
ls -la dist/public/index.html 2>/dev/null && echo "✅ Frontend files exist" || echo "❌ Frontend files missing"

# Check recent PM2 logs
echo "📋 Recent PM2 logs:"
pm2 logs stapubox --lines 5 --nostream

# Test nginx configuration
echo "🔧 Testing nginx configuration:"
sudo nginx -t

# Check if nginx is running
echo "⚙️ Nginx status:"
sudo systemctl status nginx --no-pager -l

echo "🌐 If everything looks good, your app should be accessible at:"
echo "   https://stapubox.com/app"