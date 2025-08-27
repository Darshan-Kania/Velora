import { log } from "winston";
import { EmailModel } from "../models/Email.js";
import { decryptField } from "../utils/encryptHelper.js";
import { logger } from "../utils/logger.js";
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
async function summarizeMails(pendingMails) {
  // Implementation for summarizing mails
  try {
    const decryptedMails = await Promise.all(
      pendingMails.map(decryptMailContent)
    );
    // Call N8N for the whole array of decrypted mails
    const res = await fetch(`${process.env.N8N_BASE_URL}/mail-summarizer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mails: decryptedMails }),
    });
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
      summarizedMails.map(
        async (mail) =>
          await EmailModel.updateOne(
            { gmailMessageId: mail.gmailMessageId },
            {
              $set: {
                isSummarized: true,
                summarizedSubject: mail.summarizedSubject,
                summarizedBody: mail.summarizedBody,
                summarizedSnippet: mail.summarizedSnippet,
              },
            }
          )
      )
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
    return mail; // Return the original mail if decryption fails
  }
}
export { fetchPendingMails, summarizeMails, storeSummarizedMails };
