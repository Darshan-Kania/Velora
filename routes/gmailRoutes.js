import express from "express";
import { logger } from "../utils/logger.js";
import { extractDataFromPubSub } from "../services/gmailService.js";
const router = express.Router();
// Gmail Pub/Sub webhook endpoint
// Note: We're using express.json() from server.js, no need for additional body parser
router.post("/notifications", async (req, res) => {
  try {
    const { email, historyId, messageId } = await extractDataFromPubSub(req);
    logger.info(`📬 New Gmail notification for ${email}`, {
      historyId,
      messageId,
    const data = await extractDataFromPubSub(req);
    if (!data) {
      logger.warn("⚠️ extractDataFromPubSub returned null or undefined", { reqBody: req.body });
    } else {
      const { email, historyId, messageId } = data;
      logger.info(`📬 New Gmail notification for ${email}`, {
        historyId,
        messageId,
      });
    }
  } catch (err) {
    logger.error("❌ Failed to extract data from Pub/Sub", {
      error: err.message,
      stack: err.stack,
    });
  }
  return res.status(200).send("OK");
});

export { router as gmailRoutes };
