import cron from "node-cron";
import {
  refreshExpiringTokens,
  restartWatch
} from "../services/jobsService.js";
import{
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

cron.schedule("*/10 * * * * *", async () => {
  logger.info(
    "🔄 Restarting watch every 10 Seconds at",
    new Date().toISOString()
  );
  try {
    const pendingMails = await fetchPendingMails();
    const summarizedMails = await summarizeMails(pendingMails);
    for(const mail in summarizedMails.body)
    {
      logger.info(mail);
    }
    // await storeSummarizedMails(summarizedMails);
  } catch (err) {
    logger.error(`❌ Error restarting watch: ${err.message}`);
  }
});
