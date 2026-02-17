// linkedin.controller.js - UPDATED VERSION
const axios = require("axios");
const signToken = require("../auth.service").signToken;

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI; // Should be: http://localhost:4200/auth/linkedin/callback

/**
 * Tutor signup with LinkedIn: exchange code for profile, create SignupSession, return signupToken + profile.
 * Uses redirect_uri from request body if provided (must match frontend), else env LINKEDIN_REDIRECT_URI.
 */
exports.signup = async (req, res, next) => {
  try {
    const code = req.query.code || req.body.code;
    const redirectUri = (req.body.redirect_uri || REDIRECT_URI || '').toString().trim();
    if (!code) {
      return next(PopulateResponse.validationError({ message: 'Missing LinkedIn OAuth code' }));
    }
    if (!redirectUri) {
      return next(PopulateResponse.validationError({ message: 'Missing redirect_uri. Set LINKEDIN_REDIRECT_URI in API .env or ensure frontend sends redirect_uri.' }));
    }

    console.log('[LinkedIn signup] redirect_uri sent to LinkedIn:', redirectUri, '| from body:', !!req.body.redirect_uri);

    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET
    }).toString();

    const tokenResp = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      tokenBody,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    const accessToken = tokenResp.data.access_token;

    const profileResp = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const email = (profileResp.data.email || '').toLowerCase();
    const fullName = profileResp.data.name || [profileResp.data.given_name, profileResp.data.family_name].filter(Boolean).join(' ') || 'LinkedIn User';
    const avatarUrl = profileResp.data.picture || '';

    if (!email) {
      return next(PopulateResponse.error({ message: 'LinkedIn did not provide an email' }, 'LINKEDIN_NO_EMAIL'));
    }

    const existingUser = await DB.User.findOne({ email });
    if (existingUser) {
      return next(PopulateResponse.error(
        { message: 'This email is already registered. Please log in.' },
        'ERR_EMAIL_ALREADY_TAKEN'
      ));
    }

    const signupToken = Helper.String.randomString(32);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await DB.SignupSession.create({
      email,
      type: 'tutor',
      token: signupToken,
      expiresAt
    });

    res.locals.signup = {
      signupToken,
      email,
      name: fullName,
      avatarUrl
    };
    return next();
  } catch (error) {
    console.error('LINKEDIN SIGNUP ERROR:', error.response?.data || error.message);
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const code = req.query.code || req.body.code;
    const redirectUri = (req.body.redirect_uri || REDIRECT_URI || '').toString().trim();

    if (!code) {
      console.error("No LinkedIn code provided");
      return next(PopulateResponse.validationError({
        message: "Missing LinkedIn OAuth code"
      }));
    }
    if (!redirectUri) {
      return next(PopulateResponse.validationError({ message: "Missing redirect_uri. Set LINKEDIN_REDIRECT_URI or send redirect_uri in request." }));
    }

    console.log("[LinkedIn login] redirect_uri:", redirectUri, "| from body:", !!req.body.redirect_uri);

    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET
    }).toString();

    const tokenResp = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      tokenBody,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    const accessToken = tokenResp.data.access_token;
    console.log("Access token obtained successfully");

    // 2️⃣ Fetch LinkedIn profile using NEW API (OpenID Connect)
    const profileResp = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    // New API response structure
    const linkedinId = profileResp.data.sub; // "sub" is the user ID in OpenID
    const fullName = profileResp.data.name || "LinkedIn User";
    const email = profileResp.data.email;
    const firstName = profileResp.data.given_name || "";
    const lastName = profileResp.data.family_name || "";

    console.log("LinkedIn profile fetched:", { linkedinId, fullName, email });

    // 4️⃣ Find or create user
    let user = await DB.User.findOne({ email });
    
    if (!user) {
      console.log("Creating new user for:", email);
      user = new DB.User({
        email,
        name: fullName,
        provider: "linkedin",
        role: "user",
        type: "tutor",
        timezone: "Asia/Kolkata",
        isActive: true,
        emailVerified: true
      });
      await user.save();
    } else {
      console.log("Existing user found:", user._id);
    }

    // 5️⃣ Save or update social info
    let social = await DB.UserSocial.findOne({
      userId: user._id,
      socialId: linkedinId,
      social: "linkedin"
    });

    if (!social) {
      social = new DB.UserSocial({
        userId: user._id,
        socialId: linkedinId,
        social: "linkedin"
      });
    }

    social.accessToken = accessToken;
    social.socialInfo = profileResp.data;
    await social.save();

    // 6️⃣ Generate JWT token
    const expireTokenDuration = 60 * 60 * 24 * 7; // 7 days
    const now = new Date();
    const expiredAt = new Date(now.getTime() + expireTokenDuration * 1000);
    const token = signToken(user._id, user.role, expireTokenDuration);

    console.log("JWT token generated for user:", user._id);

    res.locals.login = { token, expiredAt };
    return next();

  } catch (error) {
    console.error("LINKEDIN LOGIN ERROR:", error.response?.data || error.message);
    if (error.response) {
      console.error("LinkedIn API Response:", error.response.data);
    }
    return next(error);
  }
};
