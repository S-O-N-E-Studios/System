/**
 * Mock auth implementation so the app works without the backend until the DB is set up.
 * Enable real API by setting VITE_USE_MOCK_AUTH=false in .env
 */

import type { User, AuthTokens } from '@/types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mockTokens(): AuthTokens {
  const base = Date.now().toString(36);
  return {
    accessToken: `mock-access-${base}`,
    refreshToken: `mock-refresh-${base}`,
  };
}

function mockUserFromRegister(data: {
  orgName: string;
  slug: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
}): User {
  const tenantId = `tenant-${Date.now().toString(36)}`;
  return {
    id: `user-${Date.now().toString(36)}`,
    email: data.adminEmail,
    firstName: data.adminFirstName,
    lastName: data.adminLastName,
    role: 'ORG_ADMIN',
    tenants: [
      {
        id: tenantId,
        slug: data.slug,
        name: data.orgName,
        role: 'ORG_ADMIN',
      },
    ],
  };
}

function mockDemoUser(email: string): User {
  return {
    id: 'mock-user',
    email,
    firstName: 'Demo',
    lastName: 'User',
    role: 'ORG_ADMIN',
    tenants: [
      { id: 't1', slug: 'limpopo-civil', name: 'Limpopo Civil Engineering', role: 'ORG_ADMIN' },
      { id: 't2', slug: 'gauteng-structures', name: 'Gauteng Structures Corp', role: 'PROJECT_MANAGER' },
    ],
  };
}

export interface MockLoginRequest {
  email: string;
  password: string;
}

export interface MockRegisterOrgRequest {
  orgName: string;
  slug: string;
  orgType: 'provincial_gov' | 'private_firm';
  industryType: string;
  primaryContactName: string;
  primaryContactEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
}

export const authMock = {
  login: async (data: MockLoginRequest): Promise<{ user: User; tokens: AuthTokens }> => {
    await delay(400);
    const user = mockDemoUser(data.email || 'demo@example.com');
    return { user, tokens: mockTokens() };
  },

  registerOrg: async (data: MockRegisterOrgRequest): Promise<{ user: User; tokens: AuthTokens }> => {
    await delay(500);
    const user = mockUserFromRegister({
      orgName: data.orgName,
      slug: data.slug,
      adminFirstName: data.adminFirstName,
      adminLastName: data.adminLastName,
      adminEmail: data.adminEmail,
    });
    return { user, tokens: mockTokens() };
  },

  checkSlug: async (slug: string): Promise<{ available: boolean; suggestion?: string }> => {
    await delay(200);
    const taken = ['demo', 'test', 'project360', 'project-360'];
    const available = !taken.includes(String(slug).toLowerCase());
    return { available, suggestion: available ? undefined : `${slug}-1` };
  },

  acceptInvite: async (token: string, password: string): Promise<{ user: User; tokens: AuthTokens }> => {
    // Parameters are intentionally unused in the mock but referenced to satisfy lint rules.
    void token;
    void password;
    await delay(400);
    const user = mockDemoUser('invite@example.com');
    return { user, tokens: mockTokens() };
  },

  changePassword: async (): Promise<void> => {
    await delay(300);
  },

  refreshToken: async (): Promise<AuthTokens> => {
    await delay(100);
    return mockTokens();
  },

  getMe: async (): Promise<User> => {
    await delay(150);
    return mockDemoUser('demo@example.com');
  },
};
