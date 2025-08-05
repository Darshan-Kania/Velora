const { google } = require('googleapis');
const logger = require('../utils/logger');

const watchGmailInbox = async (accessToken) => {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const res = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        labelIds: ['INBOX'],
        topicName: 'projects/velora-190779/topics/mailflare-inbox-updates',
      },
    });

    logger.info('📡 Gmail Watch Registered:', res.data);

    return res.data; // contains expiration, historyId
  } catch (err) {
    logger.error('❌ Error in watchGmailInbox:', err);
    throw err;
  }
};

module.exports = watchGmailInbox;
