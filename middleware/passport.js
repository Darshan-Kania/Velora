const passport = require("passport");
const logger = require("../utils/logger");
const { log } = require("winston");
const dotenv = require("dotenv").config();
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL ;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      // Store tokens for later use
      logger.info(`Google OAuth successful for user: ${profile.emails[0].value}`);
      logger.info(`Access Token: ${accessToken}`);
      const userData = {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        accessToken: accessToken,
        refreshToken: refreshToken
      };
      return done(null, userData);
    }
  )
);
