export type MockTenantRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  users: number;
  isActive: boolean;
};

export const MOCK_SUPER_ADMIN_TENANTS: MockTenantRow[] = [
  { id: '1', name: 'Limpopo Civil Engineering', slug: 'limpopo-civil', plan: 'Starter', users: 4, isActive: true },
  { id: '2', name: 'Gauteng Structures Corp', slug: 'gauteng-structures', plan: 'Professional', users: 12, isActive: true },
  { id: '3', name: 'Cape Town Roads Dept', slug: 'ct-roads', plan: 'Starter', users: 2, isActive: false },
];
