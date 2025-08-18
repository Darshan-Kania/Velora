import cron from "node-cron";
import { refreshExpiringTokens,restartWatch } from "../services/jobsService.js";
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

// Run Every Day at 00:00
cron.schedule("0 0 * * *", async () => {
  logger.info("🌅 Running daily job at", new Date().toISOString());
  try {
    await restartWatch();
  } catch (err) {
    logger.error("❌ Error running daily job:", err.message);
  }
});