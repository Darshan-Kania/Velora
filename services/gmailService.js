import { google } from "googleapis";
import { logger } from "../utils/logger.js";
async function startWatch(gmail) {
  return await gmail.users.watch({
    userId: "me",
    requestBody: {
      labelIds: ["INBOX"],
      topicName: process.env.GOOGLE_PUBSUB_TOPIC
    },
  });
}
async function fetchRecentMessages(gmail) {
  const messages = await gmail.users.messages.list({
    userId: "me",
    q: "newer_than:7d", // Gmail search syntax
    maxResults: 10,
    historyTypes: ["messageAdded"],
  });
  logger.info(
    `📬 Found ${messages.data.messages?.length || 0} recent messages`
  );
  return messages.data.messages || [];
}
function createOAuth2Client(userData) {
  logger.info(userData);
  if (!userData || !userData.accessToken || !userData.refreshToken) {
    logger.error("❌ Missing OAuth tokens in user data");
  }
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
    logger.info("📧 Gmail API client created successfully");
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
async function extractDataFromPubSub(req) {
  try {
    logger.info("🔍 Extracting data from Pub/Sub notification");

    // Google Cloud Pub/Sub sends data in this format:
    // { message: { data: "base64-encoded-string", messageId: "...", publishTime: "..." } }
    const pubsubMessage = req.body?.message;

    if (!pubsubMessage) {
      logger.warn("⚠️ No Pub/Sub message found in request body");
      return null;
    }

    if (!pubsubMessage.data) {
      logger.warn("⚠️ No data found in Pub/Sub message");
      return null;
    }

    // Decode the base64 data
    const decodedData = Buffer.from(pubsubMessage.data, "base64").toString(
      "utf8"
    );
    logger.info(`📨 Decoded Pub/Sub data: ${decodedData}`);

    // Parse the JSON data
    const gmailNotification = JSON.parse(decodedData);
    logger.info(
      `📬 Gmail notification details: ${JSON.stringify(
        gmailNotification,
        null,
        2
      )}`
    );

    // Extract important information
    const { emailAddress, historyId } = gmailNotification;
    logger.info(`👤 Email: ${emailAddress}, 📋 New HistoryId: ${historyId}`);

    return {
      email: emailAddress,
      historyId,
      messageId: pubsubMessage.messageId,
      publishTime: pubsubMessage.publishTime,
      rawNotification: gmailNotification,
    };
  } catch (err) {
    logger.error("❌ Failed to extract Pub/Sub data", {
      error: err.message,
      stack: err.stack,
    });
    return null;
  }
}
export { startGmailWatchService, extractDataFromPubSub };
