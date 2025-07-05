#!/bin/bash

echo "Updating nginx configuration for port 5000..."

# Create the corrected nginx configuration
cat > nginx-stapubox-config.txt << 'EOF'
# StapuBox App Configuration - USE PORT 5000

# Add this to your /etc/nginx/sites-available/default file on Ubuntu server:

    # StapuBox App - HIGHEST PRIORITY (before other location blocks)
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

# Commands to run on Ubuntu server:

sudo nano /etc/nginx/sites-available/default
# Add the above location blocks at the TOP of the server block

sudo nginx -t
sudo systemctl reload nginx

# Test the API:
curl -X POST -H "Content-Type: application/json" -d '{"phoneNumber":"9876543210"}' https://stapubox.com/app/api/auth/send-otp
EOF

echo "Nginx configuration created in nginx-stapubox-config.txt"
echo ""
echo "Apply this configuration on your Ubuntu server (stapubox.com):"
echo "1. Copy the location blocks to /etc/nginx/sites-available/default"
echo "2. Place them at the TOP of the server block (before existing locations)"
echo "3. Run: sudo nginx -t"
echo "4. Run: sudo systemctl reload nginx"
echo ""
echo "Your server is running correctly on port 5000 with working APIs."
echo "The nginx configuration needs to proxy to port 5000 instead of 3000."

cat nginx-stapubox-config.txt