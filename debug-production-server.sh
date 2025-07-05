#!/bin/bash

echo "=== StapuBox Production Server Debug ==="
echo ""

# 1. Check if Node.js service is running on port 3000
echo "1. Checking if Node.js service is running on port 3000:"
sudo netstat -tlnp | grep :3000 || echo "❌ No service found on port 3000"
echo ""

# 2. Check if the process is running
echo "2. Checking for node processes:"
ps aux | grep node | grep -v grep || echo "❌ No node processes found"
echo ""

# 3. Check if PM2 is managing the process
echo "3. Checking PM2 processes:"
pm2 list || echo "❌ PM2 not installed or no processes"
echo ""

# 4. Test direct connection to Node.js server
echo "4. Testing direct connection to localhost:3000:"
curl -I http://localhost:3000/ 2>/dev/null | head -n 1 || echo "❌ Cannot connect to localhost:3000"
echo ""

# 5. Test the specific OTP endpoint
echo "5. Testing OTP endpoint directly:"
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9999999999"}' 2>/dev/null || echo "❌ OTP endpoint not responding"
echo ""

# 6. Check nginx proxy
echo "6. Testing through nginx:"
curl -I https://stapubox.com/ 2>/dev/null | head -n 1 || echo "❌ Nginx not responding"
echo ""

# 7. Check application logs
echo "7. Recent application logs:"
if [ -f ~/.pm2/logs/stapubox-out.log ]; then
    echo "PM2 Output logs (last 10 lines):"
    tail -n 10 ~/.pm2/logs/stapubox-out.log
elif [ -f /var/log/stapubox.log ]; then
    echo "Application logs (last 10 lines):"
    tail -n 10 /var/log/stapubox.log
else
    echo "❌ No application logs found"
fi
echo ""

# 8. Check error logs
echo "8. Recent error logs:"
if [ -f ~/.pm2/logs/stapubox-error.log ]; then
    echo "PM2 Error logs (last 10 lines):"
    tail -n 10 ~/.pm2/logs/stapubox-error.log
else
    echo "❌ No error logs found"
fi
echo ""

echo "=== Debug Complete ==="
echo ""
echo "Next steps based on results:"
echo "- If no service on port 3000: Start the Node.js application"
echo "- If PM2 not running: Use PM2 to manage the process"
echo "- If OTP endpoint fails: Check application code and database connection"
echo "- If nginx fails: Check nginx configuration"