import { logger } from "../utils/logger.js";
import { UserConfigModel } from "../models/UserConfig.js";
import { UserModel } from "../models/User.js";
import { EmailModel } from "../models/Email.js";
import {
  updateUserHistory,
  getEmailsBetweenHistoryIds,
} from "../services/gmailService.js";
async function extractNotificationData(email, historyId, messageId) {
  try {
    logger.info(`📬 Extracting notification data for ${email}`, {
      historyId,
      messageId,
    });
    const lastHistoryId = await updateUserHistory(email, historyId);
    const messages = await getEmailsBetweenHistoryIds(
      email,
      lastHistoryId,
      historyId
    );
    messages.forEach((element) => {
      console.log(element);
    });
  } catch (err) {
    logger.error("❌ Failed to extract notification data", {
      error: err.message,
      stack: err.stack,
    });
  }
}
export { extractNotificationData };
