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
router.get("/emails", async (req, res) => {
  try {
    // Resolve user _id from JWT email
    const user = await UserModel.findOne({ email: req.user.email }).select(
      "_id email"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Get query params (defaults if not provided)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch emails and total count
    let [emails, total] = await Promise.all([
      EmailModel.find({ user: user._id })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }), // newest first
      EmailModel.countDocuments({ user: user._id }),
    ]);
    // Decrypt sensitive fields
    emails = await decryptEmails(emails);
    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: emails,
    });
  } catch (err) {
    console.error("❌ Pagination error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/email/:id", async (req, res) => {
  try {
    const emailId = req.params.id;
    // Resolve user _id from JWT email
    const user = await UserModel.findOne({ email: req.user.email }).select(
      "_id email"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Fetch email by ID
    const email = await EmailModel.findOne({ _id: emailId, user: user._id });
    if (!email) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }

    // Get summary (stored separately), if any
    const summaryDoc = await SummarizedEmailModel.findOne({
      gmailMessageId: email.gmailMessageId,
    });

    // Decrypt sensitive fields (returns an array)
    const [decryptedEmail] = await decryptEmails([email]);

    if (summaryDoc?.summary) {
      summaryDoc.summary = summaryDoc.summary
        ? safeDecrypt(summaryDoc.summary)
        : summaryDoc.summary;
      decryptedEmail.summary = summaryDoc.summary;
    }
    res.json({
      success: true,
      data: decryptedEmail,
    });
  } catch (err) {
    logger.error('❌ Fetch email error:', err);
    res.status(500).json({ success: false, message: "Server error" });
  }
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

export { router as dashboardRoutes };
