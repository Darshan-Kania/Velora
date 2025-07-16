const { google } = require("googleapis");
const logger = require("../utils/logger");
async function watchGmailInbox(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName: "projects/mailflare-465412/topics/MailFlare-Gmail",
      labelIds: ["INBOX"],
    },
  });
  logger.info(res);
  logger.info("✅ Gmail watch started:", res.data);
  return res.data;
}
module.exports = watchGmailInbox;
