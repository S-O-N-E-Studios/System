import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  registerOrgSchema,
  projectSchema,
  changePasswordSchema,
} from './index';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email');
    }
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects short password (< 8 chars)', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password');
    }
  });

  it('accepts exactly 8 character password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '12345678' });
    expect(result.success).toBe(true);
  });

  it('rejects missing fields', () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('registerOrgSchema', () => {
  const validData = {
    orgName: 'Limpopo Civil',
    slug: 'limpopo-civil',
    industryType: 'construction',
    primaryContactName: 'John Doe',
    primaryContactEmail: 'john@example.com',
    adminFirstName: 'Jane',
    adminLastName: 'Smith',
    adminEmail: 'jane@example.com',
    adminPassword: 'secure1234',
    adminPasswordConfirm: 'secure1234',
    agreeToTerms: true,
  };

  it('accepts valid registration data', () => {
    const result = registerOrgSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects when orgName is too short', () => {
    const result = registerOrgSchema.safeParse({ ...validData, orgName: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase characters', () => {
    const result = registerOrgSchema.safeParse({ ...validData, slug: 'My-Org' });
    expect(result.success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    const result = registerOrgSchema.safeParse({ ...validData, slug: 'my org' });
    expect(result.success).toBe(false);
  });

  it('rejects slug shorter than 3 characters', () => {
    const result = registerOrgSchema.safeParse({ ...validData, slug: 'ab' });
    expect(result.success).toBe(false);
  });

  it('rejects slug longer than 30 characters', () => {
    const result = registerOrgSchema.safeParse({ ...validData, slug: 'a'.repeat(31) });
    expect(result.success).toBe(false);
  });

  it('accepts slug with hyphens and numbers', () => {
    const result = registerOrgSchema.safeParse({ ...validData, slug: 'my-org-123' });
    expect(result.success).toBe(true);
  });

  it('rejects password mismatch', () => {
    const result = registerOrgSchema.safeParse({
      ...validData,
      adminPassword: 'password1',
      adminPasswordConfirm: 'password2',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('adminPasswordConfirm');
    }
  });

  it('rejects when agreeToTerms is false', () => {
    const result = registerOrgSchema.safeParse({ ...validData, agreeToTerms: false });
    expect(result.success).toBe(false);
  });

  it('rejects invalid admin email', () => {
    const result = registerOrgSchema.safeParse({ ...validData, adminEmail: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid primary contact email', () => {
    const result = registerOrgSchema.safeParse({ ...validData, primaryContactEmail: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects short admin password', () => {
    const result = registerOrgSchema.safeParse({
      ...validData,
      adminPassword: '123',
      adminPasswordConfirm: '123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing industryType', () => {
    const result = registerOrgSchema.safeParse({ ...validData, industryType: '' });
    expect(result.success).toBe(false);
  });
});

describe('projectSchema', () => {
  const validProject = {
    name: 'Water Treatment Phase 1',
    contractValue: 5_000_000,
    status: 'active',
  };

  it('accepts valid project data', () => {
    const result = projectSchema.safeParse(validProject);
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 3 characters', () => {
    const result = projectSchema.safeParse({ ...validProject, name: 'ab' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 200 characters', () => {
    const result = projectSchema.safeParse({ ...validProject, name: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects zero contract value', () => {
    const result = projectSchema.safeParse({ ...validProject, contractValue: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative contract value', () => {
    const result = projectSchema.safeParse({ ...validProject, contractValue: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects empty status', () => {
    const result = projectSchema.safeParse({ ...validProject, status: '' });
    expect(result.success).toBe(false);
  });

  it('accepts optional GPS coordinates', () => {
    const result = projectSchema.safeParse({
      ...validProject,
      gpsLatitude: -23.9,
      gpsLongitude: 29.45,
    });
    expect(result.success).toBe(true);
  });

  it('rejects latitude out of range', () => {
    const result = projectSchema.safeParse({ ...validProject, gpsLatitude: -91 });
    expect(result.success).toBe(false);
  });

  it('rejects longitude out of range', () => {
    const result = projectSchema.safeParse({ ...validProject, gpsLongitude: 181 });
    expect(result.success).toBe(false);
  });

  it('accepts null GPS coordinates', () => {
    const result = projectSchema.safeParse({
      ...validProject,
      gpsLatitude: null,
      gpsLongitude: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('changePasswordSchema', () => {
  const validData = {
    currentPassword: 'oldpassword1',
    newPassword: 'newpassword1',
    confirmPassword: 'newpassword1',
  };

  it('accepts valid password change', () => {
    const result = changePasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects empty current password', () => {
    const result = changePasswordSchema.safeParse({ ...validData, currentPassword: '' });
    expect(result.success).toBe(false);
  });

  it('rejects short new password', () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password mismatch', () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      confirmPassword: 'different123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('confirmPassword');
    }
  });
});
