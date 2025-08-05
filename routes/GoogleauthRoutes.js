const express = require("express");
const passport = require("passport");
const googleAuthController= require("../controllers/googleAuthController");
const logger = require("../utils/logger");
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
router.get("/google/callback", passport.authenticate("google", { session: false }), googleAuthController);


router.get("/failure", (req, res) => {
  logger.error("Google OAuth failed");
  res.status(401).json({
    success: false,
    message: "Authentication failed",
  });
});

module.exports = router;
