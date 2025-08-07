const { logger } = require("../utils/logger");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

// Configure Passport to use Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      // The 'done' function is called after successful authentication.
      // It passes the authenticated user's profile to Passport.
      try {
        const userData = {
          _accessToken: accessToken,
          _refreshToken: refreshToken,
          _profile: profile,
          email: profile.emails[0].value,
        };
        done(null, userData);
      } catch (error) {
        logger.error("Error authenticating user:", error);
        done(error);
      }
    }
  )
);
