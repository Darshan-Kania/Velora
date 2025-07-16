const { google } = require("googleapis");
const logger = require("../utils/logger");
async function watchGmailInbox(accessToken) {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: "v1", auth });

    const res = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: "projects/mailflare-465412/topics/mailflareGmail",
        labelIds: ["INBOX"],
        labelFilterAction: "include",
      },
    });

    logger.info("✅ Gmail watch started:", res.data);
    return res.data;
  } catch (error) {
    logger.error("❌ Error starting Gmail watch:", error);
    throw new Error("Failed to start Gmail watch");
  }
}
module.exports = watchGmailInbox;
