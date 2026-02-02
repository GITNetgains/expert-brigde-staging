const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = async (req, res, next) => {
  try {
    const token = req.body.captchaToken;

    if (!token) {
      return next(
        PopulateResponse.error(
          { message: 'Captcha token missing' },
          'ERR_CAPTCHA_MISSING'
        )
      );
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;

    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secret}&response=${token}`
      }
    );

    const data = await response.json();

    if (!data.success) {
      return next(
        PopulateResponse.error(
          { message: 'Captcha verification failed' },
          'ERR_CAPTCHA_FAILED'
        )
      );
    }

    // ✅ score check
    if (typeof data.score === 'number' && data.score < 0.5) {
      return next(
        PopulateResponse.error(
          { message: 'Captcha score too low' },
          'ERR_CAPTCHA_SCORE'
        )
      );
    }

    // ✅ ALLOW MULTIPLE ACTIONS
    const allowedActions = [
      'ai_verify_otp',
      'ai_query_submit'
    ];

    if (data.action && !allowedActions.includes(data.action)) {
      return next(
        PopulateResponse.error(
          { message: 'Invalid captcha action' },
          'ERR_CAPTCHA_ACTION'
        )
      );
    }

    // optional logging
    req.captcha = {
      score: data.score,
      action: data.action
    };

    next(); // ✅ CAPTCHA PASSED
  } catch (err) {
    console.error('Captcha error:', err);
    return next(
      PopulateResponse.error(
        { message: 'Captcha verification error' },
        'ERR_CAPTCHA_EXCEPTION'
      )
    );
  }
};
