/**
 * Integration tests: Authentication
 * Tests login, register, change-password, client activation
 */

require('../setup');
const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const TemporaryAccess = require('../../src/models/TemporaryAccess');
const crypto = require('crypto');
const { createTenantWithAdmin } = require('../helpers/fixtures');

describe('Auth Endpoints', () => {

  // ─── POST /auth/register-org ──────────────────────────────────────────────
  describe('POST /api/v1/auth/register-org', () => {
    const validPayload = {
      orgName: 'Nkangala District Municipality',
      orgSlug: 'nkangala-district',
      orgType: 'provincial_gov',
      adminEmail: 'admin@nkangala.gov.za',
      adminName: 'Thato Nkosi',
      adminPassword: 'SecurePass1!',
      localMunicipalities: ['Victor Khanye', 'Emalahleni', 'Steve Tshwete'],
    };

    it('creates tenant + admin user and returns accessToken', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-org')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.tenant.slug).toBe('nkangala-district');
      expect(res.body.tenant.orgType).toBe('provincial_gov');
    });

    it('returns 409 when slug already taken', async () => {
      await request(app).post('/api/v1/auth/register-org').send(validPayload);
      const res = await request(app).post('/api/v1/auth/register-org').send(validPayload);

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/slug/i);
    });

    it('returns 400 when orgType is missing', async () => {
      const { orgType, ...noType } = validPayload;
      const res = await request(app).post('/api/v1/auth/register-org').send(noType);
      expect(res.status).toBe(400);
    });

    it('returns 400 when provincial_gov has no localMunicipalities', async () => {
      const { localMunicipalities, ...noMunis } = validPayload;
      const res = await request(app).post('/api/v1/auth/register-org').send(noMunis);
      expect(res.status).toBe(400);
    });
  });

  // ─── POST /auth/login ─────────────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await createTenantWithAdmin({ adminEmail: 'admin@login-test.co.za' });
    });

    it('returns accessToken on valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@login-test.co.za', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('admin@login-test.co.za');
    });

    it('returns 401 on wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@login-test.co.za', password: 'WrongPassword1' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('returns 401 on unknown email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.co.za', password: 'Password123!' });

      expect(res.status).toBe(401);
    });

    it('does not return passwordHash in response', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@login-test.co.za', password: 'Password123!' });

      expect(res.body.user.passwordHash).toBeUndefined();
    });
  });

  // ─── GET /auth/check-slug ─────────────────────────────────────────────────
  describe('GET /api/v1/auth/check-slug/:slug', () => {
    it('returns available: true for unused slug', async () => {
      const res = await request(app).get('/api/v1/auth/check-slug/brand-new-slug');
      expect(res.status).toBe(200);
      expect(res.body.available).toBe(true);
    });

    it('returns available: false for existing slug', async () => {
      await createTenantWithAdmin({ slug: 'taken-slug' });
      const res = await request(app).get('/api/v1/auth/check-slug/taken-slug');
      expect(res.body.available).toBe(false);
    });
  });

  // ─── POST /auth/client-activate ───────────────────────────────────────────
  describe('POST /api/v1/auth/client-activate/:token', () => {
    let rawToken, tenant;

    beforeEach(async () => {
      ({ tenant } = await createTenantWithAdmin({ slug: 'client-act-org' }));
      rawToken = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await TemporaryAccess.create({
        tenantId: tenant._id,
        grantedBy: User.findOne()._id || new mongoose.Types.ObjectId(),
        clientEmail: 'client@external.co.za',
        projectIds: [],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'pending',
        activationTokenHash: hash,
        activationTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });

    it('activates account and returns accessToken on valid token', async () => {
      const res = await request(app)
        .post(`/api/v1/auth/client-activate/${rawToken}`)
        .send({ password: 'ClientPass1!' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('returns 400 on expired/invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/client-activate/invalidtoken')
        .send({ password: 'ClientPass1!' });

      expect(res.status).toBe(400);
    });

    it('returns 400 if password is too short', async () => {
      const res = await request(app)
        .post(`/api/v1/auth/client-activate/${rawToken}`)
        .send({ password: 'short' });

      expect(res.status).toBe(400);
    });
  });
});
