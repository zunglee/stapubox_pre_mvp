#!/bin/bash

echo "🔍 Debugging nginx API configuration..."

# Test local server first
echo "1. Testing local server (port 3000):"
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"phoneNumber":"9876543210"}' http://localhost:3000/api/auth/send-otp)
if [ "$response" = "200" ]; then
    echo "✅ Local server working (port 3000)"
else
    echo "❌ Local server not responding on port 3000 (HTTP: $response)"
fi

# Check if nginx is running and configured
echo ""
echo "2. Checking nginx status:"
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
fi

# Test nginx proxy
echo ""
echo "3. Testing nginx proxy to local server:"
# Test direct nginx proxy
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"phoneNumber":"9876543210"}' http://localhost/api/auth/send-otp 2>/dev/null)
echo "HTTP proxy test: $response"

# Check nginx configuration
echo ""
echo "4. Current nginx configuration:"
if [ -f "/etc/nginx/sites-available/default" ]; then
    echo "Found nginx config, checking for StapuBox entries..."
    grep -n "location /api/" /etc/nginx/sites-available/default || echo "No /api/ location found"
    grep -n "proxy_pass.*3000" /etc/nginx/sites-available/default || echo "No port 3000 proxy found"
else
    echo "❌ No nginx config found at /etc/nginx/sites-available/default"
fi

# Check if port 3000 is accessible
echo ""
echo "5. Port connectivity check:"
if ss -tlnp | grep :3000; then
    echo "✅ Port 3000 is listening"
else
    echo "❌ Port 3000 is not listening"
fi

# Test nginx error logs
echo ""
echo "6. Recent nginx error logs:"
if [ -f "/var/log/nginx/error.log" ]; then
    tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No recent errors"
else
    echo "No nginx error log found"
fi

echo ""
echo "🔧 RECOMMENDED FIXES:"
echo "1. Ensure nginx config has: location /api/ { proxy_pass http://localhost:3000/api/; }"
echo "2. Reload nginx: sudo systemctl reload nginx"
echo "3. Check server is running on port 3000"
echo "4. Verify firewall allows port 3000 internally"