#!/bin/bash

echo "🚀 Applying immediate nginx fix..."

# Backup current config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# Apply new configuration
sudo cp nginx-fixed-config.txt /etc/nginx/sites-available/default

# Test configuration
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
    
    # Wait a moment for reload
    sleep 2
    
    # Test the API
    echo ""
    echo "🧪 Testing API..."
    
    # Test local first
    echo "Local test (port 3000):"
    curl -s -X POST -H "Content-Type: application/json" -d '{"phoneNumber":"9876543210"}' http://localhost:3000/api/auth/send-otp
    
    echo ""
    echo "Nginx proxy test:"
    curl -s -X POST -H "Content-Type: application/json" -d '{"phoneNumber":"9876543210"}' https://stapubox.com/api/auth/send-otp
    
    echo ""
    echo "✅ API fix applied!"
    
else
    echo "❌ Nginx configuration error:"
    sudo nginx -t
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/default
    sudo systemctl reload nginx
fi
