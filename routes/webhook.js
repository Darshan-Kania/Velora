const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");

router.post("/newEmail", async (req, res) => {
  const pubsubMessage = req.body.message;

  if (!pubsubMessage || !pubsubMessage.data) {
    logger.error("❌ Invalid Pub/Sub message format", req.body);
    return res.status(400).send("Invalid Pub/Sub message");
  }

  let decodedData;
  try {
    decodedData = JSON.parse(Buffer.from(pubsubMessage.data, "base64").toString("utf-8"));
  } catch (err) {
    logger.error("❌ Failed to decode or parse message data:", err);
    return res.status(200).send("Invalid JSON in data");
  }

  logger.info("📨 Gmail Webhook Fired!");
  logger.info("🔓 Decoded Data:", decodedData);

  // TODO: Use decodedData.historyId to fetch updated emails from Gmail

  res.status(200).send("Received");
});

module.exports = router;
