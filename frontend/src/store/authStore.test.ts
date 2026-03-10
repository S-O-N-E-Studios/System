import { describe, expect, it, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { User, AuthTokens } from '@/types';

const mockUser: User = {
  id: 'u1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'ORG_ADMIN',
  tenants: [
    { id: 't1', slug: 'test-org', name: 'Test Org', role: 'ORG_ADMIN' },
    { id: 't2', slug: 'other-org', name: 'Other Org', role: 'MEMBER' },
  ],
};

const mockTokens: AuthTokens = {
  accessToken: 'access-abc',
  refreshToken: 'refresh-xyz',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  it('login sets user, tokens, and isAuthenticated', () => {
    useAuthStore.getState().login(mockUser, mockTokens);
    const state = useAuthStore.getState();

    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe('access-abc');
    expect(state.refreshToken).toBe('refresh-xyz');
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('logout clears everything', () => {
    useAuthStore.getState().login(mockUser, mockTokens);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('setUser updates user without changing tokens', () => {
    useAuthStore.getState().login(mockUser, mockTokens);
    const updatedUser = { ...mockUser, firstName: 'Updated' };
    useAuthStore.getState().setUser(updatedUser);
    const state = useAuthStore.getState();

    expect(state.user?.firstName).toBe('Updated');
    expect(state.token).toBe('access-abc');
  });

  it('refreshTokens updates tokens without changing user', () => {
    useAuthStore.getState().login(mockUser, mockTokens);
    const newTokens: AuthTokens = {
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    };
    useAuthStore.getState().refreshTokens(newTokens);
    const state = useAuthStore.getState();

    expect(state.token).toBe('new-access');
    expect(state.refreshToken).toBe('new-refresh');
    expect(state.user).toEqual(mockUser);
  });

  it('setLoading updates loading state', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);

    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it('getUserTenants returns empty array when no user', () => {
    expect(useAuthStore.getState().getUserTenants()).toEqual([]);
  });

  it('getUserTenants returns tenants when user is set', () => {
    useAuthStore.getState().login(mockUser, mockTokens);
    const tenants = useAuthStore.getState().getUserTenants();
    expect(tenants).toHaveLength(2);
    expect(tenants[0].slug).toBe('test-org');
  });
});
