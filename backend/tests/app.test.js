const request = require('supertest');
const app = require('../src/app');

describe('App', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/test returns API message', async () => {
    const res = await request(app).get('/api/v1/test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('API');
  });
});
