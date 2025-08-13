import { logger } from "../utils/logger.js";
import {
  verifyAndClearTokens,
  generateJwtToken,
  verifyJwtToken,
  retrieveOrRegisterUser,
} from "../services/authService.js";

/**
 * Authenticate user and return jwt token + user
 */
async function authenticateUser(req) {
  const userData = req.user;

  if (!userData || !userData.email) {
    logger.warn("⚠️ No user object or email from OAuth provider");
    throw new Error("Invalid user data from OAuth");
  }

  logger.info(`✅ Google OAuth success for user: ${userData.email}`, {
    name: userData.name,
    ip: req.ip,
  });
  await startGmailWatchService(userData);

  // ===== Generate JWT token and register user (always execute) =====
  let jwtToken;
  try {
    jwtToken = generateJwtToken(userData);
    logger.info(`🔑 JWT signed for ${userData.email}`);
  } catch (err) {
    logger.error(`❌ JWT signing failed for ${userData.email}`, {
      error: err.message,
      stack: err.stack,
    });
    throw new Error("Token generation failed");
  }

  // Check DB for user
  // Retrieve existing user or register a new one, passing userData and jwtToken
  let user;
  try {
    user = await retrieveOrRegisterUser(userData, jwtToken);
    logger.info(`👤 User retrieved or registered: ${user.email}`, {
      userId: user._id,
    });
  } catch (err) {
    logger.error(`❌ Failed to retrieve or register user: ${userData.email}`, {
      error: err.message,
      stack: err.stack,
    });
    throw new Error("User retrieval or registration failed");
  }

  return { jwtToken, user };
}

/** isAuthenticated is code to check if user is authenticated with JWT Token not expired */
async function isAuthenticated(req) {
  const token = req.cookies.jwt;
  if (!token) {
    logger.warn("❌ No JWT token provided");
    return false;
  }
  try {
    const decoded = await verifyJwtToken(token);
    if (!decoded) {
      logger.warn("❌ Invalid JWT token");
      return false;
    }
    return true;
  } catch (err) {
    logger.warn("❌ JWT verification failed", { error: err.message });
    return false;
  }
}

/** Logout user and clear JWT cookie */
async function logoutUser(req, res) {
  const curToken = req.cookies && req.cookies.jwt;
  logger.info(`🔍 Current JWT token: ${curToken ? "Present" : "Not found"}`);
  if (curToken) {
    await verifyAndClearTokens(curToken);
    logger.info("🔓 JWT token cleared and user logged out");
  } else {
    logger.info("ℹ️ No JWT token found - user already logged out");
  }
  // Do not send any response here. Let the route handler handle it.
}

export { authenticateUser, isAuthenticated, logoutUser };
