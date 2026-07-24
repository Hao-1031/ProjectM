const path = require("path");

// 自动根据当前平台选择项目目录与日志目录
// Windows 本地预览使用 C:\www\project-m
// Linux / Ubuntu 生产环境使用 /var/www/project-m
const cwd = process.platform === "win32" ? "C:\\www\\project-m" : "/var/www/project-m";
const logDir = path.join(cwd, "logs");

module.exports = {
  apps: [
    {
      name: "project-m",
      cwd,
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
      log_file: path.join(logDir, "combined.log"),
      out_file: path.join(logDir, "out.log"),
      error_file: path.join(logDir, "error.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      restart_delay: 3000,
      min_uptime: "10s",
      listen_timeout: 8000,
      kill_timeout: 5000,
      node_args: "--max-old-space-size=1536 --optimize-for-size",
    },
  ],
};
