const request = require('supertest');
const app = require('../src/app');

describe('App', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/test returns API message', async () => {
    const res = await request(app).get('/api/test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('API');
  });
});

describe('Auth', () => {
  it('POST /api/auth/login rejects missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email.*password/i);
  });

  it('POST /api/auth/login rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'short' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login returns user and tokens for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });

  it('POST /api/auth/register-org rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register-org').send({ orgName: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/missing required/i);
  });

  it('POST /api/auth/register-org returns 201 with valid data', async () => {
    const res = await request(app).post('/api/auth/register-org').send({
      orgName: 'Test Corp',
      slug: 'test-corp',
      adminFirstName: 'Jane',
      adminLastName: 'Doe',
      adminEmail: 'jane@test.com',
      adminPassword: 'secure123',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('jane@test.com');
    expect(res.body.data.tokens).toBeDefined();
  });

  it('POST /api/auth/refresh returns new tokens', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'old-token' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('GET /api/auth/me returns demo user', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBeDefined();
    expect(res.body.data.tenants.length).toBeGreaterThan(0);
  });
});
