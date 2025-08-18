import {UserModel} from "../models/User.js";
import { google } from "googleapis";

export function createOAuthClient(user) {
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

export async function refreshExpiringTokens() {
  const now = Date.now();
  const threshold = 10 * 60 * 1000; // 10 min before expiry

  const users = await UserModel.find({
    accessTokenExpiresAt: { $lte: now + threshold },
  });

  console.log(`👥 Found ${users.length} users with expiring tokens`);

  for (const user of users) {
    try {
      const oauth2Client = createOAuthClient(user);

      // This call automatically refreshes the token if expired
      const newToken = await oauth2Client.getAccessToken();

      // Update DB
      user.accessToken = newToken.token;
      user.accessTokenExpiresAt = oauth2Client.credentials.expiry_date;
      await user.save();
      
      console.log(`✅ Refreshed token for ${user.email}`);
    } catch (err) {
      console.error(
        `❌ Failed to refresh token for ${user.email}:`,
        err.message
      );
    }
  }
}
