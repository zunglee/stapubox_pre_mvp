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
