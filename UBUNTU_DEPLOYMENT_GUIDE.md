# StapuBox Ubuntu Server Deployment Guide

## Database Information
**Database:** This project uses PostgreSQL. We'll install PostgreSQL on your Ubuntu server alongside your existing MySQL (both can run together without conflicts).

## Prerequisites
Your server already has:
- Ubuntu (any recent version)
- MySQL installed and running (will keep running)
- Nginx installed and running
- Java installed
- Domain: stapubox.com pointing to your server
- Java service running on port 2025

**We will add:**
- PostgreSQL 16
- Node.js 20
- PM2 (process manager)

## Part 1: Install Required Software

### Step 1: Update your system
```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install PostgreSQL 16
```bash
# Install PostgreSQL 16
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

### Step 2.1: Install additional system dependencies
```bash
# Install build tools for node-gyp and native dependencies
sudo apt install build-essential python3-dev -y
```

### Step 3: Install Node.js (version 20)
```bash
# Download and install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Install PM2 (to keep your app running)
```bash
sudo npm install -g pm2
```

### Step 5: Install Git (if not already installed)
```bash
sudo apt install git -y
```

## Part 2: Deploy Your Code

### Method 1: Direct Git Clone (Recommended)

#### Step 1: Create a deployment directory
```bash
sudo mkdir -p /var/www/stapubox
sudo chown $USER:$USER /var/www/stapubox
cd /var/www/stapubox
```

#### Step 2: Clone your repository
```bash
# Replace 'your-repo-url' with your actual repository URL
git clone https://github.com/your-username/your-repo-name.git .

# OR if you don't have a git repository yet, create one:
# On your local machine (Replit), run:
# git init
# git add .
# git commit -m "Initial commit"
# git remote add origin https://github.com/your-username/your-repo-name.git
# git push -u origin main
```

#### Step 3: Future deployments (easy updates)
```bash
# Whenever you want to update your server with new code:
cd /var/www/stapubox
git pull origin main
npm install
npm run build
pm2 restart stapubox
```

### Method 2: Using rsync (Alternative)

#### Step 1: From your local machine/Replit, sync files
```bash
# Run this command from your local project directory
rsync -avz --exclude 'node_modules' --exclude '.git' ./ username@your-server-ip:/var/www/stapubox/

# Example:
# rsync -avz --exclude 'node_modules' --exclude '.git' ./ root@192.168.1.100:/var/www/stapubox/
```

## Part 3: Setup PostgreSQL Database

### Step 1: Create PostgreSQL database and user
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run these commands:
CREATE DATABASE stapubox_db;
CREATE USER stapubox_user WITH ENCRYPTED PASSWORD 'npg_dwAQM3ULCKs5';
GRANT ALL PRIVILEGES ON DATABASE stapubox_db TO stapubox_user;

# Connect to the new database to set schema permissions
\c stapubox_db

# Grant schema permissions
GRANT ALL ON SCHEMA public TO stapubox_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stapubox_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stapubox_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO stapubox_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO stapubox_user;
\q
```

### Step 2: Create environment file
```bash
cd /var/www/stapubox
cp .env.example .env
nano .env
```

### Step 3: Configure environment variables
```bash
# In the .env file, set these values:
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://stapubox_user:npg_dwAQM3ULCKs5@localhost:5432/stapubox_db

# Database connection details (for PostgreSQL)
PGHOST=localhost
PGPORT=5432
PGUSER=stapubox_user
PGPASSWORD=npg_dwAQM3ULCKs5
PGDATABASE=stapubox_db

# API keys (using current production values):
TWOFACTOR_API_KEY=8e3fbee1-37bf-11f0-8b17-0200cd936042
BREVO_API_KEY=your_brevo_api_key
GOOGLE_MAPS_API_KEY=AIzaSyDgvWsa_ZEAtV2WIJfz9h845RUrwgfoXpA

# AWS S3 credentials for profile picture uploads (REQUIRED):
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-north-1
AWS_S3_BUCKET_NAME=stapubox-replit-data

# Session secret (generate a random string)
SESSION_SECRET=your_very_long_random_secret_string_here
```

## Part 4: Install and Build

### Step 1: Install dependencies
```bash
cd /var/www/stapubox
npm install
```

### Step 2: Build the project
```bash
npm run build
```

### Step 3: Setup database tables
```bash
npm run db:push
```

## Part 5: Configure PM2 (Keep App Running)

### Step 1: Create PM2 configuration
```bash
cd /var/www/stapubox
nano ecosystem.config.cjs
```

### Step 2: Add this configuration
```javascript
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
    }
  }]
};
```

### Step 2.1: Fix file permissions (IMPORTANT)
```bash
# Change ownership from root to current user
sudo chown -R $USER:$USER /apps/stapubox-replit-app
sudo chown -R $USER:$USER /var/www/stapubox

# Verify permissions are correct
ls -la /var/www/stapubox
ls -la /apps/stapubox-replit-app

# Make sure you're in the correct directory
cd /apps/stapubox-replit-app
```

