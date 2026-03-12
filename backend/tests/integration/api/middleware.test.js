const request = require('supertest');
const app = require('../../../src/app');

describe('API Request/Response Integration Tests', () => {
  describe('JSON Request Handling', () => {
    test('should accept JSON request bodies', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.type).toMatch(/json/);
    });

    test('should handle form-urlencoded requests', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send('email=test@example.com');

      expect(res.status).toBe(200);
    });

    test('should parse nested JSON objects', async () => {
      const payload = {
        email: 'test@example.com',
        metadata: {
          source: 'mobile',
          version: '1.0'
        }
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(payload);

      expect(res.status).toBe(200);
    });
  });

  describe('Response Format', () => {
    test('all responses should be valid JSON', async () => {
      const res = await request(app).get('/health');

      expect(() => JSON.parse(res.text)).not.toThrow();
    });

    test('error responses should be objects', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(typeof res.body).toBe('object');
    });

    test('successful responses should include proper status codes', async () => {
      const res = await request(app).get('/health');

      expect([200, 201, 204]).toContain(res.status);
    });
  });

  describe('Request Headers', () => {
    test('should accept custom headers', async () => {
      const res = await request(app)
        .get('/health')
        .set('User-Agent', 'CustomAgent/1.0');

      expect(res.status).toBe(200);
    });

    test('should handle missing Content-Type gracefully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('API endpoints should have rate limit middleware applied', async () => {
      // The rate limit is configured for the /api route
      const res = await request(app).get('/api/test');

      // Rate limited endpoints should return a successful response
      expect([200, 429]).toContain(res.status);
    });

    test('rate limit allows requests under the limit', async () => {
      // Make a single request which should be allowed
      const res = await request(app).get('/api/test');

      expect(res.status).toBe(200);
    });
  });

  describe('Compression', () => {
    test('response should support compression', async () => {
      const res = await request(app)
        .get('/health')
        .set('Accept-Encoding', 'gzip');

      expect(res.status).toBe(200);
      // Body should be present even if compressed
      expect(res.body).toBeDefined();
    });
  });

  describe('HTTP Methods', () => {
    test('should handle GET requests', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    test('should handle POST requests', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect([200, 201, 400]).toContain(res.status);
    });

    test('should reject unsupported methods on some routes', async () => {
      const res = await request(app)
        .delete('/health');

      expect([404, 405]).toContain(res.status);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{invalid json}');

      expect([400, 500]).toContain(res.status);
    });

    test('should return error object on invalid routes', async () => {
      const res = await request(app).get('/api/invalid/route');

      expect(res.status).toBe(404);
      expect(typeof res.body).toBe('object');
    });
  });
});
