# StapuBox VPS Deployment Guide

Complete guide to deploy StapuBox sports networking platform on Ubuntu VPS from scratch.

## Prerequisites
- Fresh Ubuntu 20.04+ VPS
- Root or sudo access
- Domain name (optional but recommended)

## Step 1: System Update and Basic Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip software-properties-common build-essential

# Install firewall and configure basic security
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
```

## Step 2: Install Node.js 20

```bash
# Add NodeSource repository for Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js 20
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show npm version
```

## Step 3: Install PostgreSQL 16

```bash
# Add PostgreSQL official repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-client-16 postgresql-contrib-16

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

## Step 4: Configure PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL shell, create database and user:
CREATE DATABASE stapubox_db;
CREATE USER stapubox_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE stapubox_db TO stapubox_user;
ALTER USER stapubox_user CREATEDB;
\q

# Configure PostgreSQL for network connections
sudo nano /etc/postgresql/16/main/postgresql.conf
# Find and modify: listen_addresses = '*'

sudo nano /etc/postgresql/16/main/pg_hba.conf
# Add line: host all all 0.0.0.0/0 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Step 5: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

## Step 6: Install Nginx (Web Server)

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
sudo systemctl status nginx
```

## Step 7: Clone and Setup StapuBox Project

```bash
# Create application directory
sudo mkdir -p /var/www/stapubox
sudo chown $USER:$USER /var/www/stapubox

# Clone the project (replace with your repository URL)
cd /var/www/stapubox
git clone https://github.com/your-username/stapubox.git .

# Install dependencies
npm install

# Install global TypeScript tools
sudo npm install -g tsx typescript
```

## Step 8: Environment Configuration

```bash
# Create environment file
nano .env

# Add the following environment variables:
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://stapubox_user:your_secure_password_here@localhost:5432/stapubox_db

# API Keys (replace with your actual keys)
TWOFACTOR_API_KEY=your_twofactor_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
BREVO_API_KEY=your_brevo_api_key

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-north-1
AWS_S3_BUCKET=your-s3-bucket-name

# Session Security
SESSION_SECRET=your_very_long_random_session_secret_here

# Set proper permissions
chmod 600 .env
```

## Step 9: Database Schema Setup

```bash
# Run database migrations/setup
npm run db:push

# Verify database tables are created
sudo -u postgres psql -d stapubox_db -c "\dt"
```

## Step 10: Build the Application

```bash
# Build the frontend and backend
npm run build

# Verify build completed successfully
ls -la dist/
```

## Step 11: Configure PM2 for Production

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add the following content to `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'stapubox',
    script: 'npm',
    args: 'run start',
    cwd: '/var/www/stapubox',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/stapubox/error.log',
    out_file: '/var/log/stapubox/out.log',
    log_file: '/var/log/stapubox/combined.log',
    time: true
  }]
};
```

```bash
# Create log directory
sudo mkdir -p /var/log/stapubox
sudo chown $USER:$USER /var/log/stapubox

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it provides (usually sudo env PATH=... pm2 startup systemd -u $USER --hp $HOME)
```

## Step 12: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/stapubox
```

Add the following Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Main application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Client max body size for file uploads
    client_max_body_size 10M;
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/stapubox /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 13: SSL Certificate with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

## Step 14: Configure Firewall

```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 'Nginx Full'

# Remove standalone port 5000 access (now proxied through Nginx)
sudo ufw delete allow 5000

# Check firewall status
sudo ufw status
```

## Step 15: Setup Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/stapubox
```

Add the following content:

```
/var/log/stapubox/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload stapubox
    endscript
}
```

## Step 16: System Monitoring Setup

```bash
# Install system monitoring tools
sudo apt install -y htop iotop nethogs

# Setup automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Step 17: Final Verification

```bash
# Check all services are running
sudo systemctl status postgresql
sudo systemctl status nginx
pm2 status

# Check application logs
pm2 logs stapubox

# Test database connection
sudo -u postgres psql -d stapubox_db -c "SELECT version();"

# Check website accessibility
curl -I http://localhost
curl -I http://your-domain.com  # If you have a domain
```

## Step 18: Backup Strategy

```bash
# Create backup script
sudo nano /usr/local/bin/stapubox-backup.sh
```

Add the following backup script:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/stapubox"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump stapubox_db > $BACKUP_DIR/database_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /var/www stapubox

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/stapubox-backup.sh

# Setup daily backup cron job
sudo crontab -e
# Add line: 0 2 * * * /usr/local/bin/stapubox-backup.sh >> /var/log/stapubox-backup.log 2>&1
```

## Step 19: Performance Optimization

```bash
# Optimize PostgreSQL for production
sudo nano /etc/postgresql/16/main/postgresql.conf

# Add/modify these settings based on your VPS resources:
# shared_buffers = 256MB          # 25% of RAM
# effective_cache_size = 1GB      # 75% of RAM
# work_mem = 4MB
# maintenance_work_mem = 64MB
# wal_buffers = 16MB

# Restart PostgreSQL
sudo systemctl restart postgresql

# Optimize system for Node.js
echo 'fs.file-max = 65536' | sudo tee -a /etc/sysctl.conf
echo '* soft nofile 65536' | sudo tee -a /etc/security/limits.conf
echo '* hard nofile 65536' | sudo tee -a /etc/security/limits.conf
```

## Maintenance Commands

```bash
# View application logs
pm2 logs stapubox

# Restart application
pm2 restart stapubox

# Deploy updates
cd /var/www/stapubox
git pull origin main
npm install
npm run build
pm2 restart stapubox

# Check system resources
htop
df -h
free -m

# Monitor PostgreSQL
sudo -u postgres psql -d stapubox_db -c "SELECT pid, usename, application_name, state FROM pg_stat_activity;"
```

## Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs stapubox

# Check environment variables
pm2 show stapubox

# Restart PM2
pm2 delete stapubox
pm2 start ecosystem.config.js
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connectivity
sudo -u postgres psql -d stapubox_db -c "SELECT 1;"

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log
```

## Security Recommendations

1. **Change default passwords** for database and all accounts
2. **Setup fail2ban** for SSH protection
3. **Regular updates**: `sudo apt update && sudo apt upgrade`
4. **Monitor logs** regularly for suspicious activity
5. **Use strong API keys** and rotate them periodically
6. **Enable two-factor authentication** where possible
7. **Regular backups** and test restore procedures

## Performance Monitoring

- Monitor CPU/Memory usage with `htop`
- Database performance with `pg_stat_activity`
- Application performance with PM2 monitoring
- Nginx access logs for traffic patterns
- Setup alerts for critical system metrics

This guide provides a complete production-ready deployment of StapuBox on Ubuntu VPS with proper security, monitoring, and backup strategies.