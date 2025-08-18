import cron from "node-cron";
import { refreshExpiringTokens } from "../services/jobsService.js";

// Runs every 45 minutes
cron.schedule("*/1 * * * *", async () => {
  console.log("🔄 Checking expiring tokens at", new Date().toISOString());
  try {
    await refreshExpiringTokens();
  } catch (err) {
    console.error("❌ Error refreshing tokens:", err.message);
  }
});