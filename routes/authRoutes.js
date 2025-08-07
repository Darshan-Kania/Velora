const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { logger } = require("../utils/logger");
require("dotenv").config();
const userModel = require("../models/user"); // Assuming you have a user model defined

const router = express.Router();
// Initiated when /auth/google is hit and the user wants to authenticate via Google
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
// Callback route for Google to redirect to after authentication
// This is where the user will be redirected after successful authentication
// It will handle the JWT generation and send it back to the client
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
  (req, res) => {
    try {
      logger.info("✅ Google OAuth success for user: " + req.user.email);

      const token = jwt.sign(
        {
          email: req.user.email,
          name: req.user.name,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      logger.info(
        "🔄 New user detected, saving to database: " + req.user.email
      );
      logger.info("🔐 JWT generated for user: " + req.user.email);
      const newUser = new userModel({
        email: req.user.email,
        name: req.user.name,
        accessToken: req.user.accessToken,
        refreshToken: req.user.refreshToken,
        jwtToken: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });
      newUser
        .save()
        .then(() => logger.info("✅ User saved to database: " + req.user.email))
        .catch((err) =>
          logger.error("❌ Error saving user to database: " + err.message)
        );
      res.status(200).json({
        message: "Authentication successful",
        token,
      });
    } catch (error) {
      logger.error("❌ Error while generating JWT: " + error.message);
      res.status(500).send("Error generating token");
    }
  }
);
// Error handling route for unauthorized access
router.get("/error401", (req, res) => {
  logger.warn("❌ Google OAuth failed - Redirected to /error401");
  res.status(401).send("Unauthorized");
});

module.exports = { router };
