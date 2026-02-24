const args = process.argv.slice(2);
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const appPromise = require('./app');

appPromise.then(() => {
  if (args.length && args[0]) {
    setTimeout(async () => {
      await require(path.join(__dirname, 'scripts', args[0]))();

      console.log('Script done');
      process.exit();
    });
  } else {
    setTimeout(async () => {
      console.log('update-zoom-config');
      await require(path.join(__dirname, 'scripts', 'update-zoom-config.js'))();

      process.exit();
    });
  }
}).catch((err) => {
  console.error('Failed to bootstrap API:', err);
  process.exit(1);
});
