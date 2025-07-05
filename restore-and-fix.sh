#!/bin/bash

echo "Restoring working server and fixing frontend display..."

cd /apps/stapubox-replit-app

# Restore the working server from backup
if [ -f "dist/index.js.original" ]; then
    echo "Restoring original working server..."
    cp dist/index.js.original dist/index.js
else
    echo "No backup found, rebuilding..."
    npm run build
fi

# Apply only the working port fix (the one that worked before)
cat > restore-port-fix.js << 'EOF'
import fs from 'fs';

let serverCode = fs.readFileSync('dist/index.js', 'utf8');
const lines = serverCode.split('\n');

// Find the httpServer creation and add our working port binding
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const httpServer = createServer(app2)') || 
      lines[i].includes('httpServer = createServer(app2)')) {
    
    const portBinding = `
// DEPLOYMENT FIX: Force port binding
const __server = httpServer.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(\`🚀 StapuBox server running on port \${process.env.PORT || 3000}\`);
  console.log(\`📡 Server accessible at http://localhost:\${process.env.PORT || 3000}\`);
});

__server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(\`Port \${process.env.PORT || 3000} is already in use\`);
  }
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  __server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
`;
    
    lines.splice(i + 1, 0, portBinding);
    break;
  }
}

// Comment out the conflicting server.listen call
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('server.listen({') && 
      lines[i + 1] && lines[i + 1].includes('port') &&
      lines[i + 2] && lines[i + 2].includes('host: "0.0.0.0"')) {
    
    // Comment out this block
    let j = i;
    while (j < lines.length && !lines[j].includes('});')) {
      lines[j] = '  // DISABLED: ' + lines[j];
      j++;
    }
    if (j < lines.length) {
      lines[j] = '  // DISABLED: ' + lines[j];
    }
    break;
  }
}

fs.writeFileSync('dist/index.js', lines.join('\n'));
console.log('✅ Working server configuration restored');
EOF

node restore-port-fix.js
rm -f restore-port-fix.js

# Start the server
echo "Starting restored server..."
pm2 start ecosystem.config.cjs

sleep 5

echo "Checking server status..."
pm2 status

echo "Testing port 3000..."
netstat -tlnp | grep 3000

echo "Testing connection..."
curl -I http://localhost:3000 2>/dev/null | head -1 || echo "No response"

echo "Server restoration completed."