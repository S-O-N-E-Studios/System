const { encryptTenantSmtpPassword, decryptTenantSmtpPassword } = require('../src/utils/tenantSmtpCrypto');

describe('tenantSmtpCrypto', () => {
  const prev = process.env.TENANT_SMTP_ENCRYPTION_KEY;

  afterAll(() => {
    process.env.TENANT_SMTP_ENCRYPTION_KEY = prev;
  });

  it('round-trips a password when key is set', () => {
    process.env.TENANT_SMTP_ENCRYPTION_KEY = 'unit-test-key-at-least-32-chars!!';
    const enc = encryptTenantSmtpPassword('my-smtp-secret');
    expect(enc).toBeTruthy();
    expect(decryptTenantSmtpPassword(enc)).toBe('my-smtp-secret');
  });

  it('returns null for empty encrypt input', () => {
    expect(encryptTenantSmtpPassword('')).toBeNull();
    expect(encryptTenantSmtpPassword(null)).toBeNull();
  });
});
