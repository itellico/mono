module.exports = {
  apps: [
    {
      name: 'docusaurus',
      script: 'pnpm',
      args: 'run start',
      cwd: '/Users/mm2/dev_mm/mono/docs-site',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'development',
        PORT: 3005
      },
      error_file: './logs/docusaurus-error.log',
      out_file: './logs/docusaurus-out.log',
      log_file: './logs/docusaurus-combined.log',
      time: true
    }
  ]
};