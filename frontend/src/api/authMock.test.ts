import { describe, expect, it } from 'vitest';
import { authMock } from './authMock';

describe('authMock', () => {
  describe('login', () => {
    it('returns user and tokens', async () => {
      const result = await authMock.login({ email: 'test@example.com', password: 'pass123' });
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toContain('mock-access-');
      expect(result.tokens.refreshToken).toContain('mock-refresh-');
    });

    it('returns user with provided email', async () => {
      const result = await authMock.login({ email: 'custom@test.com', password: 'pass' });
      expect(result.user.email).toBe('custom@test.com');
    });

    it('returns user with tenants', async () => {
      const result = await authMock.login({ email: 'a@b.com', password: 'p' });
      expect(result.user.tenants.length).toBeGreaterThan(0);
      expect(result.user.tenants[0]).toHaveProperty('id');
      expect(result.user.tenants[0]).toHaveProperty('slug');
      expect(result.user.tenants[0]).toHaveProperty('name');
      expect(result.user.tenants[0]).toHaveProperty('role');
    });
  });

  describe('registerOrg', () => {
    const regData = {
      orgName: 'Test Corp',
      slug: 'test-corp',
      industryType: 'construction',
      primaryContactName: 'John',
      primaryContactEmail: 'john@test.com',
      adminFirstName: 'Jane',
      adminLastName: 'Doe',
      adminEmail: 'jane@test.com',
      adminPassword: 'secure123',
    };

    it('returns user and tokens', async () => {
      const result = await authMock.registerOrg(regData);
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
    });

    it('user has admin details from registration', async () => {
      const result = await authMock.registerOrg(regData);
      expect(result.user.firstName).toBe('Jane');
      expect(result.user.lastName).toBe('Doe');
      expect(result.user.email).toBe('jane@test.com');
    });

    it('user tenant matches org from registration', async () => {
      const result = await authMock.registerOrg(regData);
      expect(result.user.tenants).toHaveLength(1);
      expect(result.user.tenants[0].name).toBe('Test Corp');
      expect(result.user.tenants[0].slug).toBe('test-corp');
    });

    it('user role is ORG_ADMIN', async () => {
      const result = await authMock.registerOrg(regData);
      expect(result.user.role).toBe('ORG_ADMIN');
    });
  });

  describe('checkSlug', () => {
    it('returns available for unique slug', async () => {
      const result = await authMock.checkSlug('unique-org');
      expect(result.available).toBe(true);
      expect(result.suggestion).toBeUndefined();
    });

    it('returns unavailable for taken slug "demo"', async () => {
      const result = await authMock.checkSlug('demo');
      expect(result.available).toBe(false);
      expect(result.suggestion).toBe('demo-1');
    });

    it('returns unavailable for "test"', async () => {
      const result = await authMock.checkSlug('test');
      expect(result.available).toBe(false);
    });

    it('returns unavailable for "sone"', async () => {
      const result = await authMock.checkSlug('sone');
      expect(result.available).toBe(false);
    });

    it('is case-insensitive', async () => {
      const result = await authMock.checkSlug('DEMO');
      expect(result.available).toBe(false);
    });
  });

  describe('acceptInvite', () => {
    it('returns user and tokens', async () => {
      const result = await authMock.acceptInvite('invite-token', 'newpass123');
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.user.email).toBe('invite@example.com');
    });
  });

  describe('changePassword', () => {
    it('resolves without error', async () => {
      await expect(authMock.changePassword()).resolves.toBeUndefined();
    });
  });

  describe('refreshToken', () => {
    it('returns new tokens', async () => {
      const tokens = await authMock.refreshToken();
      expect(tokens.accessToken).toContain('mock-access-');
      expect(tokens.refreshToken).toContain('mock-refresh-');
    });

    it('returns different tokens on subsequent calls', async () => {
      const tokens1 = await authMock.refreshToken();
      await new Promise((r) => setTimeout(r, 10));
      const tokens2 = await authMock.refreshToken();
      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
    });
  });

  describe('getMe', () => {
    it('returns demo user', async () => {
      const user = await authMock.getMe();
      expect(user.email).toBe('demo@example.com');
      expect(user.firstName).toBe('Demo');
      expect(user.lastName).toBe('User');
      expect(user.tenants.length).toBeGreaterThan(0);
    });
  });
});
