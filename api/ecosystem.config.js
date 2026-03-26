module.exports = {
  apps: [{
    name: "eb-api",
    script: "server/www.js",
    cwd: "/home/ubuntu/expertbridge/api",
    node_args: "--max-old-space-size=1536",
    max_memory_restart: "1400M",
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    watch: false,
    time: true,
    env: {
      NODE_ENV: "production"
    }
  }]
};
