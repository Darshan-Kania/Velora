import express from "express";
import passport from "passport";
import { logger } from "../utils/logger.js";
import {
  authenticateUser,
  isAuthenticated,
  logoutUser,
} from "../controllers/authController.js";

const router = express.Router();

// Step 1: Initiate Google OAuth
router.get(
  "/google",
  async (req, res, next) => {
    try {
      if (await isAuthenticated(req)) {
        logger.info("✅ User already authenticated, redirecting to home");
        res.redirect("/");
      } else {
        next();
      }
    } catch (err) {
      next(err);
    }
      logger.info("🔁 Initiating Google OAuth");
      next();
    }
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

      // Log JWT token creation and cookie setting
      logger.info(`🔑 JWT token created for ${user.email}`, {
        tokenLength: jwtToken.length,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      res.cookie("jwt", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      logger.info(
        `🍪 JWT cookie set for ${user.email} (httpOnly: true, 7 days expiry)`
      );

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
      });
    }
  }
);

// Step 3: Unauthorized route
router.get("/error401", (req, res) => {
  logger.warn("❌ Google OAuth failed - Redirected to /error401");
  res.status(401).send("Unauthorized");
});
// Step 4: Logout route
router.get("/logout", async (req, res) => {
  try {
    logger.info("🔓 User logout initiated");
    await logoutUser(req, res);
    res.clearCookie("jwt");
    logger.info("🔓 JWT cookie cleared, redirecting to home");
    return res.redirect("/"); 
  } catch (error) {
    logger.error("❌ Logout failed", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      message: "Logout failed",
    });
  }
});
export { router as authRoutes };
