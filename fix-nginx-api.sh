#!/bin/bash

echo "🔧 Fixing nginx API configuration for StapuBox..."

# Create a completely corrected nginx configuration
cat > nginx-fixed-config.txt << 'EOF'
##
# Fixed StapuBox Configuration - API Working
##

map $http_user_agent $is_mobile {
    default 0;
    ~*android.*mobile 1;
    ~*iphone 1;
    ~*ipod 1;
    ~*blackberry 1;
    ~*iemobile 1;
    ~*opera.*(mini|mobi) 1;
    ~*mobile.*safari 1;
    ~*mobile.*firefox 1;
    ~*windows.*phone 1;
    ~*mobile 1;
    ~*mobi 1;
}

server { 
    server_name www.stapubox.com stapubox.com; 

    # Redirect www to non-www
    if ($host = www.stapubox.com) {
        return 301 https://stapubox.com$request_uri;
    }

    # StapuBox API Routes - HIGHEST PRIORITY
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 86400;
    }

    # StapuBox Static Assets
    location /assets/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Legacy Buzz Service
    location /buzz/ {
        proxy_pass http://127.0.0.1:2031;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Legacy Dashboard Service  
    location /dashboard/ {
        proxy_pass http://127.0.0.1:2031;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Legacy /app redirect (for old bookmarks)
    location /app {
        return 301 https://stapubox.com/;
    }

    location /app/ {
        return 301 https://stapubox.com/;
    }

    # StapuBox Main Application - LOWEST PRIORITY
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/stapubox.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stapubox.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Rate limiting
    limit_req zone=one burst=20 nodelay;
}

# HTTP to HTTPS redirect
server {
    if ($host = www.stapubox.com) {
        return 301 https://$host$request_uri;
    }

    if ($host = stapubox.com) {
        return 301 https://$host$request_uri;
    }

    listen 80; 
    server_name www.stapubox.com stapubox.com;
    return 404;
}
EOF

# Create immediate fix script
cat > immediate-nginx-fix.sh << 'EOF'
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
EOF

chmod +x immediate-nginx-fix.sh

echo "✅ Created nginx API fix files:"
echo "📄 nginx-fixed-config.txt - Corrected configuration"
echo "🔧 immediate-nginx-fix.sh - Apply fix script"
echo ""
echo "🔍 Key fixes in this configuration:"
echo "• Uses 127.0.0.1:3000 instead of localhost:3000"
echo "• Adds proper HTTP/1.1 headers for API compatibility"
echo "• Sets /api/ location as highest priority"
echo "• Disables proxy buffering for real-time responses"
echo "• Adds proper upgrade headers for WebSocket support"
echo ""
echo "🚀 To apply the fix on your Ubuntu server:"
echo "sudo ./immediate-nginx-fix.sh"
echo ""
echo "📋 This will:"
echo "1. Backup your current nginx config"
echo "2. Apply the corrected configuration"
echo "3. Test and reload nginx"
echo "4. Verify API endpoints are working"