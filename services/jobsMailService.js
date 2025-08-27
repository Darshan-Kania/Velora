import { EmailModel } from "../models/Email.js";
import { decryptField } from "../utils/encryptHelper.js";
import { logger } from "../utils/logger.js";
// import "dotenv/config";
async function fetchPendingMails() {
  // Implementation for fetching pending mails
  const pendingMails = await EmailModel.find({ toSummarize: true, isSummarized: false });
  logger.info(`Fetched ${pendingMails.length} pending mails for summarization.`);
  return pendingMails;
}
async function summarizeMails(pendingMails) {
  // Implementation for summarizing mails
  const decryptedMails = pendingMails.map(decryptMailContent);
  // Call N8N for the whole array of decrypted mails
  const res = await fetch(`${process.env.N8N_BASE_URL}/mail-summarizer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mails: decryptedMails }),
  });
  return res;
}
async function storeSummarizedMails(summarizedMails) {
  // Implementation for storing summarized mails
  for (const mail of summarizedMails.body) {
    await EmailModel.updateOne(
      { gmailMessageId: mail.gmailMessageId },
      {
        $set: {
          isSummarized: true,
        },
      }
    );

  }
}
async function decryptMailContent(mail) {
  const { gmailMessageId, from, subject, snippet, bodyPlain, bodyHtml } = mail;
  return {
    gmailMessageId: gmailMessageId,
    from: decryptField(from),
    subject: decryptField(subject),
    bodyPlain: decryptField(bodyPlain),
    bodyHtml: decryptField(bodyHtml),
    snippet: decryptField(snippet),
  };
}
export { fetchPendingMails, summarizeMails, storeSummarizedMails };
