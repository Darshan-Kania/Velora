const express = require("express");
const passport = require("passport");
const { logger } = require("../utils/logger");

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.labels",
    ],
    accessType: "offline",
    prompt: "consent",
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/error401",
  }),
  (req, res) => {
    const { token, email } = req.user;
    logger.info(`✅ Google OAuth successful for user: ${email}`);
    res.send("OAuth successful! You can close this window.").status(200);
  }
);

router.get("/error401", (req, res) => {
  logger.warn("❌ Google OAuth failed");
  res.status(401).send("Unauthorized");
});

module.exports = { router };
