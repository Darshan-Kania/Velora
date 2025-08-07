const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const jwt = require("jsonwebtoken");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const payload = {
          email: profile.emails[0].value,
          name: profile.displayName,
          picture: profile.photos[0].value,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });

        return done(null, { token, email: payload.email });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
