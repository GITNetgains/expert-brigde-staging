const erl = require("express-rate-limit");
const rateLimit = erl;
const { ipKeyGenerator } = erl;

exports.aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    // If user is logged in → slightly higher limit
    if (req.user?._id) return 20; 
    return 10; // Public / unauthenticated limit
  },
  keyGenerator: (req) => {
    if (req.user?._id) return req.user._id;
    return ipKeyGenerator(req.ip);
  },
  message: {
    error: "Too many AI search requests. Try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
