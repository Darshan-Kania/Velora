const { logger } = require("../utils/logger");
const userModel = require("../models/user");
const jwt = require("jsonwebtoken");

/**
 * Generate JWT token for a user
 */
function generateJwtToken(user) {
  return jwt.sign(
    { email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
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

  // Generate jwt token
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
  let user = await userModel.findOne({ email: userData.email });

  if (user) {
    logger.info(`ℹ️ Existing user found: ${userData.email}`);
    user = await updateExistingUser(user, userData, jwtToken);
  } else {
    user = await saveNewUser(userData, jwtToken);
  }

  return { jwtToken, user };
}

module.exports = {
  authenticateUser,
};
