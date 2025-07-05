#!/bin/bash

# StapuBox Production Deployment Script
# This script automates the deployment process for Ubuntu servers

set -e  # Exit on any error

echo "🚀 Starting StapuBox Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then
    print_error "Don't run this script as root. Run as your regular user."
    exit 1
fi

# Step 1: Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install Node.js 20 if not installed
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | cut -d'v' -f2) -lt 18 ]]; then
    print_status "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status "Node.js already installed: $(node -v)"
fi

# Step 3: Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_status "PM2 already installed: $(pm2 -v)"
fi

# Step 4: Create application directory
APP_DIR="/var/www/stapubox"
if [ ! -d "$APP_DIR" ]; then
    print_status "Creating application directory..."
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
else
    print_status "Application directory exists"
fi

# Step 5: Navigate to app directory
cd "$APP_DIR"

# Step 6: Install dependencies
if [ -f "package.json" ]; then
    print_status "Installing dependencies..."
    npm install
else
    print_error "package.json not found. Make sure you're in the correct directory."
    exit 1
fi

# Step 7: Setup environment configuration
if [ ! -f ".env" ]; then
    print_status "Creating production environment file..."
    cp config/production.env .env
    print_warning "Please edit .env file with your actual production values:"
    echo "  - SESSION_SECRET (generate a strong random string)"
    echo "  - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    echo "  - BREVO_API_KEY (for email service)"
    read -p "Press Enter after updating .env file..."
else
    print_status "Environment file already exists"
fi

# Step 8: Create logs directory
mkdir -p logs

# Step 9: Build application
print_status "Building application..."
npm run build

# Step 10: Setup database
print_status "Setting up database schema..."
npm run db:push

# Step 11: Start application with PM2
print_status "Starting application with PM2..."
pm2 stop stapubox 2>/dev/null || true
pm2 delete stapubox 2>/dev/null || true
pm2 start ecosystem.config.production.cjs --env production

# Step 12: Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save
pm2 startup

# Step 13: Test application
print_status "Testing application..."
sleep 5
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "Application is running successfully!"
else
    print_warning "Application may not be responding. Check logs with: pm2 logs stapubox"
fi

# Step 14: Display status
print_status "Deployment completed!"
echo ""
echo "📊 Application Status:"
pm2 list

echo ""
echo "🔧 Management Commands:"
echo "  View logs: pm2 logs stapubox"
echo "  Restart app: pm2 restart stapubox"
echo "  Monitor app: pm2 monit"
echo ""
echo "🌐 Your application should be available at:"
echo "  - Local: http://localhost:3000"
echo "  - Public: https://stapubox.com (after Nginx configuration)"
echo ""
print_warning "Don't forget to configure Nginx according to PRODUCTION_DEPLOYMENT_GUIDE.md"

print_status "🎉 Deployment completed successfully!"