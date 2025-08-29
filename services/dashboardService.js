import { decryptField } from "../utils/encryptHelper.js";

function safeDecrypt(value) {
  if (!value) return value;
  try {
    return decryptField(value);
  } catch (e) {
    return value;
  }
}

async function decryptEmails(emails) {
  return Promise.all(
    emails.map(async (email) => {
      const e = email.toObject ? email.toObject() : { ...email };
      // Decrypt only fields we actually encrypt, safely
      e.from = safeDecrypt(e.from);
      e.to = safeDecrypt(e.to);
      e.subject = safeDecrypt(e.subject);
      e.snippet = safeDecrypt(e.snippet);
      e.bodyPlain = safeDecrypt(e.bodyPlain);
      e.bodyHtml = safeDecrypt(e.bodyHtml);
      // Do not decrypt e.summary here; summaries are stored separately and not encrypted
      return e;
    })
  );
}

export { decryptEmails , safeDecrypt };
