const passport = require('passport');

const signToken = require('../auth.service').signToken;

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    const error = err || info;
    if (error) {
      return next(error);
    }
    if (!user) {
      return next(PopulateResponse.notFound());
    }

      if (!user.password) {
      return next(
        PopulateResponse.error(
          {
            message:
              'You do not have a password yet. Please log in using OTP and set a password from Profile Settings.'
          },
          'ERR_PASSWORD_NOT_SET'
        )
      );
    }
    const expireTokenDuration = req.body.rememberMe? 60 * 60 * 24 * 365 : 60 * 60 * 24 * 1; //
    const now = new Date();
    const expiredAt = new Date(now.getTime() + (expireTokenDuration * 1000));
    const token = signToken(user._id, user.role, expireTokenDuration);

    res.locals.login = {
      token,
      expiredAt
    };

    return next();
  })(req, res, next);
};
