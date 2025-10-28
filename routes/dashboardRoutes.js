import { Router } from "express";
import { EmailModel } from "../models/Email.js";
import { UserModel } from "../models/User.js";
import { UserConfigModel } from "../models/UserConfig.js";
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

// Get user's email filters
router.get("/filters", async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.user.email }).select("_id email");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userConfig = await UserConfigModel.findOne({ user: user._id });
    if (!userConfig) {
      return res.json({
        success: true,
        data: { emailFilters: [] }
      });
    }

    res.json({
      success: true,
      data: { emailFilters: userConfig.excludedEmailsToSummarize || [] }
    });
  } catch (err) {
    logger.error("❌ Get filters error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update user's email filters
router.post("/updateFilters", async (req, res) => {
  try {
    const { emailFilters } = req.body;
    
    if (!Array.isArray(emailFilters)) {
      return res.status(400).json({ 
        success: false, 
        message: "emailFilters must be an array" 
      });
    }

    const user = await UserModel.findOne({ email: req.user.email }).select("_id email");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update or create user config
    const userConfig = await UserConfigModel.findOneAndUpdate(
      { user: user._id },
      { 
        $set: { 
          excludedEmailsToSummarize: emailFilters.map(email => email.toLowerCase().trim())
        } 
      },
      { new: true, upsert: true }
    );

    logger.info(`✅ Updated email filters for ${user.email}`, { 
      filters: emailFilters 
    });

    res.json({
      success: true,
      message: "Email filters updated successfully",
      data: { emailFilters: userConfig.excludedEmailsToSummarize }
    });
  } catch (err) {
    logger.error("❌ Update filters error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export { router as dashboardRoutes };
