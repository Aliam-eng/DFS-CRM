module.exports = {
  apps: [
    {
      name: 'dfs-crm',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/dfs-crm',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/www/dfs-crm/logs/error.log',
      out_file: '/var/www/dfs-crm/logs/output.log',
      merge_logs: true,
      // Restart policy
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
