import express from "express";
import passport from "passport";
import { logger } from "../utils/logger.js";
import {
  authenticateUser,
  isAuthenticated,
  logoutUser,
} from "../controllers/authController.js";

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL;
// Step 1: Initiate Google OAuth
router.get(
  "/google",
  async (req, res, next) => {
    if (await isAuthenticated(req)) {
      logger.info("✅ User already authenticated, redirecting to home");
      res.redirect(`${FRONTEND_URL}/dashboard`);
    } else {
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
      res.status(200).redirect(`${FRONTEND_URL}/auth/callback`);
    } catch (error) {
      logger.error("❌ Authentication failed", {
        error: error.message,
        stack: error.stack,
      });
      res.status(500).redirect(`${FRONTEND_URL}/auth/callback`);
    }
  }
);

// Step 3: Unauthorized route
router.get("/error401", (req, res) => {
  logger.warn("❌ Google OAuth failed - Redirected to /error401");
  res.status(401).send("Unauthorized");
});
// Step 4: Logout route
router.patch("/logout", async (req, res) => {
  try {
    logger.info("🔓 User logout initiated");
    await logoutUser(req, res);
    res.clearCookie("jwt");
    logger.info("🔓 JWT cookie cleared, redirecting to home");
    return res.status(200).json({ message: "Logged out successfully" });
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
router.get('/status', async (req, res) => {

  try {
    const isAuth = await isAuthenticated(req);
    return res.status(200).json({ authenticated: isAuth });
  } catch (err) {
    logger.error("❌ Auth status check failed", {
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ authenticated: false, error: 'Auth status check failed' });
  }

});

export { router as authRoutes };
