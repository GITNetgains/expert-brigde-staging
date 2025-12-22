const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));


exports.verifyCaptcha = async function verifyCaptcha(req, res, next) {
  try {
    const token = req.body.captchaToken;

    if (!token) {
      return res.status(400).json({ error: "Captcha token missing" });
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;

    const result = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
      { method: "POST" }
    );

    const data = await result.json();

    // data.success = true, data.score between 0 - 1
    if (!data.success || data.score < 0.5) {
      return res.status(403).json({ error: "Captcha verification failed" });
    }

    next(); // captcha passed → continue
  } catch (err) {
    console.error("Captcha error:", err);
    return res.status(500).json({ error: "Captcha verification error" });
  }
}