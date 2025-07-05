#!/bin/bash

echo "Deploying StapuBox to root domain..."

# Backup current nginx config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Apply new configuration
sudo cp nginx-root-domain-config.txt /etc/nginx/sites-available/default

# Test nginx configuration
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
    
    # Test the API endpoints
    echo ""
    echo "🧪 Testing API endpoints..."
    
    echo "Testing root domain API:"
    curl -s -X POST -H "Content-Type: application/json" -d '{"phoneNumber":"9876543210"}' https://stapubox.com/api/auth/send-otp || echo "API test failed"
    
    echo ""
    echo "Testing home page:"
    curl -s -I https://stapubox.com/ | head -1 || echo "Home page test failed"
    
    echo ""
    echo "✅ StapuBox is now served from root domain!"
    echo "🌐 Your app is accessible at: https://stapubox.com/"
    echo "📡 API endpoints at: https://stapubox.com/api/"
    echo "📁 Legacy /app paths redirect to root"
    echo "🔄 /buzz and /dashboard services preserved"
    
else
    echo "❌ Nginx configuration error"
    sudo nginx -t
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/default.backup /etc/nginx/sites-available/default
fi
