#!/bin/bash

# StapuBox Deployment Script
# This script automates the deployment process on your Ubuntu server

set -e  # Exit on any error

echo "🚀 Starting StapuBox deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/stapubox"
PM2_APP_NAME="stapubox"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Stop the application
print_status "Stopping application..."
pm2 stop $PM2_APP_NAME || print_warning "Application was not running"

# Update code (if using git)
if [ -d ".git" ]; then
    print_status "Pulling latest code from git..."
    git pull origin main
else
    print_warning "Not a git repository. Skipping git pull."
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the project
print_status "Building project..."
npm run build

# Update database schema (if needed)
print_status "Updating database schema..."
npm run db:push || print_warning "Database update failed or not needed"

# Start the application
print_status "Starting application..."
pm2 start $PM2_APP_NAME || pm2 restart $PM2_APP_NAME

# Save PM2 configuration
pm2 save

print_status "✅ Deployment completed successfully!"
print_status "Your app is running at: http://stapubox.com/app"

# Show application status
echo ""
print_status "Application status:"
pm2 status $PM2_APP_NAME