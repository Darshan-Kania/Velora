import { google } from "googleapis";
import { logger } from "../utils/logger.js";
import { UserModel } from "../models/User.js";
import { EmailModel } from "../models/Email.js";
import { ReplyBackEmailModel } from "../models/replyBackEmail.js";
import { encryptField, decryptField } from "../utils/encryptHelper.js";

/**
 * Create OAuth2 client for Gmail API
 */
function createOAuth2Client(accessToken, refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

/**
 * Create email MIME message
 */
function createMimeMessage({ to, cc, bcc, subject, body, inReplyTo, references, threadId }) {
  const messageParts = [];
  
  // Headers
  messageParts.push(`To: ${to}`);
  if (cc) messageParts.push(`Cc: ${cc}`);
  if (bcc) messageParts.push(`Bcc: ${bcc}`);
  messageParts.push(`Subject: ${subject}`);
  messageParts.push("Content-Type: text/html; charset=utf-8");
  messageParts.push("MIME-Version: 1.0");
  
  // For replies, add threading headers
  if (inReplyTo) {
    messageParts.push(`In-Reply-To: ${inReplyTo}`);
  }
  if (references) {
    messageParts.push(`References: ${references}`);
  }
  
  // Empty line before body
  messageParts.push("");
  messageParts.push(body);
  
  const message = messageParts.join("\r\n");
  
  // Encode in base64url format
  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  
  return encodedMessage;
}

/**
 * Send a reply to an existing email
 */
async function sendReplyEmail(userEmail, emailId, replyBody) {
  try {
    logger.info(`📧 Sending reply for email ${emailId} by ${userEmail}`);
    
    // Find user
    const user = await UserModel.findOne({ email: userEmail });
    if (!user) {
      throw new Error("User not found");
    }
    
    // Find original email
    const originalEmail = await EmailModel.findOne({ _id: emailId, user: user._id });
    if (!originalEmail) {
      throw new Error("Original email not found");
    }
    
    // Decrypt original email fields
    const fromEmail = decryptField(originalEmail.from);
    const originalSubject = decryptField(originalEmail.subject);
    
    // Extract email address from "Name <email@example.com>" format
    const toEmail = fromEmail.match(/<(.+?)>/) ? fromEmail.match(/<(.+?)>/)[1] : fromEmail;
    
    // Prepare reply subject
    const replySubject = originalSubject.startsWith("Re: ") 
      ? originalSubject 
      : `Re: ${originalSubject}`;
    
    // Create OAuth2 client
    const oauth2Client = createOAuth2Client(user.accessToken, user.refreshToken);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    
    // Create MIME message with threading headers
    const encodedMessage = createMimeMessage({
      to: toEmail,
      subject: replySubject,
      body: replyBody,
      inReplyTo: originalEmail.gmailMessageId,
      references: originalEmail.gmailMessageId,
      threadId: originalEmail.threadId,
    });
    
    // Send the reply via Gmail API
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        threadId: originalEmail.threadId, // Keep in same thread
      },
    });
    
    logger.info(`✅ Reply sent successfully: ${response.data.id}`);
    
    // Store reply in database
    logger.info(`💾 Storing reply in database for user: ${user._id}`);
    const replyDoc = new ReplyBackEmailModel({
      user: user._id,
      originalEmail: originalEmail._id,
      gmailMessageId: response.data.id,
      threadId: response.data.threadId || originalEmail.threadId,
      to: encryptField(toEmail),
      subject: encryptField(replySubject),
      body: encryptField(replyBody),
      sentAt: new Date(),
      isAIGenerated: false,
    });
    
    await replyDoc.save();
    logger.info(`✅ Reply saved to database with ID: ${replyDoc._id}`);
    
    // Update original email status
    await EmailModel.updateOne(
      { _id: emailId },
      { $set: { isReplyBacked: true } }
    );
    logger.info(`✅ Original email marked as replied`);
    
    return {
      success: true,
      messageId: response.data.id,
      threadId: response.data.threadId,
    };
  } catch (err) {
    logger.error(`❌ Failed to send reply: ${err.message}`, {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

/**
 * Compose and send a new email
 */
async function composeAndSendEmail(userEmail, { to, cc, bcc, subject, body }) {
  try {
    logger.info(`📧 Composing new email by ${userEmail}`);
    
    // Find user
    const user = await UserModel.findOne({ email: userEmail });
    if (!user) {
      throw new Error("User not found");
    }
    
    // Validate required fields
    if (!to || !subject || !body) {
      throw new Error("Missing required fields: to, subject, or body");
    }
    
    // Create OAuth2 client
    const oauth2Client = createOAuth2Client(user.accessToken, user.refreshToken);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    
    // Create MIME message
    const encodedMessage = createMimeMessage({
      to,
      cc,
      bcc,
      subject,
      body,
    });
    
    // Send the email via Gmail API
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    logger.info(`✅ Email sent successfully: ${response.data.id}`);
    
    // Store composed email in database
    logger.info(`💾 Storing composed email in database for user: ${user._id}`);
    const composeDoc = new ReplyBackEmailModel({
      user: user._id,
      originalEmail: null, // No original email for composed messages
      gmailMessageId: response.data.id,
      threadId: response.data.threadId || response.data.id,
      to: encryptField(to),
      cc: cc ? encryptField(cc) : null,
      bcc: bcc ? encryptField(bcc) : null,
      subject: encryptField(subject),
      body: encryptField(body),
      sentAt: new Date(),
      isAIGenerated: false,
    });
    
    await composeDoc.save();
    logger.info(`✅ Composed email saved to database with ID: ${composeDoc._id}`);
    
    return {
      success: true,
      messageId: response.data.id,
      threadId: response.data.threadId,
    };
  } catch (err) {
    logger.error(`❌ Failed to send email: ${err.message}`, {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

export { sendReplyEmail, composeAndSendEmail };
