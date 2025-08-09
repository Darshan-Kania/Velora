const express = require("express");
const passport = require("passport");
const { logger } = require("../utils/logger");
const { authenticateUser } = require("../controllers/authController");

const router = express.Router();

// Step 1: Initiate Google OAuth
router.get(
  "/google",
  (req, res, next) => {
    logger.info("🔁 Initiating Google OAuth");
    next();
  },
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

// Step 2: Google OAuth callback
router.get(
  "/google/callback",
  (req, res, next) => {
    logger.info("⬅️ Google OAuth callback triggered");
    next();
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/error401",
  }),
  async (req, res) => {
    try {
      const { jwtToken, user } = await authenticateUser(req);

      res.status(200).json({
        message: "Authentication successful",
        jwtToken,
        user: {
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      logger.error("❌ Authentication failed", {
        error: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        message: "Authentication failed",
        error: error.message,
      });
    }
  }
);

// Step 3: Unauthorized route
router.get("/error401", (req, res) => {
  logger.warn("❌ Google OAuth failed - Redirected to /error401");
  res.status(401).send("Unauthorized");
});

module.exports = { router };