### Step 3: Start the application
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## Part 6: Configure Nginx

### Step 1: Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/stapubox
```

### Step 2: Add this configuration
```nginx
server {
    listen 80;
    server_name stapubox.com www.stapubox.com;

    # Java service on port 2025 (existing)
    location / {
        proxy_pass http://localhost:2025;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # StapuBox app on port 3000 (new)
    location /app {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files for the app
    location /app/static {
        alias /var/www/stapubox/dist/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 3: Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/stapubox /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Part 7: Final Testing

### Step 1: Check if everything is running
```bash
# Check PM2 status
pm2 status

# Check if app is responding
curl http://localhost:3000

# Check Nginx status
sudo systemctl status nginx
```

### Step 2: Test your website
- Go to http://stapubox.com (should show your Java service)
- Go to http://stapubox.com/app (should show your StapuBox app)

## Part 8: Easy Updates (Future Deployments)

### Method 1: Git Pull (Recommended)
```bash
cd /var/www/stapubox
git pull origin main
npm install
npm run build
pm2 restart stapubox
```

### Method 2: Rsync
```bash
# From your local machine:
rsync -avz --exclude 'node_modules' --exclude '.git' ./ username@your-server-ip:/var/www/stapubox/

# Then on server:
cd /var/www/stapubox
npm install
npm run build
pm2 restart stapubox
```

## Troubleshooting

### If the app won't start:
```bash
# Check PM2 logs
pm2 logs stapubox

# Check if port 3000 is available
sudo netstat -tulpn | grep :3000

# Restart everything
pm2 restart stapubox
```

### If database connection fails:
```bash
# Test PostgreSQL connection
PGPASSWORD=npg_dwAQM3ULCKs5 psql -h localhost -U stapubox_user -d stapubox_db

# Check if database exists
sudo -u postgres psql -l
```

### If you get "permission denied for schema public" error:
```bash
# Fix PostgreSQL permissions
sudo -u postgres psql -d stapubox_db

# In PostgreSQL prompt:
GRANT ALL ON SCHEMA public TO stapubox_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stapubox_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stapubox_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO stapubox_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO stapubox_user;
\q

# Then retry the database setup
npm run db:push
```

### If PM2 gives "module is not defined" error:
```bash
# Fix file permissions (root ownership issue)
sudo chown -R $USER:$USER /apps/stapubox-replit-app
sudo chown -R $USER:$USER /var/www/stapubox

# Create ecosystem.config.cjs with correct CommonJS format
cd /apps/stapubox-replit-app
cat > ecosystem.config.cjs << 'EOF'
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
    }
  }]
};
EOF

# Now start PM2
pm2 start ecosystem.config.cjs
```

### If Nginx gives errors:
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## Security Notes

1. **Change default passwords**: Make sure to use strong passwords for MySQL
2. **Firewall**: Consider setting up ufw firewall
3. **SSL Certificate**: Add Let's Encrypt SSL certificate later
4. **Regular Updates**: Keep your system updated with `sudo apt update && sudo apt upgrade`

## Quick Reference Commands

```bash
# Start/Stop/Restart the app
pm2 start stapubox
pm2 stop stapubox
pm2 restart stapubox

# View logs
pm2 logs stapubox

# Update code and restart
cd /var/www/stapubox && git pull && npm install && npm run build && pm2 restart stapubox

# Restart Nginx
sudo systemctl restart nginx
```

Your StapuBox app will be available at: **http://stapubox.com/app**

---

## 🔑 Required API Keys for Production

**IMPORTANT**: Before deploying, you need to obtain these API keys and update your `.env` file:

### 1. TwoFactor API Key (SMS OTP) ✅ CONFIGURED
- Current key: `8e3fbee1-37bf-11f0-8b17-0200cd936042`
- SMS OTP functionality is working

### 2. Google Maps API Key ✅ CONFIGURED  
- Current key: `AIzaSyDgvWsa_ZEAtV2WIJfz9h845RUrwgfoXpA`
- Location services are working

### 3. Brevo API Key (Email notifications) ⚠️ NEEDS UPDATE
- Sign up at: https://www.brevo.com/
- Replace: `BREVO_API_KEY=your_brevo_api_key`

### 4. AWS S3 Credentials (Profile picture uploads) ⚠️ NEEDS UPDATE
- Bucket configured: `stapubox-replit-data` (eu-north-1)
- Replace AWS access credentials with your actual values

### 5. Session Secret (Security) ⚠️ NEEDS UPDATE
- Generate: `openssl rand -base64 32`
- Replace: `SESSION_SECRET=your_very_long_random_secret_string_here`

**Status Summary:**
- ✅ SMS OTP working (TwoFactor API configured)
- ✅ Location services working (Google Maps API configured)  
- ✅ Database ready (PostgreSQL configured)
- ⚠️ Email notifications need Brevo API key
- ⚠️ Profile uploads need AWS S3 credentials
- ⚠️ Session security needs random secret generation