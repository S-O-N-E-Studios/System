const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const IV_LEN = 16;
const TAG_LEN = 16;

const deriveKey = () => {
  const secret =
    process.env.TENANT_SMTP_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'development-only-tenant-smtp-key';
  return crypto.createHash('sha256').update(String(secret), 'utf8').digest();
};

/**
 * Encrypt SMTP password for storage on Tenant.outboundEmail.authPassEncrypted.
 * Set TENANT_SMTP_ENCRYPTION_KEY (32+ random bytes as hex or any string) in production.
 */
const encryptTenantSmtpPassword = (plain) => {
  if (plain == null || plain === '') return null;
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
};

const decryptTenantSmtpPassword = (b64) => {
  if (!b64) return null;
  try {
    const buf = Buffer.from(String(b64), 'base64');
    if (buf.length < IV_LEN + TAG_LEN + 1) return null;
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = buf.subarray(IV_LEN + TAG_LEN);
    const key = deriveKey();
    const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
};

module.exports = {
  encryptTenantSmtpPassword,
  decryptTenantSmtpPassword,
};
