const express = require("express");
const passport = require("passport");
const router = express.Router();

// Start OAuth flow
router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.metadata",
    ],
    prompt: "consent",
  })
);

// OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/health",
    successRedirect: "/home", // change based on your app
  })
);
module.exports = router;
