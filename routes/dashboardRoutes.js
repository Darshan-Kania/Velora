import { Router } from "express";
import { EmailModel } from "../models/Email.js";
import { UserModel } from "../models/User.js";
import { SummarizedEmailModel } from "../models/summarizedEmail.js";
import { decryptEmails, safeDecrypt } from "../services/dashboardService.js";
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

    // Aggregate emails grouped by threadId and get latest email per thread
    const aggregatedEmails = await EmailModel.aggregate([
      { $match: { user: user._id } },
      { $sort: { createdAt: -1 } }, // Sort by newest first
      {
        $group: {
          _id: "$threadId",
          latestEmail: { $first: "$$ROOT" }, // Keep latest email per thread
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Total number of distinct threads
    const totalThreads = await EmailModel.distinct("threadId", {
      user: user._id,
    });

    // Extract only the latest emails
    let emails = aggregatedEmails.map((e) => e.latestEmail);

    // Decrypt sensitive fields
    emails = await decryptEmails(emails);

    res.json({
      success: true,
      total: totalThreads.length,
      page,
      limit,
      totalPages: Math.ceil(totalThreads.length / limit),
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
    logger.error("❌ Fetch email error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export { router as dashboardRoutes };
