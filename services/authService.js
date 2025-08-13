import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";
import { userModel } from "../models/user.js";
async function verifyAndClearTokens(curToken) {
  try {
    jwt.verify(curToken, process.env.JWT_SECRET);

    // Find and update user in database
    const user = await userModel.findOne({ jwtToken: curToken });
    if (user) {
      user.jwtToken = undefined;
      user.accessToken = undefined;
      user.refreshToken = undefined;
      user.expiresAt = undefined;
      await user.save();
      logger.info(
        `✅ User ${user.email} logged out successfully - tokens cleared from DB`
      );
    } else {
      logger.warn("⚠️ User not found in DB for the provided JWT token");
    }
  } catch (err) {
    logger.error("❌ JWT verification failed during logout", {
      error: err.message,
      stack: err.stack,
    });
  }
}

/**
 * Generate JWT token for a user
 */
function generateJwtToken(user) {
  return jwt.sign(
    { email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

async function verifyJwtToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.info(`✅ Token valid for user: ${decoded.email}`);
    return true;
  } catch (err) {
    logger.error(`❌ Token verification failed: ${err.message}`);
    return false;
  }
}
/**
 * Save a new user to DB
 */

async function saveNewUser(userData, jwtToken) {
  const newUser = new userModel({
    email: userData.email,
    name: userData.name,
    accessToken: userData.accessToken,
    refreshToken: userData.refreshToken,
    jwtToken: jwtToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await newUser.save();
  logger.info(`✅ New user ${userData.email} saved successfully`);
  return newUser;
}
/**
 * Update an existing user in DB
 */
async function updateExistingUser(existingUser, userData, jwtToken) {
  existingUser.accessToken = userData.accessToken;
  existingUser.refreshToken = userData.refreshToken;
  existingUser.jwtToken = jwtToken;
  existingUser.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await existingUser.save();
  logger.info(`✅ User ${userData.email} updated successfully`);
  return existingUser;
}
async function retrieveOrRegisterUser(userData, jwtToken) {
  let user = await userModel.findOne({ email: userData.email });

  if (user) {
    logger.info(`ℹ️ Existing user found: ${userData.email}`);
    user = await updateExistingUser(user, userData, jwtToken);
  } else {
    user = await saveNewUser(userData, jwtToken);
  }
  return user;
}
export {
  verifyAndClearTokens,
  generateJwtToken,
  verifyJwtToken,
  retrieveOrRegisterUser,
};
