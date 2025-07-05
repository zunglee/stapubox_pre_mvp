#!/bin/bash

echo "=== Testing StapuBox OTP Endpoint ==="
echo ""

# Test 1: Direct connection to localhost:3000
echo "1. Testing direct connection to Node.js server:"
echo "URL: http://localhost:3000/api/auth/send-otp"
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9999999999"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s || echo "❌ Direct connection failed"

echo ""

# Test 2: Connection through nginx (production)
echo "2. Testing through nginx proxy:"
echo "URL: https://stapubox.com/api/auth/send-otp"
curl -X POST https://stapubox.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9999999999"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s || echo "❌ Nginx proxy connection failed"

echo ""

# Test 3: Check if server is listening on port 3000
echo "3. Checking if service is listening on port 3000:"
netstat -tlnp | grep :3000 || echo "❌ No service listening on port 3000"

echo ""

# Test 4: List all API endpoints
echo "4. Testing if server responds at all:"
curl -s http://localhost:3000/ | head -c 100 || echo "❌ Server not responding"

echo ""

# Test 5: Check PM2 status
echo "5. PM2 process status:"
pm2 status 2>/dev/null || echo "❌ PM2 not running or no processes"

echo ""
echo "=== Test Complete ==="