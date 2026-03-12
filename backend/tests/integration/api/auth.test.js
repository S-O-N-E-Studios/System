const request = require('supertest');
const app = require('../../../src/app');

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/login', () => {
    test('should successfully login with email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tokens');
    });

    test('should return user email in response', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com' });

      expect(res.body.data.user).toHaveProperty('email');
      expect(res.body.data.user.email).toBe('user@test.com');
    });

    test('should return access and refresh tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
    });
  });

  describe('POST /api/auth/register-org', () => {
    test('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register-org')
        .send({ orgName: 'Test Org' });

      expect(res.status).toBe(400);
    });

    test('should return error message when fields missing', async () => {
      const res = await request(app)
        .post('/api/auth/register-org')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/auth/check-slug/:slug', () => {
    test('should check if slug is available', async () => {
      const res = await request(app)
        .get('/api/auth/check-slug/test-org');

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should handle refresh token request', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'demo-refresh-token' });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return current user info', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });
  });
});
