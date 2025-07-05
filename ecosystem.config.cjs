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
