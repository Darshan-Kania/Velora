const { google } = require("googleapis");
async function watchGmailInbox(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName: "projects/mailflare-465412/topics/gmail-topic-mailFlare",
      labelIds: ["INBOX"],
      labelFilterAction: "include",
    },
  });

  console.log("✅ Gmail watch started:", res.data);
  return res.data;
}
module.exports = watchGmailInbox;
