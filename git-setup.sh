#!/bin/bash

# StapuBox Git Repository Setup Script
# Run this script to initialize and push your code to a Git repository

echo "🚀 StapuBox Git Repository Setup"
echo "================================"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Initialize git repository if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
else
    echo "✅ Git repository already initialized"
fi

# Create .gitignore file
echo "📄 Creating .gitignore file..."
cat > .gitignore << EOL
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
*.tsbuildinfo

# Runtime files
*.log
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Dependency directories
.pnp
.pnp.js

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp

# Database files
*.sqlite
*.db

# Backup files
*.backup
*.bak

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Test files
test-results/
coverage/

# Replit specific
.replit
.upm
replit.nix

# Additional project specific
cookies.txt
storage-data.json
postgresql-export.json
*.sql
debug*.js
test-*.js
capture-*.js
investigate-*.js
migrate-*.js
import-*.js
export-*.js
switch-*.js
mysql-*.js
pg-to-mysql-*.js
comprehensive-*.js
EOL

# Add all files to git
echo "📁 Adding files to git..."
git add .

# Get user input for repository URL
echo ""
echo "Please provide your Git repository details:"
read -p "Enter your Git repository URL (e.g., https://github.com/username/stapubox.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Repository URL is required"
    exit 1
fi

# Add remote origin
echo "🔗 Adding remote origin..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

# Commit the code
echo "💾 Creating initial commit..."
git commit -m "Initial StapuBox deployment

✨ Features:
- Sports networking platform with player/coach profiles
- Location-based user discovery with Google Maps integration
- 4-bucket interest management system (pending, sent, received, accepted)
- Real-time news feed with StapuBuzz API integration
- Profile picture upload with AWS S3 storage
- OTP authentication with TwoFactor API
- Admin authentication system with /admin/login?userid=X
- PostgreSQL database with comprehensive schema
- Responsive UI with Tailwind CSS and Shadcn components

🛠️ Tech Stack:
- Frontend: React 18, TypeScript, Vite, TanStack Query
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Drizzle ORM
- Authentication: Session-based with OTP verification
- External APIs: TwoFactor, Google Maps, StapuBuzz, AWS S3
- Deployment: PM2, Nginx, Ubuntu VPS ready

📚 Documentation:
- VPS_DEPLOYMENT_GUIDE.md: Complete production deployment
- QUICK_DEPLOY.md: Fast 15-minute setup guide
- replit.md: Project architecture and changelog

🔧 Environment Variables Required:
- DATABASE_URL, TWOFACTOR_API_KEY, GOOGLE_MAPS_API_KEY
- BREVO_API_KEY, AWS credentials, SESSION_SECRET"

# Push to repository
echo "🚀 Pushing to repository..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Successfully pushed StapuBox to Git repository!"
echo "🌐 Repository URL: $REPO_URL"
echo ""
echo "📋 Next steps for deployment:"
echo "1. Clone the repository on your VPS"
echo "2. Follow VPS_DEPLOYMENT_GUIDE.md for complete setup"
echo "3. Or use QUICK_DEPLOY.md for fast deployment"
echo ""
echo "🔑 Admin login URL format:"
echo "   https://your-domain.com/admin/login?userid=12"
EOL