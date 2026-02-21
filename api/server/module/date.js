const moment = require('moment');
const momentTimeZone = require('moment-timezone');

exports.formatDate = (date, format = 'DD/MM/YYYY HH:mm', timezone = '') => {
  // Default to Asia/Kolkata if no timezone provided
  const tz = timezone || 'Asia/Kolkata';
  let result = momentTimeZone(date).tz(tz).format(format);
  return result;
};

exports.isDTS = (date, timezone = '') => {
  const isDTS = timezone ? momentTimeZone.tz(date, timezone).isDST() : moment(date).isDST();
  return isDTS;
};

exports.formatToDTS = (date, timezone = '') => {
  let result = timezone ? momentTimeZone(date).add(1, 'hour').tz(timezone) : moment(date).add(1, 'hour');

  return result;
};
exports.formatFromDTS = (date, timezone = '') => {
  let result = timezone ? momentTimeZone(date).subtract(1, 'hour').tz(timezone) : moment(date).subtract(1, 'hour');

  return result;
};
