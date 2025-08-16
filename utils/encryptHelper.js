import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY = crypto.randomBytes(32); // Load from secrets manager

export function encryptField(value) {
  if (!value) return null;

  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine IV + AuthTag + Ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decryptField(encryptedBase64) {
  if (!encryptedBase64) return null;

  const data = Buffer.from(encryptedBase64, 'base64');

  const iv = data.slice(0, 12);             // First 12 bytes → IV
  const authTag = data.slice(12, 28);       // Next 16 bytes → Auth Tag
  const encrypted = data.slice(28);         // Remaining → Ciphertext

  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
