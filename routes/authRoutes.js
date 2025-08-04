const express = require("express");
const passport = require("passport");
const { handleGoogleCallback } = require("../controllers/authController");

const router = express.Router();

// Start Google OAuth flow
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
  })
);

// Handle Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/failure",
  }),
  handleGoogleCallback
);

module.exports = router;
