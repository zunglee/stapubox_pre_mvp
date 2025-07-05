# 🔧 StapuBox Deployment Troubleshooting Guide

This guide covers common issues encountered during StapuBox deployment and their solutions.

## 🚨 Common Issues & Solutions

### 1. API Endpoints Returning 404

**Issue:** `/api/users/send-otp` and `/api/auth/send-otp` return 404 errors

**Root Cause:** 
- Nginx not properly proxying requests to Node.js application
- Node.js application not running on port 3000
- Incorrect API route configuration

**Solutions:**

```bash
# 1. Check if Node.js application is running
pm2 list
# Should show 'stapubox' app in 'online' status

# 2. Check application logs
pm2 logs stapubox
# Look for startup errors or port conflicts

# 3. Test direct connection to Node.js app
curl http://localhost:3000/api/users/send-otp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9871430493"}'

# 4. If direct connection works, check Nginx configuration
sudo nginx -t
sudo systemctl reload nginx

# 5. Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

**Fix Steps:**
1. Ensure application runs on port 3000 in production
2. Verify Nginx proxy_pass points to `http://localhost:3000/`
3. Check that location `/` block catches all API routes

---

### 2. Database Connection Failures

**Issue:** Application can't connect to PostgreSQL database

**Symptoms:**
- App crashes on startup
- Error: "Connection refused" or "Authentication failed"

**Solutions:**

```bash
# 1. Check PostgreSQL service status
sudo systemctl status postgresql

# 2. Test database connection manually
psql -U stapubox_user -h localhost -d stapubox_db

# 3. Verify database credentials in .env file
cat .env | grep -E "(PGUSER|PGPASSWORD|PGDATABASE|DATABASE_URL)"

# 4. Check PostgreSQL configuration
sudo nano /etc/postgresql/*/main/postgresql.conf
# Ensure: listen_addresses = 'localhost'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add: local   stapubox_db   stapubox_user   md5

# 5. Restart PostgreSQL
sudo systemctl restart postgresql
```

---

### 3. Port 3000 Already in Use

**Issue:** Application fails to start due to port conflict

**Solutions:**

```bash
# 1. Find what's using port 3000
sudo netstat -tulpn | grep :3000
sudo lsof -i :3000

# 2. Kill the conflicting process
sudo kill -9 <PID>

# 3. Or change port in production configuration
nano config/production.env
# Change: PORT=3001

# Update Nginx configuration accordingly
sudo nano /etc/nginx/sites-available/stapubox.com
# Change proxy_pass to: http://localhost:3001/
```

---

### 4. SSL/HTTPS Certificate Issues

**Issue:** HTTPS not working, SSL errors

**Solutions:**

```bash
# 1. Check certificate status
sudo certbot certificates

# 2. Renew certificate if expired
sudo certbot renew --dry-run
sudo certbot renew

# 3. Check Nginx SSL configuration
sudo nginx -t

# 4. Restart services
sudo systemctl restart nginx
```

---

### 5. PM2 Process Management Issues

**Issue:** Application keeps crashing or not starting with PM2

**Solutions:**

```bash
# 1. Check PM2 status
pm2 list
pm2 show stapubox

# 2. View detailed logs
pm2 logs stapubox --lines 50

# 3. Restart with fresh configuration
pm2 stop stapubox
pm2 delete stapubox
pm2 start ecosystem.config.production.cjs --env production

# 4. Check PM2 startup script
pm2 startup
pm2 save
```

---

### 6. Environment Configuration Issues

**Issue:** Environment variables not loading correctly

**Solutions:**

```bash
# 1. Verify .env file exists and has correct permissions
ls -la .env
chmod 600 .env

# 2. Check for syntax errors in .env
cat .env | grep -E "^[^#].*="

# 3. Test configuration loading
node -e "
require('dotenv').config();
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
"
```

---

### 7. Build Process Failures

**Issue:** `npm run build` fails

**Solutions:**

```bash
# 1. Clear cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 2. Check for TypeScript errors
npm run build 2>&1 | tee build.log

# 3. Verify all required dependencies are installed
npm list --depth=0

# 4. Check disk space
df -h
```

---

### 8. Nginx Configuration Issues

**Issue:** Nginx not starting or configuration errors

**Solutions:**

```bash
# 1. Test Nginx configuration
sudo nginx -t

# 2. Check Nginx syntax
sudo nginx -T

# 3. View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# 4. Backup and restore known good configuration
sudo cp /etc/nginx/sites-available/stapubox.com /etc/nginx/sites-available/stapubox.com.backup
```

---

### 9. Memory/Performance Issues

**Issue:** Application running out of memory or performing poorly

**Solutions:**

```bash
# 1. Monitor memory usage
pm2 monit

# 2. Adjust PM2 memory limits
pm2 restart stapubox --max-memory-restart 1G

# 3. Enable PM2 clustering
# Update ecosystem.config.production.cjs:
instances: 'max'  # or specific number like 2

# 4. Check system resources
free -h
top
```

---

### 10. Database Migration Issues

**Issue:** Database schema not created or outdated

**Solutions:**

```bash
# 1. Run database push to create/update schema
npm run db:push

# 2. Check database tables exist
psql -U stapubox_user -h localhost -d stapubox_db -c "\dt"

# 3. Manually create tables if needed
psql -U stapubox_user -h localhost -d stapubox_db < schema.sql
```

---

## 🔍 Diagnostic Commands

### Quick Health Check Script

```bash
#!/bin/bash
echo "=== StapuBox Health Check ==="

echo "1. Checking PM2 processes..."
pm2 list

echo "2. Checking Nginx status..."
sudo systemctl status nginx --no-pager

echo "3. Checking PostgreSQL status..."
sudo systemctl status postgresql --no-pager

echo "4. Testing local API..."
curl -s http://localhost:3000/api/health || echo "Local API not responding"

echo "5. Testing external API..."
curl -s https://stapubox.com/api/health || echo "External API not responding"

echo "6. Checking logs for errors..."
pm2 logs stapubox --lines 10 --nostream

echo "=== Health Check Complete ==="
```

### Log Analysis

```bash
# Check application logs for specific errors
pm2 logs stapubox | grep -i error

# Check Nginx access logs for API calls
sudo tail -f /var/log/nginx/access.log | grep "/api/"

# Monitor real-time requests
sudo tail -f /var/log/nginx/access.log
```

---

## 🎯 Prevention Best Practices

1. **Regular Backups:** Schedule automated database backups
2. **Monitoring:** Set up log monitoring and alerts
3. **Updates:** Keep system and dependencies updated
4. **Documentation:** Document any custom configurations
5. **Testing:** Test deployments in staging environment first

---

## 📞 Emergency Recovery

If everything fails:

```bash
# 1. Stop all services
pm2 stop all
sudo systemctl stop nginx

# 2. Restore from backup
# (Restore database and application files)

# 3. Start services in order
sudo systemctl start postgresql
sudo systemctl start nginx
pm2 start ecosystem.config.production.cjs --env production

# 4. Verify everything is working
curl https://stapubox.com/api/health
```

Remember: Always backup before making changes!