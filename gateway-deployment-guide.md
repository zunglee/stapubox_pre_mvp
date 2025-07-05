# MySQL API Gateway Deployment Guide

## Overview
The MySQL API Gateway solves the mysql2 connection issue by providing HTTP endpoints that use command-line MySQL access (which works) instead of Node.js libraries (which are blocked).

## Deployment Options

### Option 1: DigitalOcean Droplet (Recommended)
**Cost**: $4-6/month | **Setup**: 15 minutes

1. **Create Droplet**:
   ```bash
   # Create Ubuntu 22.04 droplet on DigitalOcean
   # Choose $4/month basic droplet
   ```

2. **Install Dependencies**:
   ```bash
   # SSH into your droplet
   sudo apt update
   sudo apt install nodejs npm mysql-client -y
   ```

3. **Deploy Gateway**:
   ```bash
   # Upload mysql-api-gateway.js to droplet
   npm init -y
   npm install express cors
   
   # Create package.json
   cat > package.json << EOF
   {
     "name": "stapubox-mysql-gateway",
     "version": "1.0.0",
     "main": "mysql-api-gateway.js",
     "scripts": {
       "start": "node mysql-api-gateway.js",
       "dev": "nodemon mysql-api-gateway.js"
     },
     "dependencies": {
       "express": "^4.18.2",
       "cors": "^2.8.5"
     }
   }
   EOF
   
   # Start the gateway
   npm start
   ```

4. **Setup Process Manager**:
   ```bash
   # Install PM2 for production
   npm install -g pm2
   pm2 start mysql-api-gateway.js --name "mysql-gateway"
   pm2 startup
   pm2 save
   ```

5. **Configure Firewall**:
   ```bash
   # Allow HTTP traffic
   sudo ufw allow 3001
   sudo ufw enable
   ```

### Option 2: Railway (1-Click Deploy)
**Cost**: $5/month | **Setup**: 5 minutes

1. **Connect GitHub**:
   - Create repository with gateway files
   - Connect Railway to GitHub

2. **Deploy**:
   ```bash
   # Railway automatically detects Node.js and deploys
   # No configuration needed
   ```

3. **Environment Variables**:
   ```
   PORT=3001
   MYSQL_GATEWAY_API_KEY=stapubox-mysql-gateway-2025
   ```

### Option 3: Render (Free Tier)
**Cost**: Free | **Setup**: 10 minutes

1. **Create Web Service**:
   - Upload code to GitHub
   - Connect Render to repository

2. **Configure**:
   ```
   Build Command: npm install
   Start Command: npm start
   ```

### Option 4: Heroku
**Cost**: $7/month | **Setup**: 10 minutes

1. **Deploy**:
   ```bash
   # Install Heroku CLI
   heroku create stapubox-mysql-gateway
   git push heroku main
   ```

## Testing the Gateway

Once deployed, test with:

```bash
# Replace YOUR_GATEWAY_URL with actual deployment URL
export GATEWAY_URL="https://your-gateway-server.com"
export API_KEY="stapubox-mysql-gateway-2025"

# Test health
curl "$GATEWAY_URL/health"

# Test MySQL connection
curl -H "X-API-Key: $API_KEY" "$GATEWAY_URL/test"

# Test user query
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"sql":"SELECT COUNT(*) as users FROM users"}' \
  "$GATEWAY_URL/query"
```

## Integration with Replit

Once gateway is deployed, update your Replit environment:

```bash
# Add these environment variables in Replit
MYSQL_GATEWAY_URL=https://your-gateway-server.com
MYSQL_GATEWAY_API_KEY=stapubox-mysql-gateway-2025
```

Then switch your storage:

```typescript
// In server/routes.ts
import { MySQLGatewayStorage } from "./mysql-gateway-storage";
const storage = new MySQLGatewayStorage();
```

## Security Notes

1. **API Key**: Change the default API key in production
2. **HTTPS**: Ensure gateway runs on HTTPS in production
3. **Rate Limiting**: Add rate limiting for production use
4. **IP Whitelist**: Restrict access to known IPs if possible

## Monitoring

Add basic monitoring:

```javascript
// Add to gateway
app.get('/metrics', requireApiKey, async (req, res) => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  
  res.json({
    uptime: `${Math.floor(uptime / 60)} minutes`,
    memory: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    timestamp: new Date().toISOString()
  });
});
```

## Next Steps

1. Choose deployment option (DigitalOcean recommended for reliability)
2. Deploy the gateway server
3. Test all endpoints
4. Update Replit environment variables
5. Switch storage implementation
6. Verify all functionality works through gateway

The gateway will give you full MySQL access without any connection restrictions!