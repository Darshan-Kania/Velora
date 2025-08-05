const { google } = require('googleapis');
const logger = require('../utils/logger');
exports.registerGmailWatch = async (req, res) => {
  try {
    const accessToken = req.user.accessToken; // get from DB or JWT
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        labelIds: ['INBOX'],
        topicName: 'projects/velora-190779/topics/mailflare-inbox-updates', // Use your actual project ID
      },
    });

    logger.info('📡 Gmail Watch Registered:', response.data);

    // TODO: Save historyId and expiration in DB per user

    return res.status(200).json({
      message: 'Gmail Watch Registered Successfully',
      expiration: response.data.expiration,
      historyId: response.data.historyId,
    });
  } catch (error) {
    logger.error('❌ Error Registering Gmail Watch:', error);
    return res.status(500).json({ error: error.message });
  }
};
exports.handleNotification = async (req, res) => {
  try {
    const message = req.body.message;

    if (!message || !message.data) {
      logger.error('❌ Invalid Pub/Sub message');
      return res.status(400).send('Invalid Pub/Sub message');
    }

    // Decode base64-encoded message
    const data = Buffer.from(message.data, 'base64').toString('utf-8');
    const parsed = JSON.parse(data);

    const historyId = parsed.historyId;
    const emailAddress = parsed.emailAddress;

    logger.info(`📨 Gmail Notification: historyId=${historyId}, email=${emailAddress}`);

    // TODO: Fetch new emails using Gmail History API
    // and trigger your AI summarizer/n8n

    return res.status(200).send('OK');
  } catch (error) {
    logger.error('❌ Notification handler error:', error);
    return res.status(500).send('Internal Server Error');
  }
};
