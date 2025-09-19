import { Router } from "express";
import { EmailModel } from "../models/Email.js";
import { UserModel } from "../models/User.js";
import { SummarizedEmailModel } from "../models/summarizedEmail.js";
import { decryptEmails,safeDecrypt } from "../services/dashboardService.js";
import { logger } from "../utils/logger.js";
const router = Router();

// Define your dashboard routes here
router.get("/", (req, res) => {
  res.status(200).send(`Welcome to your dashboard, ${req.user.email}`);
});

router.get("/userProfile", async (req, res) => {
  try {
    // Fetch user profile
    const user = await UserModel.findOne({ email: req.user.email }).select(
      "-__v -createdAt -updatedAt -_id"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    logger.error("❌ Fetch user profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/EmailCount", async (req, res) => {
  try {
    // Resolve user _id from JWT email
    const user = await UserModel.findOne({ email: req.user.email }).select("_id email");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If label=unread, count only unread emails
    let filter = { user: user._id };
    if (req.query.label === "unread") {
      filter["isRead"] = false;
    }
    else if(req.query.label=="today")
    {
      // IST timezone
      const istOffset = 5.5 * 60; // IST is UTC+5:30
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istNow = new Date(utc + istOffset * 60000);
      const startOfDay = new Date(istNow);
      startOfDay.setHours(0, 0, 0, 0);
      // Convert back to UTC for querying
      const startOfDayUTC = new Date(startOfDay.getTime() - istOffset * 60000);
      filter["createdAt"] = { $gte: startOfDayUTC };
    }
    const count = await EmailModel.countDocuments(filter);
    res.json({ success: true, count });
  } catch (err) {
    logger.error("❌ Email count error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/topContacts", async (req, res) => {
  res.status(200).send("Top contacts endpoint - to be implemented");
}); 
router.get("/activity", async (req, res) => {
  res.status(200).send("To be implemented");
});
export { router as dashboardRoutes };
