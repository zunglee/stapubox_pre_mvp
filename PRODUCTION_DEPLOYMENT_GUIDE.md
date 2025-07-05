# 🚀 StapuBox Production Deployment Guide

This guide will help you deploy StapuBox to your Ubuntu server with PostgreSQL and Nginx.

## 📋 Prerequisites

- Ubuntu server with root access
- Domain name pointing to your server (stapubox.com)
- PostgreSQL installed and configured
- Nginx installed
- Node.js 18+ installed
- SSL certificate configured

## 🎯 Quick Deployment Steps

### 1. Prepare Your Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Git (if not installed)
sudo apt install git -y
```

### 2. Clone and Setup Project

```bash
# Navigate to your projects directory
cd /var/www/

# Clone your project (replace with your git repository)
sudo git clone <your-repository-url> stapubox
cd stapubox

# Set correct permissions
sudo chown -R $USER:$USER /var/www/stapubox
sudo chmod -R 755 /var/www/stapubox

# Install dependencies
npm install
```

### 3. Configure Environment

```bash
# Copy production configuration
cp config/production.env .env

# Edit the environment file with your actual values
nano .env
```

**Important:** Update these values in your `.env` file:
- `SESSION_SECRET` - Generate a strong random string
- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY` - Your AWS credentials
- `BREVO_API_KEY` - Your Brevo email service API key

### 4. Setup Database Migration

```bash
# Run database migration to create tables
npm run db:push
```

### 5. Build and Start Application

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### 6. Configure Nginx

Create or update your Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/stapubox.com
```

Copy this configuration:

```nginx
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
        proxy_pass http://localhost:2031/buzz/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /dashboard/ {
        proxy_pass http://localhost:2031/dashboard/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Legacy /app path redirect to root for existing links
    location /app/ {
        return 301 https://stapubox.com$request_uri;
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
```

### 7. Enable and Restart Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Enable the site (if not already enabled)
sudo ln -sf /etc/nginx/sites-available/stapubox.com /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## 🧪 Testing Your Deployment

### Test API Endpoints

```bash
# Test OTP endpoint
curl -X POST https://stapubox.com/api/users/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9871430493"}'

# Should return: {"success": true, "message": "OTP sent successfully"}
```

### Test Website

1. Open https://stapubox.com in your browser
2. You should see the StapuBox homepage
3. Try registration/login flow
4. Test multi-select filters

## 🔧 Management Commands

### PM2 Management
```bash
# View running processes
pm2 list

# View logs
pm2 logs stapubox

# Restart application
pm2 restart stapubox

# Stop application
pm2 stop stapubox

# Monitor performance
pm2 monit
```

### Database Management
```bash
# Connect to PostgreSQL
sudo -u postgres psql -d stapubox_db

# Backup database
pg_dump -U stapubox_user -h localhost stapubox_db > backup.sql

# Restore database
psql -U stapubox_user -h localhost -d stapubox_db < backup.sql
```

### Application Updates
```bash
# Pull latest code
cd /var/www/stapubox
git pull origin main

# Install new dependencies
npm install

# Rebuild application
npm run build

# Restart with PM2
pm2 restart stapubox
```

## 🚨 Troubleshooting Common Issues

### Issue 1: 404 Errors on API Calls
**Problem:** API endpoints return 404
**Solution:** 
1. Check if StapuBox service is running: `pm2 list`
2. Check logs: `pm2 logs stapubox`
3. Verify Nginx configuration: `sudo nginx -t`

### Issue 2: Database Connection Failed
**Problem:** Application can't connect to PostgreSQL
**Solution:**
1. Check PostgreSQL status: `sudo systemctl status postgresql`
2. Verify database credentials in `.env` file
3. Test database connection manually

### Issue 3: SSL Certificate Issues
**Problem:** HTTPS not working
**Solution:**
1. Check certificate validity: `sudo certbot certificates`
2. Renew if needed: `sudo certbot renew`
3. Restart Nginx: `sudo systemctl restart nginx`

### Issue 4: Port 3000 Already in Use
**Problem:** Application fails to start
**Solution:**
1. Check what's using port 3000: `sudo netstat -tulpn | grep :3000`
2. Kill the process or change port in production.env
3. Restart application

## 📊 Monitoring

### Log Locations
- Application logs: `pm2 logs stapubox`
- Nginx logs: `/var/log/nginx/error.log` and `/var/log/nginx/access.log`
- PostgreSQL logs: `/var/log/postgresql/`

### Health Checks
```bash
# Check application health
curl https://stapubox.com/api/health

# Check database connection
curl https://stapubox.com/api/users/filter-options?userType=player
```

## 🔒 Security Best Practices

1. **Change default passwords** - Update all default credentials
2. **Enable firewall** - `sudo ufw enable` and allow only necessary ports
3. **Regular updates** - Keep system and dependencies updated
4. **Backup regularly** - Automate database backups
5. **Monitor logs** - Set up log monitoring and alerts

## 🎉 Deployment Complete!

Your StapuBox application should now be running at https://stapubox.com

For support, check the logs and troubleshooting section above.