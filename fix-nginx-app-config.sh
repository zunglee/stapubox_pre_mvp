#!/bin/bash

echo "🔧 Fixing nginx configuration for /app deployment..."

# Create corrected nginx config
cat > /etc/nginx/sites-available/default << 'EOF'
##
# Corrected nginx configuration for stapubox.com
##

# Map User-Agent to mobile detection variable
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
    ~*(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge|maemo|midp|mmp|mobile.+firefox|netfront|opera.m(ob|in)i|palm(.os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows.ce|xda|xiino 1;
}

map $is_mobile $device_type {
    default "desktop";
    1 "mobile";
}

server { 
    server_name www.stapubox.com stapubox.com; 

    if ($host = www.stapubox.com) {
        return 301 https://stapubox.com$request_uri;
    }

    # StapuBox App - HIGHEST PRIORITY
    location /app/api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    location /app/assets/ {
        proxy_pass http://localhost:5000/assets/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /app/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    # Dashboard
    location /dashboard/ {
        rewrite ^/buzz/(.*) /buzz/$1 break;          
        proxy_pass http://localhost:2031;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Buzz
    location /buzz/ {
        rewrite ^/buzz/(.*) /buzz/$1 break; 
        proxy_pass http://localhost:2031;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Error page
    error_page 404 = @notfound;
    location @notfound {
        return 301 /;
    }

    # Main site (LOWEST PRIORITY)
    location / {
        add_header 'Access-Control-Allow-Origin' '*';
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/stapubox.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stapubox.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Rate Limiter
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

# Test nginx configuration
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    systemctl reload nginx
    
    echo "🔄 Nginx reloaded successfully"
    
    # Test the API endpoint
    echo "🧪 Testing API endpoint..."
    sleep 2
    
    curl -X POST \
         -H "Content-Type: application/json" \
         -d '{"phoneNumber":"9876543210"}' \
         https://stapubox.com/app/api/auth/send-otp \
         -v
    
    echo ""
    echo "✅ Nginx configuration fixed!"
    echo "📡 API endpoints now accessible at: https://stapubox.com/app/api/"
    echo "🌐 Frontend accessible at: https://stapubox.com/app/"
    
else
    echo "❌ Nginx configuration error - please check syntax"
    nginx -t
fi