const express = require("express");
const passport = require("passport");

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
  (req, res) => {
    // Successful authentication, redirect or respond with user data
    res.json({
      success: true,
      message: "Authentication successful",
      user: req.user,
    });
  }
);

module.exports = router;
