const { google } = require('googleapis');
const logger = require('../utils/logger');
const {getHistoryEvents}=require("../services/gmailService")
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
    logger.info('📥 Received Pub/Sub notification');
    logger.info('Request body:', JSON.stringify(req.body, null, 2));
    
    // Send immediate ACK to prevent timeouts
    res.status(200).send('OK');
    
    const message = req.body.message;

    if (!message || !message.data) {
      logger.error('❌ Invalid Pub/Sub message - missing message.data');
      return;
    }

    // Decode base64-encoded message
    const data = Buffer.from(message.data, 'base64').toString('utf-8');
    logger.info('📄 Decoded Pub/Sub data:', data);
    
    const parsed = JSON.parse(data);
    const historyId = parsed.historyId;
    const emailAddress = parsed.emailAddress;

    logger.info(`📨 Gmail Notification: historyId=${historyId}, email=${emailAddress}`);

    // TODO: Fetch new emails using Gmail History API
    // and trigger your AI summarizer/n8n

  } catch (error) {
    logger.error('❌ Notification handler error:', error);
    // Already sent 200 OK above, so don't send another response
  }
};

// ✅ Async helper (non-blocking)
const processGmailHistory = async (email, historyId) => {
  try {
    await getHistoryEvents(email, historyId);
  } catch (err) {
    logger.error(`❌ Error processing Gmail history for ${email}:`, err);
  }
};
