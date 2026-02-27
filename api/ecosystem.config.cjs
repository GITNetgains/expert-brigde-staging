/**
 * PM2 ecosystem file for eb-api.
 * Uses Node 18 explicitly so dependencies (e.g. openai) that require ??= and other ES2021+ syntax work.
 *
 * On the server: if you use nvm, run "nvm use 18" before "pm2 start ecosystem.config.cjs".
 * If Node 18 is installed elsewhere, set interpreter to that node path (e.g. which node after nvm use 18).
 */
const path = require('path');
const node18 =
  process.env.NVM_DIR
    ? `${process.env.NVM_DIR}/versions/node/v18.20.8/bin/node`
    : process.env.HOME
      ? `${process.env.HOME}/.nvm/versions/node/v18.20.8/bin/node`
      : null;

module.exports = {
  apps: [
    {
      name: 'eb-api',
      script: './server/www.js',
      cwd: path.resolve(__dirname),
      interpreter: node18,
      env: { NODE_ENV: 'production' },
    },
  ],
};
