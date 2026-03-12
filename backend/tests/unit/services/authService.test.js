const authService = require('../../../src/services/authService');

describe('Auth Service', () => {
  // GENERATE TOKEN
  test('generateToken should be a function', () => {
    expect(typeof authService.generateToken).toBe('function');
  });

  test('generateToken should return a string', () => {
    const token = authService.generateToken();
    expect(typeof token).toBe('string');
  });

  // VERIFY TOKEN
  test('verifyToken should be a function', () => {
    expect(typeof authService.verifyToken).toBe('function');
  });

  test('verifyToken should return an object', () => {
    const result = authService.verifyToken();
    expect(typeof result).toBe('object');
  });

  // VERIFY BOTH FUNCTIONS EXIST
  test('authService should export generateToken and verifyToken', () => {
    expect(authService).toHaveProperty('generateToken');
    expect(authService).toHaveProperty('verifyToken');
  });
});
