export type MockSettingsTeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
};

export const DEFAULT_MOCK_TEAM_MEMBERS: MockSettingsTeamMember[] = [
  { id: '1', name: 'Fortune Mabona', email: 'fortune@project360.co.za', role: 'ORG_ADMIN', status: 'active' },
  { id: '2', name: 'Thabo Ndlovu', email: 'thabo@project360.co.za', role: 'PROJECT_MANAGER', status: 'active' },
  { id: '3', name: 'Lerato Khumalo', email: 'lerato@project360.co.za', role: 'MEMBER', status: 'active' },
  { id: '4', name: 'Sipho Dlamini', email: 'sipho@project360.co.za', role: 'VIEWER', status: 'suspended' },
];
