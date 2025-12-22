const args = process.argv.slice(2);
const path = require('path');
const fs = require('fs');

require('dotenv').config();

require('./app');

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
