import { decryptField } from "../utils/encryptHelper.js";

async function decryptEmails(emails) {
  return Promise.all(
    emails.map(async (email) => {
      const e = email.toObject ? email.toObject() : { ...email };
      // Decrypt only fields we actually encrypt
      e.from = e.from ? decryptField(e.from) : e.from;
      e.to = e.to ? decryptField(e.to) : e.to;
      e.subject = e.subject ? decryptField(e.subject) : e.subject;
      e.snippet = e.snippet ? decryptField(e.snippet) : e.snippet;
      e.bodyPlain = e.bodyPlain ? decryptField(e.bodyPlain) : e.bodyPlain;
      e.bodyHtml = e.bodyHtml ? decryptField(e.bodyHtml) : e.bodyHtml;
      return e;
    })
  );
}

export { decryptEmails };
