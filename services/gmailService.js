const { google } = require('googleapis');
const logger = require('../utils/logger');
require("dotenv").config();

const getHistoryEvents = async (email, historyId) => {
  try {
    const tokens = process.env.DUMMY_ACCESS_TOKEN; // ⬅️ Use your current token logic

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: tokens });

    const gmail = google.gmail({ version: 'v1', auth });

    const res = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: historyId,
      historyTypes: ['messageAdded', 'labelAdded'], // 🎯 Only fetch relevant types
    });

    const history = res.data.history || [];
    logger.info(`📜 History events for ${email}: ${history.length}`);

    for (const entry of history) {
      if (entry.messagesAdded) {
        for (const m of entry.messagesAdded) {
          const msgId = m.message.id;
          logger.info(`➕ Message Added: ${msgId}`);

          // 📨 Optional: fetch message snippet
          const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: msgId,
            format: 'full',
          });

          logger.info(`📄 Snippet: ${fullMessage.data.snippet}`);
        }
      }

      if (entry.labelsAdded) {
        for (const m of entry.labelsAdded) {
          logger.info(`🏷️ Labels Added to ${m.message.id}: ${m.labelIds.join(', ')}`);
        }
      }
    }

  } catch (err) {
    logger.error(`❌ Error in getHistoryEvents for ${email}: ${err.message}`);
    throw err;
  }
};

module.exports = { getHistoryEvents };
