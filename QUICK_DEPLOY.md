# StapuBox Quick Deployment Script

Fast deployment script for Ubuntu VPS - run these commands in sequence.

## One-Command Installation Script

Save this as `install-stapubox.sh` and run with `bash install-stapubox.sh`:

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting StapuBox VPS Deployment${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common build-essential

# Install Node.js 20
echo -e "${YELLOW}📦 Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 16
echo -e "${YELLOW}🗄️ Installing PostgreSQL 16...${NC}"
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16 postgresql-client-16 postgresql-contrib-16

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install PM2 and Nginx
echo -e "${YELLOW}🔧 Installing PM2 and Nginx...${NC}"
sudo npm install -g pm2 tsx typescript
sudo apt install -y nginx

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Create application directory
echo -e "${YELLOW}📁 Setting up application directory...${NC}"
sudo mkdir -p /var/www/stapubox
sudo chown $USER:$USER /var/www/stapubox

echo -e "${GREEN}✅ Base installation complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Clone your project: cd /var/www/stapubox && git clone YOUR_REPO_URL ."
echo "2. Setup database: sudo -u postgres createdb stapubox_db"
echo "3. Create .env file with your configuration"
echo "4. Run: npm install && npm run build"
echo "5. Configure PM2 and Nginx (see full guide)"
```

## Essential Commands Quick Reference

### 1. System Setup (5 minutes)
```bash
# Update and install basics
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql-16 nginx build-essential git

# Start services
sudo systemctl start postgresql nginx
sudo systemctl enable postgresql nginx
sudo npm install -g pm2 tsx
```

### 2. Database Setup (2 minutes)
```bash
# Create database
sudo -u postgres createdb stapubox_db
sudo -u postgres createuser stapubox_user
sudo -u postgres psql -c "ALTER USER stapubox_user WITH ENCRYPTED PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE stapubox_db TO stapubox_user;"
```

### 3. Project Setup (3 minutes)
```bash
# Clone project
mkdir -p /var/www/stapubox
cd /var/www/stapubox
git clone YOUR_REPOSITORY_URL .

# Install dependencies
npm install

# Create .env file
cat > .env << EOL
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://stapubox_user:secure_password@localhost:5432/stapubox_db
TWOFACTOR_API_KEY=your_api_key
GOOGLE_MAPS_API_KEY=your_api_key
SESSION_SECRET=$(openssl rand -base64 32)
EOL

# Build application
npm run build
npm run db:push
```

### 4. Production Deployment (3 minutes)
```bash
# PM2 Configuration
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'stapubox',
    script: 'npm',
    args: 'run start',
    instances: 1,
    autorestart: true,
    watch: false,
    env: { NODE_ENV: 'production', PORT: 5000 }
  }]
};
EOL

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Nginx Configuration
sudo tee /etc/nginx/sites-available/stapubox << EOL
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

sudo ln -s /etc/nginx/sites-available/stapubox /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

### 5. Verification (1 minute)
```bash
# Check all services
sudo systemctl status postgresql nginx
pm2 status
curl -I http://localhost
```

## Environment Variables Required

Create `.env` file with these variables:

```bash
# Production Settings
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://stapubox_user:your_password@localhost:5432/stapubox_db

# API Keys
TWOFACTOR_API_KEY=your_twofactor_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
BREVO_API_KEY=your_brevo_api_key

# AWS S3 (for profile pictures)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-north-1
AWS_S3_BUCKET=your-bucket-name

# Security
SESSION_SECRET=$(openssl rand -base64 32)
```

## Minimal Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    client_max_body_size 10M;
}
```

## Quick Troubleshooting

```bash
# Application logs
pm2 logs stapubox

# Restart application
pm2 restart stapubox

# Check database
sudo -u postgres psql -d stapubox_db -c "SELECT version();"

# Test website
curl -I http://localhost
curl -I http://your-domain.com

# Check ports
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :80
```

## Update Deployment

```bash
cd /var/www/stapubox
git pull origin main
npm install
npm run build
pm2 restart stapubox
```

## SSL Certificate (Optional)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Total deployment time: ~15 minutes on a fresh Ubuntu VPS**

For detailed configuration, security hardening, and production optimizations, refer to the complete `VPS_DEPLOYMENT_GUIDE.md`.