module.exports = {
  apps: [
    {
      name: 'itellico-cron-manager',
      script: './scripts/cron-manager.js',
      args: 'start',
      cwd: './scripts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        TZ: 'Europe/Berlin'
      },
      env_production: {
        NODE_ENV: 'production',
        TZ: 'Europe/Berlin'
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      out_file: './logs/cron-manager-out.log',
      error_file: './logs/cron-manager-error.log',
      combine_logs: true,
      merge_logs: true,
      time: true
    }
  ]
};