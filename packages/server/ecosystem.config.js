module.exports = {
  apps: [
    {
      // Cluster mode + Socket.io requires sticky sessions at the load balancer
      // (see nginx/nginx.conf `ip_hash`) since the polling handshake must land
      // on the same worker before it upgrades to a websocket.
      name: "nexuschat-api",
      script: "dist/server.js",
      instances: process.env.PM2_INSTANCES || 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "400M",
      autorestart: true,
      watch: false,
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
