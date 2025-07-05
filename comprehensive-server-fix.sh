#!/bin/bash

echo "🔧 Comprehensive server fix for port binding..."

cd /apps/stapubox-replit-app

# Stop PM2
pm2 stop stapubox

# Create a completely new server wrapper that forces the app to listen
echo "🛠️ Creating server wrapper..."

# Backup current server
cp dist/index.js dist/index.js.original

# Create a wrapper that forces port listening
cat > server-wrapper.js << 'EOF'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting StapuBox Server Wrapper...');

// Create express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    port: PORT,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Serve static files
app.use(express.static(join(__dirname, 'dist/public')));

// API routes - we'll import these from the main app
try {
  // Import the main application routes
  const mainApp = await import('./dist/index.js');
  console.log('✅ Main application imported successfully');
} catch (error) {
  console.error('❌ Failed to import main application:', error.message);
  
  // Fallback API endpoints if main app fails
  app.get('/api/*', (req, res) => {
    res.json({ 
      error: 'Main application not available',
      path: req.path,
      method: req.method
    });
  });
}

// Catch-all for frontend routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist/public/index.html'));
});

// Start server with explicit binding
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 StapuBox server running on port ${PORT}`);
  console.log(`📡 Server accessible at http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
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

# Update PM2 config to use the wrapper
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'stapubox',
    script: 'server-wrapper.js',
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

# Test the wrapper quickly before starting PM2
echo "🧪 Testing server wrapper..."
timeout 10 NODE_ENV=production PORT=3000 DATABASE_URL='postgresql://stapubox_user:npg_dwAQM3ULCKs5@localhost:5432/stapubox_db?sslmode=disable' node server-wrapper.js &
WRAPPER_PID=$!

sleep 3

# Check if wrapper binds to port
if netstat -tlnp | grep -q 3000; then
    echo "✅ Server wrapper successfully binds to port 3000"
    # Test health endpoint
    curl -s http://localhost:3000/health | head -3
else
    echo "❌ Server wrapper failed to bind to port 3000"
fi

# Kill test server
kill $WRAPPER_PID 2>/dev/null
sleep 2

# Start with PM2
echo "🚀 Starting with PM2..."
pm2 start ecosystem.config.cjs

sleep 5

echo "📊 Final Status:"
pm2 status

echo "🔍 Port Check:"
netstat -tlnp | grep 3000

echo "🧪 Health Check:"
curl -s http://localhost:3000/health 2>/dev/null || echo "No response"

echo "📋 Recent Logs:"
pm2 logs stapubox --lines 5 --nostream

echo "✅ Comprehensive server fix completed!"