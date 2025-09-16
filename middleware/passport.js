import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import {logger} from "../utils/logger.js";
import "dotenv/config";
// Initialize Passport with Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userData = {
          email: profile.emails[0].value,
          name: profile.displayName,
          accessToken:accessToken,
          refreshToken:refreshToken,
        };
        logger.info("✅ Google profile received: " + JSON.stringify(userData.email));
        done(null, userData);
      } catch (error) {
        logger.error("❌ Error in Google Strategy verify callback: " + error.message);
        done(error, null);
      }
    }
  )
);
