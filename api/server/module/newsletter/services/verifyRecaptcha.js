const axios = require('axios');

exports.verifyRecaptcha = async (token, ip) => {
  const response = await axios.post(
    'https://www.google.com/recaptcha/api/siteverify',
    null,
    {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
        remoteip: ip
      }
    }
  );
  return response.data;
};
