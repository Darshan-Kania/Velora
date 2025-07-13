const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const watchGmailInbox=require("./watchGmail");
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      await watchGmailInbox(accessToken);
      const user = {
        name: profile.displayName,
        email: profile.emails[0].value,
        accessToken,
        refreshToken,
      };
      logger.info(`User authenticated: ${user.email}`);
      return done(null, user);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));