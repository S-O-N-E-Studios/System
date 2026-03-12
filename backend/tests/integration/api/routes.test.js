const request = require('supertest');
const app = require('../../../src/app');

describe('API Routes Integration Tests', () => {
  describe('Health Check Endpoints', () => {
    test('GET /health should return 200 with success message', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success');
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Server is running');
    });

    test('GET /health response should have timestamp', async () => {
      const res = await request(app).get('/health');

      expect(res.body).toHaveProperty('timestamp');
      expect(typeof res.body.timestamp).toBe('string');
    });
  });

  describe('API Test Endpoint', () => {
    test('GET /api/test should return 200 with API message', async () => {
      const res = await request(app).get('/api/test');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success');
      expect(res.body.success).toBe(true);
    });

    test('GET /api/test should return version info', async () => {
      const res = await request(app).get('/api/test');

      expect(res.body).toHaveProperty('version');
      expect(res.body.version).toBe('1.0.0');
    });

    test('GET /api/test should return message containing API', async () => {
      const res = await request(app).get('/api/test');

      expect(res.body.message).toContain('API');
    });
  });

  describe('CORS Configuration', () => {
    test('should include CORS headers in response', async () => {
      const res = await request(app).get('/health');

      expect(res.header['access-control-allow-origin']).toBeDefined();
    });

    test('should allow credentials in CORS headers', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(res.header['access-control-allow-credentials']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    test('should include Content-Security-Policy header', async () => {
      const res = await request(app).get('/health');

      expect(res.header['content-security-policy']).toBeDefined();
    });

    test('should include X-Content-Type-Options header', async () => {
      const res = await request(app).get('/health');

      expect(res.header['x-content-type-options']).toBeDefined();
    });

    test('should include X-Frame-Options header', async () => {
      const res = await request(app).get('/health');

      expect(res.header['x-frame-options']).toBeDefined();
    });
  });

  describe('Response Compression', () => {
    test('response should have proper content type', async () => {
      const res = await request(app).get('/api/test');

      expect(res.header['content-type']).toContain('application/json');
    });
  });

  describe('Invalid Routes', () => {
    test('should return 404 for non-existent route', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.status).toBe(404);
    });
  });
});
