import cron from "node-cron";
import {
  refreshExpiringTokens,
  restartWatch,
} from "../services/jobsService.js";
import {
  fetchPendingMails,
  summarizeMails,
  storeSummarizedMails,
} from "../services/jobsMailService.js";
import { logger } from "./logger.js";
// Runs every 25 minutes
cron.schedule("*/25 * * * *", async () => {
  logger.info("🔄 Checking expiring tokens at", new Date().toISOString());
  try {
    await refreshExpiringTokens();
  } catch (err) {
    logger.error("❌ Error refreshing tokens:", err.message);
  }
});

cron.schedule("00 00 * * *", async () => {
  logger.info(`🌅 Running daily job at ${new Date().toISOString()}`);
  try {
    await restartWatch();
  } catch (err) {
    logger.error("❌ Error running daily job:", err);
  }
});

cron.schedule("*/20 * * * * *", async () => {
  logger.info("🔄 Restarting watch every 20 Seconds at", new Date().toISOString());
  try {
    const pendingMails = await fetchPendingMails();
    if (pendingMails.length === 0) {
      logger.info("No pending mails to summarize.");
      return;
    }
    const summarizedMails = await summarizeMails(pendingMails)
      .catch((err) => {
        logger.error(`❌ Error summarizing mails: ${err.message}`);
        return [];
      });

    // Now summarizedMails is already an array
    if (summarizedMails.length > 0) {
      logger.info(`🧐 Summarizing Mails`);
    } else {
      logger.info("⚠️ No mails summarized this cycle.");
      return;
    }

    await storeSummarizedMails(summarizedMails);
    logger.info("✅ Stored summarized mails successfully.");
  } catch (err) {
    logger.error(`❌ Error in email summarization job: ${err.message}`);
  }
});
