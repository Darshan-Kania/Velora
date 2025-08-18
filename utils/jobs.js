import cron from "node-cron";
import { refreshExpiringTokens } from "../services/jobsService.js";
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