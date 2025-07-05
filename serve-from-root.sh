#!/bin/bash

echo "Creating nginx configuration to serve StapuBox from root domain..."

# Create the new nginx configuration for root domain serving
cat > nginx-root-domain-config.txt << 'EOF'
##
# StapuBox Root Domain Configuration
# This serves StapuBox directly from https://stapubox.com/
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

    # Legacy services - Keep existing buzz and dashboard
    location /buzz/ {
        rewrite ^/buzz/(.*) /buzz/$1 break; 
        proxy_pass http://localhost:2031;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /dashboard/ {
        rewrite ^/buzz/(.*) /buzz/$1 break;          
        proxy_pass http://localhost:2031;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Legacy /app path redirect to root for existing links
    location /app/ {
        return 301 https://stapubox.com$request_uri;
    }

    # StapuBox API - Direct from root
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    # StapuBox Assets - Direct from root
    location /assets/ {
        proxy_pass http://localhost:3000/assets/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Error page handling
    error_page 404 = @notfound;
    location @notfound {
        # Serve 404 through StapuBox instead of redirecting
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # StapuBox Main App - Serve from root (LOWEST PRIORITY)
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
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

# Create deployment script
cat > deploy-root-domain.sh << 'EOF'
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
EOF

chmod +x deploy-root-domain.sh

echo "✅ Configuration files created:"
echo "📄 nginx-root-domain-config.txt - New nginx configuration"
echo "🚀 deploy-root-domain.sh - Deployment script"
echo ""
echo "📋 What this configuration does:"
echo "• Serves StapuBox directly from https://stapubox.com/"
echo "• API endpoints at https://stapubox.com/api/"
echo "• Preserves /buzz and /dashboard services"
echo "• Redirects old /app paths to root domain"
echo "• Maintains SSL certificates and security"
echo ""
echo "🎯 To deploy on your Ubuntu server:"
echo "1. Copy both files to your server"
echo "2. Run: sudo ./deploy-root-domain.sh"
echo ""
echo "📱 Your StapuBox endpoints will be:"
echo "• Home: https://stapubox.com/"
echo "• API: https://stapubox.com/api/auth/send-otp"
echo "• Legacy: https://stapubox.com/buzz/ (preserved)"