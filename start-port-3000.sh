#!/bin/bash

echo "Starting StapuBox server on port 3000..."

# Kill any existing processes on port 3000
pkill -f "tsx.*server/index.ts" 2>/dev/null || true
pkill -f "node.*index.js" 2>/dev/null || true
sleep 2

# Build the application first
echo "Building application..."
npm run build

# Start server directly on port 3000 in production mode
echo "Starting server on port 3000..."
export NODE_ENV=production
export PORT=3000

# Start server and capture output
nohup node dist/index.js > port3000.log 2>&1 &
PID=$!

# Wait for startup
sleep 5

# Check if server started
if ps -p $PID > /dev/null; then
    echo "✅ Server started successfully on port 3000 (PID: $PID)"
    
    # Test the API
    echo "Testing API endpoint..."
    response=$(curl -s -X POST -H "Content-Type: application/json" -d '{"phoneNumber":"9876543210"}' http://localhost:3000/api/auth/send-otp)
    
    if [[ $response == *"OTP sent successfully"* ]]; then
        echo "✅ API test successful: $response"
    else
        echo "⚠️ API test response: $response"
    fi
    
    echo ""
    echo "Server running on http://localhost:3000"
    echo "API available at http://localhost:3000/api/"
    echo "Log file: port3000.log"
    
    # Show recent logs
    echo ""
    echo "Recent server logs:"
    tail -10 port3000.log
    
else
    echo "❌ Server failed to start"
    echo "Error logs:"
    cat port3000.log
fi