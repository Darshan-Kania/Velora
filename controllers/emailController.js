import { logger } from "../utils/logger.js";
import { sendReplyEmail, composeAndSendEmail } from "../services/emailService.js";

/**
 * Handle reply to an email
 */
async function replyToEmail(req, res) {
  try {
    const emailId = req.params.id;
    const { body } = req.body;
    const userEmail = req.user.email;

    if (!body || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply body is required",
      });
    }

    logger.info(`📬 Reply request for email ${emailId} by ${userEmail}`);

    const result = await sendReplyEmail(userEmail, emailId, body);

    res.json({
      success: true,
      message: "Reply sent successfully",
      data: result,
    });
  } catch (err) {
    logger.error("❌ Reply controller error:", {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: err.message || "Failed to send reply",
    });
  }
}

/**
 * Handle compose and send new email
 */
async function composeEmail(req, res) {
  try {
    const { to, cc, bcc, subject, body } = req.body;
    const userEmail = req.user.email;

    // Validate required fields
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: to, subject, and body are required",
      });
    }

    logger.info(`📬 Compose email request by ${userEmail}`);

    const result = await composeAndSendEmail(userEmail, {
      to,
      cc,
      bcc,
      subject,
      body,
    });

    res.json({
      success: true,
      message: "Email sent successfully",
      data: result,
    });
  } catch (err) {
    logger.error("❌ Compose controller error:", {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: err.message || "Failed to send email",
    });
  }
}

export { replyToEmail, composeEmail };
