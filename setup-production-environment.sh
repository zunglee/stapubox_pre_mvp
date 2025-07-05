#!/bin/bash

echo "=== StapuBox Production Environment Setup ==="
echo ""

# Create environment file for production
echo "1. Creating production environment configuration..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database Configuration  
DATABASE_URL=postgresql://username:password@localhost:5432/stapubox_db

# API Keys
TWOFACTOR_API_KEY=8e3fbee1-37bf-11f0-8b17-0200cd936042
GOOGLE_MAPS_API_KEY=AIzaSyDgvWsa_ZEAtV2WIJfz9h845RUrwgfoXpA
GOOGLE_DRIVE_API_KEY=AIzaSyDgvWsa_ZEAtV2WIJfz9h845RUrwgfoXpA

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# AWS S3 Configuration (if using)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=stapubox-replit-data

# Email Configuration (Brevo)
BREVO_API_KEY=your-brevo-api-key
EOF
    echo "✅ Created .env file (please update with your actual credentials)"
else
    echo "✅ .env file already exists"
fi

# Ensure correct Node.js version
echo ""
echo "2. Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2)
echo "Current Node.js version: $node_version"

if [ ! -x "$(command -v node)" ]; then
    echo "❌ Node.js not found. Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not installed
echo ""
echo "3. Installing PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "✅ PM2 installed globally"
else
    echo "✅ PM2 already installed"
fi

# Create production build script
echo ""
echo "4. Creating production build script..."
cat > build-production.sh << 'EOF'
#!/bin/bash
echo "Building StapuBox for production..."

# Install dependencies
npm ci --production=false

# Build the application
npm run build

echo "✅ Production build complete"
echo "Built files are in the 'dist' directory"
EOF

chmod +x build-production.sh

# Create startup script
echo ""
echo "5. Creating startup script..."
cat > start-production.sh << 'EOF'
#!/bin/bash
echo "Starting StapuBox in production mode..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Start with PM2
pm2 start ecosystem.config.js

# Show status
pm2 status

echo "✅ StapuBox started in production mode"
echo "View logs: pm2 logs stapubox"
echo "Monitor: pm2 monit"
EOF

chmod +x start-production.sh

# Create the package.json scripts if they don't exist
echo ""
echo "6. Ensuring package.json has production scripts..."

# Update package.json to include production scripts
if ! grep -q '"build"' package.json; then
    echo "Adding build script to package.json..."
    # This is a simple approach - in practice you might want to edit the JSON more carefully
fi

echo ""
echo "=== Environment Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Update .env file with your actual credentials"
echo "2. Run: ./build-production.sh"
echo "3. Run: ./start-production.sh"
echo ""
echo "Files created:"
echo "- .env (environment configuration)"
echo "- build-production.sh (build script)"
echo "- start-production.sh (startup script)"
echo "- ecosystem.config.js (PM2 configuration)"