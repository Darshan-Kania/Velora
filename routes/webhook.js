const express = require("express");
const router = express.Router();

router.post("/newEmail", async (req, res) => {
  const pubsubMessage = req.body.message;
  
  if (!pubsubMessage || !pubsubMessage.data) {
    return res.status(400).send("Invalid Pub/Sub message");
  }

  const decoded = Buffer.from(pubsubMessage.data, "base64").toString("utf-8");

  console.log("📨 Gmail Webhook Fired!");
  console.log("🔓 Decoded Data:", decoded); 
  res.status(200).send("Recieved");
});

module.exports = router;
