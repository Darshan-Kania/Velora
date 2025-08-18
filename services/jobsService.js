import { UserModel } from "../models/User.js";
import { google } from "googleapis";
import { logger } from "../utils/logger.js";
function createOAuthClient(user) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );

  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
    expiry_date: user.accessTokenExpiresAt,
  });

  return oauth2Client;
}

async function refreshExpiringTokens() {
  const now = Date.now();
  const threshold = 10 * 60 * 1000; // 10 min before expiry

  const users = await UserModel.find({
    accessTokenExpiresAt: { $lte: now + threshold },
  });

  logger.info(`👥 Found ${users.length} users with expiring tokens`);

  for (const user of users) {
    try {
      const oauth2Client = createOAuthClient(user);

      // This call automatically refreshes the token if expired
      const newToken = await oauth2Client.getAccessToken();

      // Update DB
      user.accessToken = newToken.token;
      user.accessTokenExpiresAt = oauth2Client.credentials.expiry_date;
      await user.save();

      logger.info(`✅ Refreshed token for ${user.email}`);
    } catch (err) {
      logger.error(
        `❌ Failed to refresh token for ${user.email}:`,
        err.message
      );
    }
  }
}
async function restartWatch() {
  // Whoose expiredAt is less than now + 1 day
  const users = await UserModel.find({
    expiresAt: { $lte: Date.now() + 24 * 60 * 60 * 1000 },
  });
  logger.info(`👥 Restarting watch for ${users.length} users`);

  for (const user of users) {
    try {
      const oauth2Client = createOAuthClient(user);
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      // Restart watch
      await gmail.users.watch({
        userId: "me",
        requestBody: {
          labelIds: ["INBOX"],
          topicName: process.env.GOOGLE_PUBSUB_TOPIC,
        },
      });

      logger.info(`✅ Watch restarted for ${user.email}`);
    } catch (err) {
      logger.error(
        `❌ Failed to restart watch for ${user.email}:`,
        err.message
      );
    }
  }
}
export { refreshExpiringTokens, restartWatch };