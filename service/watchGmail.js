const { google } = require("googleapis");
const logger = require("../utils/logger");

/**
 * Starts Gmail push notifications using a Pub/Sub topic.
 * @param {string} accessToken - OAuth2 access token for the user.
 * @returns {Promise<Object>} Gmail watch response data.
 */
async function watchGmailInbox(accessToken) {
  try {
    if (!accessToken) {
      throw new Error("No access token provided");
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: "projects/mailflare-465412/topics/MailFlare-Gmail",
        labelIds: ["INBOX"], // optional: limit to specific labels
      },
    });

    const data = response.data;

    logger.info("✅ Gmail watch started successfully");
    logger.info("🔔 Watch Details:", {
      historyId: data.historyId,
      expiration: new Date(Number(data.expiration)).toISOString(),
    });

    return data;

  } catch (err) {
    logger.error("❌ Error starting Gmail watch:", err.message || err);
    throw err;
  }
}