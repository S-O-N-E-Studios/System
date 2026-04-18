import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCan } from './useCan';
import type { Permission } from './permissions';

function CanResult({ permission }: { permission: Permission }) {
  const can = useCan();
  return <div data-testid="result">{can(permission) ? 'true' : 'false'}</div>;
}

describe('useCan', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('denies edit_project for CLIENT_TEMP tenant role', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ORG_ADMIN',
        tenants: [{ id: 't1', slug: 'tenant-a', name: 'Tenant A', role: 'CLIENT_TEMP' }],
      },
    });

    render(
      <MemoryRouter initialEntries={['/tenant-a']}>
        <Routes>
          <Route path="/:tenantSlug" element={<CanResult permission="edit_project" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('result')).toHaveTextContent('false');
  });

  it('allows view_projects for CLIENT_TEMP tenant role', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ORG_ADMIN',
        tenants: [{ id: 't1', slug: 'tenant-a', name: 'Tenant A', role: 'CLIENT_TEMP' }],
      },
    });

    render(
      <MemoryRouter initialEntries={['/tenant-a']}>
        <Routes>
          <Route path="/:tenantSlug" element={<CanResult permission="view_projects" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('result')).toHaveTextContent('true');
  });

  it('allows all permissions for SUPER_ADMIN', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'SUPER_ADMIN',
        tenants: [{ id: 't1', slug: 'tenant-a', name: 'Tenant A', role: 'CLIENT_TEMP' }],
      },
    });

    render(
      <MemoryRouter initialEntries={['/tenant-a']}>
        <Routes>
          <Route path="/:tenantSlug" element={<CanResult permission="view_settings" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('result')).toHaveTextContent('true');
  });
});

