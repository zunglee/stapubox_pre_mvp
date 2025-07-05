#!/bin/bash

echo "🔧 Simple fix for nginx deployment..."

# Check if we have a build directory
if [ ! -d "dist" ]; then
    echo "Building frontend..."
    npm run build
fi

# Create a simple production server that definitely works on port 3000
cat > production-server.js << 'EOF'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

console.log('🚀 Starting StapuBox production server...');

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Try to load main application routes
try {
  console.log('🔧 Loading main application...');
  const { registerRoutes } = await import('./dist/index.js');
  await registerRoutes(app);
  console.log('✅ Main application routes loaded successfully');
} catch (error) {
  console.error('⚠️ Main application failed to load:', error.message);
  
  // Fallback API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'degraded', 
      message: 'Main app unavailable',
      timestamp: new Date().toISOString() 
    });
  });
  
  app.post('/api/auth/send-otp', (req, res) => {
    res.status(503).json({ message: 'Authentication service temporarily unavailable' });
  });
  
  app.get('/api/*', (req, res) => {
    res.status(503).json({ 
      error: 'Service temporarily unavailable',
      path: req.path 
    });
  });
}

// Static file serving for nginx /app proxy
app.use('/assets', express.static(path.join(__dirname, 'dist/public/assets')));
app.use(express.static(path.join(__dirname, 'dist/public')));

// Catch-all for React routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found', path: req.path });
  } else {
    const indexPath = path.join(__dirname, 'dist/public/index.html');
    res.sendFile(indexPath);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎯 StapuBox server running on port ${PORT}`);
  console.log(`📡 Server bound to 0.0.0.0:${PORT}`);
  console.log(`🌐 Ready for nginx proxy`);
});
EOF

# Stop any existing node processes on port 3000
pkill -f "node.*3000" 2>/dev/null || true
sleep 2

# Start the production server in the background
echo "🚀 Starting production server on port 3000..."
nohup node production-server.js > server.log 2>&1 &

# Wait for startup
sleep 5

# Test the server
echo "🧪 Testing server..."
curl -v http://localhost:3000/api/health 2>/dev/null || echo "Health check failed"

echo ""
echo "✅ Simple nginx fix completed!"
echo "📋 Server log:"
tail -10 server.log

echo ""
echo "🎯 Now test your API:"
echo "curl -X POST -H 'Content-Type: application/json' -d '{\"phoneNumber\":\"9876543210\"}' https://stapubox.com/app/api/auth/send-otp"