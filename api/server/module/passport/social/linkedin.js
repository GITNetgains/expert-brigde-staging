// linkedin.controller.js - UPDATED VERSION
const axios = require("axios");
const signToken = require("../auth.service").signToken;

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI; // Should be: http://localhost:4200/auth/linkedin/callback

exports.login = async (req, res, next) => {
  try {
    // Accept code from both query params (GET) and body (POST)
    const code = req.query.code || req.body.code;
    
    if (!code) {
      console.error("No LinkedIn code provided");
      return next(PopulateResponse.validationError({ 
        message: "Missing LinkedIn OAuth code" 
      }));
    }

    console.log("LinkedIn code received:", code);

    // 1️⃣ Exchange code for access token
    const tokenResp = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET
        },
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded" 
        }
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
