module.exports = {
  apps: [
    {
      name: "project-m",
      cwd: "/var/www/project-m",
      script: "./.next/standalone/server.js",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      log_file: "/var/log/pm2/project-m/combined.log",
      out_file: "/var/log/pm2/project-m/out.log",
      error_file: "/var/log/pm2/project-m/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      restart_delay: 3000,
      min_uptime: "10s",
      listen_timeout: 8000,
      kill_timeout: 5000,
    },
  ],
};
