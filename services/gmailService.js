const { google } = require('googleapis');
const logger = require('../utils/logger');
require("dotenv").config();
const getHistoryEvents = async (email, historyId) => {
  try {
    const tokens = process.env.DUMMY_ACCESS_TOKEN; // ⬅️ Get access_token from DB

    // if (!tokens?.access_token) {
    //   throw new Error('Access token not found for user: ' + email);
    // }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: tokens });

    const gmail = google.gmail({ version: 'v1', auth });

    const res = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: historyId,
    });

    const history = res.data.history || [];
    logger.info(`📜 History events for ${email}: ${history.length}`);

    history.forEach(entry => {
      if (entry.messagesAdded) {
        entry.messagesAdded.forEach(m => {
          logger.info(`➕ Message Added: ${m.message.id}`);
        });
      }
      if (entry.labelsAdded) {
        entry.labelsAdded.forEach(m => {
          logger.info(`🏷️ Labels Added to ${m.message.id}: ${m.labelIds.join(', ')}`);
        });
      }
    });

  } catch (err) {
    logger.error(`❌ Error in getHistoryEvents for ${email}:`, err);
    throw err; // still rethrow so caller logs it
  }
};

module.exports = { getHistoryEvents };
