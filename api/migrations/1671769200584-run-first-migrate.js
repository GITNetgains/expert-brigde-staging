'use strict';
module.exports.up = function (next) {
  console.log('Run the first migrate success!');
  next();
};

module.exports.down = function (next) {
  next();
};
