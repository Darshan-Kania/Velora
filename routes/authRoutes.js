const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { logger } = require("../utils/logger");
require("dotenv").config();

const router = express.Router();

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

router.get(
  "/google/callback",
  (req, res, next) => {
    logger.info("⬅️ Google OAuth callback triggered");
    next();
  },
  passport.authenticate("google", { session: false, failureRedirect: "/auth/error401" }),
  (req, res) => {
    try {
      logger.info("✅ Google OAuth success for user: " + req.user.email);

      const token = jwt.sign(
        {
          email: req.user.email,
          name: req.user.name,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      logger.info("🔐 JWT generated for user: " + req.user.email);
      req.cookies.JWT_TOKEN = token; // Set JWT in cookies
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

router.get("/error401", (req, res) => {
  logger.warn("❌ Google OAuth failed - Redirected to /error401");
  res.status(401).send("Unauthorized");
});

module.exports = { router };
