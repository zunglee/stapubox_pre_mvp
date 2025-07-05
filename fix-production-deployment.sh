#!/bin/bash

echo "=== StapuBox Production Deployment Fix ==="
echo ""

# Stop any existing processes
echo "1. Stopping existing processes..."
pm2 stop stapubox 2>/dev/null || echo "No PM2 process to stop"
pkill -f "node.*stapubox" 2>/dev/null || echo "No node processes to kill"
echo ""

# Build the application
echo "2. Building StapuBox application..."
if [ -d "/root/stapubox-app" ]; then
    cd /root/stapubox-app
elif [ -d "/home/stapubox" ]; then
    cd /home/stapubox
else
    echo "❌ StapuBox directory not found. Please navigate to your app directory first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the application
echo "Building application..."
npm run build || {
    echo "❌ Build failed. Check the error messages above."
    exit 1
}

# Create PM2 ecosystem file
echo "3. Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'stapubox',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '~/.pm2/logs/stapubox-error.log',
    out_file: '~/.pm2/logs/stapubox-out.log',
    log_file: '~/.pm2/logs/stapubox-combined.log',
    time: true
  }]
};
EOF

# Start with PM2
echo "4. Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

echo ""
echo "5. Verifying deployment..."

# Wait a moment for the server to start
sleep 3

# Test the server
echo "Testing server connection..."
if curl -s http://localhost:3000/ > /dev/null; then
    echo "✅ Server is running on port 3000"
else
    echo "❌ Server is not responding on port 3000"
    echo "Check PM2 logs: pm2 logs stapubox"
    exit 1
fi

# Test the OTP endpoint
echo "Testing OTP endpoint..."
response=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9999999999"}' -o /dev/null)

if [ "$response" = "400" ] || [ "$response" = "200" ]; then
    echo "✅ OTP endpoint is responding (HTTP $response)"
else
    echo "❌ OTP endpoint failed (HTTP $response)"
    pm2 logs stapubox --lines 20
    exit 1
fi

# Test through nginx
echo "Testing through nginx..."
if curl -s https://stapubox.com/ > /dev/null; then
    echo "✅ Nginx is proxying correctly"
else
    echo "❌ Nginx proxy issue"
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "✅ StapuBox is now running on https://stapubox.com"
echo ""
echo "Useful commands:"
echo "- Check status: pm2 status"
echo "- View logs: pm2 logs stapubox"
echo "- Restart: pm2 restart stapubox"
echo "- Stop: pm2 stop stapubox"
echo ""
echo "The OTP authentication should now work at:"
echo "- https://stapubox.com/login"
echo "- https://stapubox.com/register"