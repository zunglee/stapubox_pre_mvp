#!/bin/bash

# StapuBox Rsync Deployment Script
# Use this to deploy from your local machine/Replit to your Ubuntu server

# Configuration - CHANGE THESE VALUES
SERVER_USER="your-username"          # Replace with your server username (e.g., root, ubuntu)
SERVER_IP="your-server-ip"           # Replace with your server IP address
SERVER_PATH="/var/www/stapubox"      # Path on server where app will be deployed
PM2_APP_NAME="stapubox"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if configuration is set
if [ "$SERVER_USER" = "your-username" ] || [ "$SERVER_IP" = "your-server-ip" ]; then
    print_error "Please edit this script and set your SERVER_USER and SERVER_IP"
    exit 1
fi

# Check if we're in a project directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run from project root."
    exit 1
fi

print_status "Starting deployment to $SERVER_USER@$SERVER_IP..."

# Sync files to server (excluding node_modules and .git)
print_status "Syncing files to server..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude 'dist' \
    ./ $SERVER_USER@$SERVER_IP:$SERVER_PATH/

# Run deployment commands on server
print_status "Running deployment commands on server..."
ssh $SERVER_USER@$SERVER_IP << EOF
    cd $SERVER_PATH
    echo "Installing dependencies..."
    npm install
    echo "Building project..."
    npm run build
    echo "Updating database..."
    npm run db:push || echo "Database update failed or not needed"
    echo "Restarting application..."
    pm2 restart $PM2_APP_NAME || pm2 start ecosystem.config.js
    pm2 save
    echo "Deployment completed!"
    pm2 status $PM2_APP_NAME
EOF

print_status "✅ Deployment completed successfully!"
print_status "Your app should be available at: http://stapubox.com/app"