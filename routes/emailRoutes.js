import { Router } from "express";
import { logger } from "../utils/logger.js";
const router = Router();
import { EmailModel } from "../models/Email.js";
import { UserModel } from "../models/User.js";
import { SummarizedEmailModel } from "../models/summarizedEmail.js";
import { ReplyBackEmailModel } from "../models/replyBackEmail.js";
import { decryptEmails,safeDecrypt } from "../services/dashboardService.js";
import { decryptField } from "../utils/encryptHelper.js";
import { replyToEmail, composeEmail } from "../controllers/emailController.js";
router.get("/", async (req, res) => {
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

// Get sent emails - MUST BE BEFORE /:id route
router.get("/sent", async (req, res) => {
  try {
    logger.info(`📤 Fetching sent emails for user: ${req.user.email}`);
    
    // Resolve user _id from JWT email
    const user = await UserModel.findOne({ email: req.user.email }).select(
      "_id email"
    );
    if (!user) {
      logger.warn(`⚠️ User not found: ${req.user.email}`);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Get query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    logger.info(`🔍 Querying ReplyBackEmailModel for user: ${user._id}`);

    // Fetch sent emails and total count
    let [sentEmails, total] = await Promise.all([
      ReplyBackEmailModel.find({ user: user._id })
        .populate('originalEmail', 'subject gmailMessageId')
        .skip(skip)
        .limit(limit)
        .sort({ sentAt: -1 }), // newest first
      ReplyBackEmailModel.countDocuments({ user: user._id }),
    ]);

    logger.info(`✅ Found ${total} sent emails, returning ${sentEmails.length} for current page`);

    // Decrypt sensitive fields
    sentEmails = sentEmails.map(email => {
      const decrypted = email.toObject();
      if (decrypted.to) decrypted.to = decryptField(decrypted.to);
      if (decrypted.cc) decrypted.cc = decryptField(decrypted.cc);
      if (decrypted.bcc) decrypted.bcc = decryptField(decrypted.bcc);
      if (decrypted.subject) decrypted.subject = decryptField(decrypted.subject);
      if (decrypted.body) decrypted.body = decryptField(decrypted.body);
      return decrypted;
    });

    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: sentEmails,
    });
  } catch (err) {
    logger.error('❌ Fetch sent emails error:', err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
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

// Mark email as important/unimportant
router.patch("/:id/important", async (req, res) => {
  try {
    const emailId = req.params.id;
    const { important } = req.body;

    // Resolve user _id from JWT email
    const user = await UserModel.findOne({ email: req.user.email }).select("_id email");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update email important status
    const email = await EmailModel.findOneAndUpdate(
      { _id: emailId, user: user._id },
      { $set: { important: important === true } },
      { new: true }
    );

    if (!email) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    logger.info(`✅ Email ${emailId} marked as ${important ? 'important' : 'not important'}`);

    res.json({
      success: true,
      message: `Email marked as ${important ? 'important' : 'not important'}`,
      data: { important: email.important }
    });
  } catch (err) {
    logger.error('❌ Mark important error:', err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Reply to an email
router.post("/:id/reply", replyToEmail);

// Compose and send new email
router.post("/compose", composeEmail);

export { router as emailRoutes };
