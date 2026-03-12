const emailService = require('../../../src/services/emailService');

describe('Email Service', () => {
  // SEND METHOD
  test('send should be a function', () => {
    expect(typeof emailService.send).toBe('function');
  });

  test('send should be an async function', () => {
    const result = emailService.send();
    expect(result instanceof Promise).toBe(true);
  });

  test('send should resolve', async () => {
    const result = await emailService.send();
    expect(result).toBeUndefined();
  });

  // VERIFY SEND FUNCTION EXISTS
  test('emailService should export send', () => {
    expect(emailService).toHaveProperty('send');
  });
});
