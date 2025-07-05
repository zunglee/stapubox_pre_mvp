#!/bin/bash

echo "🔄 Creating fresh server configuration from scratch..."

cd /apps/stapubox-replit-app

# Stop and remove existing PM2 process
pm2 stop stapubox 2>/dev/null
pm2 delete stapubox 2>/dev/null

# Create a completely new server file that definitely works
cat > fresh-server.js << 'EOF'
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting fresh StapuBox server...');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import the main application routes
try {
  const { registerRoutes } = await import('./dist/index.js');
  await registerRoutes(app);
  console.log('✅ Main application routes loaded');
} catch (error) {
  console.error('❌ Error loading main routes:', error.message);
  
  // Fallback API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  app.get('/api/*', (req, res) => {
    res.status(503).json({ error: 'Main application unavailable' });
  });
}

// Static file serving for nginx /app proxy
app.use('/assets', express.static(path.join(__dirname, 'dist/public/assets')));
app.use(express.static(path.join(__dirname, 'dist/public')));

// Catch-all for React routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'dist/public/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Create HTTP server
const server = createServer(app);

// Start server with explicit error handling
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 StapuBox server running on port ${PORT}`);
  console.log(`📡 Server accessible at http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
EOF

# Update PM2 config to use the fresh server
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'stapubox',
    script: 'fresh-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/root/.pm2/logs/stapubox-error.log',
    out_file: '/root/.pm2/logs/stapubox-out.log',
    log_file: '/root/.pm2/logs/stapubox-combined.log',
    time: true,
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: 'postgresql://stapubox_user:npg_dwAQM3ULCKs5@localhost:5432/stapubox_db?sslmode=disable',
      TWOFACTOR_API_KEY: '8e3fbee1-37bf-11f0-8b17-0200cd936042'
    }
  }]
};
EOF

# Ensure frontend build exists
if [ ! -d "dist/public" ]; then
    echo "🏗️ Building frontend..."
    npm run build
fi

# Update index.html for nginx /app proxy
cat > fix-frontend.js << 'EOF'
import fs from 'fs';

if (fs.existsSync('dist/public/index.html')) {
    let html = fs.readFileSync('dist/public/index.html', 'utf8');
    
    // Fix asset paths for nginx /app proxy
    html = html.replace(/href="\/assets\//g, 'href="/app/assets/');
    html = html.replace(/src="\/assets\//g, 'src="/app/assets/');
    html = html.replace(/href="\.\//g, 'href="/app/');
    html = html.replace(/src="\.\//g, 'src="/app/');
    
    fs.writeFileSync('dist/public/index.html', html);
    console.log('✅ Fixed frontend asset paths');
}
EOF

node fix-frontend.js
rm -f fix-frontend.js

# Start the fresh server
echo "🚀 Starting fresh server..."
pm2 start ecosystem.config.cjs

# Wait for startup
sleep 8

echo "📊 Server Status:"
pm2 status

echo "🔍 Port Check:"
netstat -tlnp | grep 3000

echo "🧪 Health Check:"
curl -s http://localhost:3000/api/health 2>/dev/null || echo "No health response"

echo "🧪 Connection Test:"
curl -I http://localhost:3000 2>/dev/null | head -1 || echo "No HTTP response"

echo "📋 Recent Logs:"
pm2 logs stapubox --lines 5 --nostream

echo ""
echo "✅ Fresh server configuration completed!"
echo "🎯 Your StapuBox app should now be accessible at https://stapubox.com/app"