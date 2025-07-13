const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");
router.post("/newEmail", async (req, res) => {
  const pubsubMessage = req.body.message;
  
  if (!pubsubMessage || !pubsubMessage.data) {
    return res.status(400).send("Invalid Pub/Sub message");
  }

  const decoded = Buffer.from(pubsubMessage.data, "base64").toString("utf-8");

  logger.info("📨 Gmail Webhook Fired!");
  logger.info("🔓 Decoded Data:", decoded);
  res.status(200).send("Recieved");
});

module.exports = router;
