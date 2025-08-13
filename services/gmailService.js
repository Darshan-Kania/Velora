import { google } from "googleapis";
import { logger } from "../utils/logger.js";
async function startWatch(gmail) {
  return await gmail.users.watch({
    userId: "me",
    requestBody: {
      labelIds: ["INBOX"],
      topicName: process.env.GOOGLE_PUBSUB_TOPIC,
    },
  });
}
async function fetchRecentMessages(gmail) {
  const messages = await gmail.users.messages.list({
    userId: "me",
    q: "newer_than:7d", // Gmail search syntax
    maxResults: 10,
  });
  logger.info(
    `📬 Found ${messages.data.messages?.length || 0} recent messages`
  );
}
function createOAuth2Client(userData) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
  logger.info("🔑 Setting OAuth2 credentials");
  oauth2Client.setCredentials({
    access_token: userData.accessToken,
    refresh_token: userData.refreshToken,
  });
  return oauth2Client;
}
/** Start Gmail Service After OAuth Success Detected */
async function startGmailWatchService(userData) {
  try {
    logger.info("🔗 Initializing Gmail API client");
    const oauth2Client = createOAuth2Client(userData);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // ===== 2. Get current historyId =====
    const profile = await gmail.users.getProfile({ userId: "me" });
    logger.info("📋 Current historyId:", profile.data.historyId);

    // ===== 3. Fetch recent activity log =====
    await fetchRecentMessages(gmail);

    // ===== 4. Start Gmail Watch =====
    const watchRes = await startWatch(gmail);
    if (watchRes.data.expiration) {
      logger.info(
        `⏳ Watch expires at: ${new Date(Number(watchRes.data.expiration))}`
      );
    }
    logger.info(`📡 Gmail watch started`, watchRes.data);
  } catch (err) {
    logger.error("❌ Failed to initialize Gmail client", {
      error: err.message,
      stack: err.stack,
    });
  }
}
async function extractDataFromPubSub(req) {}
export { startGmailWatchService, extractDataFromPubSub };
