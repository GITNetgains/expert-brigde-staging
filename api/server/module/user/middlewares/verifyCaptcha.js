const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = async (req, res, next) => {
  try {
    const token = req.body.captchaToken;

    if (!token) {
      return res.status(400).json({ message: 'Captcha token missing' });
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

    if (!data.success || (data.score !== undefined && data.score < 0.5)) {
      return res.status(403).json({ message: 'Captcha verification failed' });
    }

    next(); // ✅ Passed captcha
  } catch (err) {
    console.error('Captcha error:', err);
    return res.status(500).json({ message: 'Captcha verification error' });
  }
};
