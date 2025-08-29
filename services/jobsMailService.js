import { EmailModel } from "../models/Email.js";
import { SummarizedEmailModel } from "../models/summarizedEmail.js";
import { decryptField, encryptField } from "../utils/encryptHelper.js";
import { logger } from "../utils/logger.js";
import jwt from "jsonwebtoken";
// import "dotenv/config";
async function fetchPendingMails() {
  // Implementation for fetching pending mails
  try {
    const pendingMails = await EmailModel.find({
      toSummarize: true,
      isSummarized: false,
    });
    logger.info(
      `Fetched ${pendingMails.length} pending mails for summarization.`
    );
    return pendingMails;
  } catch (error) {
    logger.error(`❌ Error fetching pending mails: ${error.message}`);
    return [];
  }
}
async function summarizeMails(pendingMails, chainNo ) {
  // Implementation for summarizing mails
  try {
    const decryptedMails = await Promise.all(
      pendingMails.map(decryptMailContent)
    );
    // Call N8N for the whole array of decrypted mails
    const token = jwt.sign(
      { service: "velora" }, // payload (anything minimal)
      process.env.N8N_JWT_SECRET, // must match secret you set in n8n credential
      { expiresIn: "1h" } // optional
    );
    const res = await fetch(`${process.env.N8N_BASE_URL}/mail-summarizer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 🔑 required for n8n Webhook auth
        "Chain-No": chainNo.toString(), // Custom header to specify chain number
      },
      body: JSON.stringify({ mails: decryptedMails }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      logger.error(
        `❌ N8N API error: ${res.status} ${res.statusText} - ${errorText}`
      );
      return [];
    }
    const summarizedMails = await res.json();
    return summarizedMails;
  } catch (error) {
    logger.error(`❌ Error in summarizeMails: ${error.message}`);
    return [];
  }
}
async function storeSummarizedMails(summarizedMails) {
  // Implementation for storing summarized mails
  try {
    await Promise.all(
      summarizedMails.map(async (mail) => {
        await EmailModel.updateOne(
          { gmailMessageId: mail.gmailMessageId },
          {
            $set: {
              isSummarized: true,
            },
          }
        );
        mail = encryptSummarizedMail(mail);
        await SummarizedEmailModel.updateOne(
          { gmailMessageId: mail.gmailMessageId },
          {
            $set: {
              summary: mail.summary,
              explaination: mail.explaination || "",
            },
          },
          { upsert: true }
        );
      })
    );
  } catch (error) {
    logger.error(`❌ Error storing summarized mails: ${error.message}`);
  }
}
async function decryptMailContent(mail) {
  try {
    const { gmailMessageId, from, subject, snippet, bodyPlain, bodyHtml } =
      mail;
    return {
      gmailMessageId: gmailMessageId,
      from: decryptField(from),
      subject: decryptField(subject),
      bodyPlain: decryptField(bodyPlain),
      bodyHtml: decryptField(bodyHtml),
      snippet: decryptField(snippet),
    };
  } catch (error) {
    logger.error(`❌ Error decrypting mail content: ${error.message}`);
    return null; // Return the original mail if decryption fails
  }
}
function encryptSummarizedMail(mail) {
  try {
    mail.summary = encryptField(mail.summary);
    if (mail.explaination) {
      mail.explaination = encryptField(mail.explaination);
    }
    return mail;
  } catch (error) {
    logger.error(`❌ Error encrypting summarized mail: ${error.message}`);
  }
}
export { fetchPendingMails, summarizeMails, storeSummarizedMails };
