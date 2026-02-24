const path = require('path');
// Load .env from api folder so SENDGRID_API_KEY etc. are set regardless of current working directory
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const express = require('express');
const appPromise = require('./app');

appPromise.then((app) => {
  app.app.use('/docs', express.static(path.join(__dirname, '..', 'apidocs')));
  app.startHttpServer();
}).catch((err) => {
  console.error('Failed to bootstrap API:', err);
  process.exit(1);
});
