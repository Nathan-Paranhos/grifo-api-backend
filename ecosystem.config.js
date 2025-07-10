module.exports = {
  apps: [{
    name: "grifo-api",
    script: "./dist/index.js",
    instances: "max",
    exec_mode: "cluster",
    env_production: {
      NODE_ENV: "production"
    },
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    combine_logs: true,
    max_memory_restart: "1G",
    watch: false,
    autorestart: true,
    error_file: "logs/pm2-error.log",
    out_file: "logs/pm2-out.log"
  }]
}