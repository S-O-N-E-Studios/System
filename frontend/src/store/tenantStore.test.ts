import { describe, expect, it, beforeEach } from 'vitest';
import { useTenantStore } from './tenantStore';

const mockTenant = {
  id: 'tenant-1',
  slug: 'limpopo-civil',
  name: 'Limpopo Civil Engineering',
  plan: 'professional' as const,
};

describe('tenantStore', () => {
  beforeEach(() => {
    useTenantStore.setState({ currentTenant: null });
  });

  it('has null initial tenant', () => {
    expect(useTenantStore.getState().currentTenant).toBeNull();
  });

  it('setTenant stores the tenant', () => {
    useTenantStore.getState().setTenant(mockTenant);
    expect(useTenantStore.getState().currentTenant).toEqual(mockTenant);
  });

  it('clearTenant resets to null', () => {
    useTenantStore.getState().setTenant(mockTenant);
    useTenantStore.getState().clearTenant();
    expect(useTenantStore.getState().currentTenant).toBeNull();
  });

  it('getSlug returns slug when tenant is set', () => {
    useTenantStore.getState().setTenant(mockTenant);
    expect(useTenantStore.getState().getSlug()).toBe('limpopo-civil');
  });

  it('getSlug returns null when no tenant', () => {
    expect(useTenantStore.getState().getSlug()).toBeNull();
  });

  it('setTenant can update to a different tenant', () => {
    useTenantStore.getState().setTenant(mockTenant);
    const newTenant = { ...mockTenant, id: 'tenant-2', slug: 'gauteng-corp', name: 'Gauteng Corp' };
    useTenantStore.getState().setTenant(newTenant);
    expect(useTenantStore.getState().currentTenant?.slug).toBe('gauteng-corp');
  });

  it('setTenant preserves optional logo field', () => {
    const tenantWithLogo = { ...mockTenant, logo: 'https://example.com/logo.png' };
    useTenantStore.getState().setTenant(tenantWithLogo);
    expect(useTenantStore.getState().currentTenant?.logo).toBe('https://example.com/logo.png');
  });
});
