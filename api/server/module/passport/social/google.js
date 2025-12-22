const { OAuth2Client } = require('google-auth-library');
const Joi = require('joi');
const signToken = require('../auth.service').signToken;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const oauthClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

exports.login = async (req, res, next) => {
  try {
    // Accept code from query OR body (frontend uses GET or POST)
    const code = req.query.code || req.body.code;
    if (!code) {
      return next(PopulateResponse.validationError({ message: 'Missing Google OAuth code' }));
    }

    // 1️⃣ Exchange code for Google tokens
    const { tokens } = await oauthClient.getToken(code);
    if (!tokens.id_token) {
      return next(PopulateResponse.error('GOOGLE_LOGIN_FAILED'));
    }

    // 2️⃣ Verify the ID token & extract profile
    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || `${payload.given_name} ${payload.family_name}`;
    const googleId = payload.sub;

    // 3️⃣ Find existing user by email
    let user = await DB.User.findOne({ email });

    // 4️⃣ Create a FULL user if not found
    if (!user) {
      user = new DB.User({
        email,
        name,
        provider: 'google',
        role: 'user',
        type: 'tutor',              // default user type
        timezone: 'Asia/Kolkata',      // you wanted static timezone
        isActive: true,                // allow login
        emailVerified: true            // because Google verified
      });

      await user.save();
    }

    // 5️⃣ Save social login info
    let social = await DB.UserSocial.findOne({
      userId: user._id,
      socialId: googleId,
      social: 'google'
    });

    if (!social) {
      social = new DB.UserSocial({
        userId: user._id,
        social: 'google',
        socialId: googleId
      });
    }

    social.accessToken = tokens.access_token;
    social.socialInfo = payload;
    await social.save();

    // 6️⃣ Generate our JWT auth token
    const expireTokenDuration = 60 * 60 * 24 * 7; // 7 days
    const now = new Date();
    const expiredAt = new Date(now.getTime() + expireTokenDuration * 1000);

    const token = signToken(user._id, user.role, expireTokenDuration);

    // Final response
    res.locals.login = { token, expiredAt };
    return next();

  } catch (error) {
    console.error('GOOGLE LOGIN ERROR:', error);
    return next(error);
  }
};
