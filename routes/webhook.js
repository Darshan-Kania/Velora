const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");
router.post("/newEmail", async (req, res) => {
  try {
    const pubsubMessage = req.body.message;

    if (!pubsubMessage || !pubsubMessage.data) {
      logger.error("❌ Invalid Pub/Sub message format:", req.body);
      return res.status(400).send("Invalid Pub/Sub message");
    }

    // Decode base64 Pub/Sub message
    const decodedData = Buffer.from(pubsubMessage.data, "base64").toString("utf-8");

    logger.info("📨 Gmail Webhook Fired");
    logger.info("🔓 Decoded PubSub Message:", decodedData);

    // Here you can parse `decodedData` to extract historyId, email, etc.
    // Or trigger fetching latest messages from Gmail API

    res.status(200).send("Webhook received");
  } catch (err) {
    logger.error("❌ Error in Gmail webhook:", err.message);
    res.status(500).send("Internal error");
  }
});

module.exports = router;