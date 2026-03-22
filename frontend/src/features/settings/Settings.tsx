import { useState } from 'react';
import { useTenantStore } from '@/store/tenantStore';
import { useUiStore } from '@/store/uiStore';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Avatar from '@/components/ui/Avatar';
import { Sun, Moon } from 'lucide-react';

const settingsTabs = ['General', 'Users', 'Notifications', 'Appearance', 'Billing'] as const;
type SettingsTab = typeof settingsTabs[number];

const mockUsers = [
  { id: '1', name: 'Fortune Mabona', email: 'fortune@project360.co.za', role: 'ORG_ADMIN', status: 'active' },
  { id: '2', name: 'Thabo Ndlovu', email: 'thabo@project360.co.za', role: 'PROJECT_MANAGER', status: 'active' },
  { id: '3', name: 'Lerato Khumalo', email: 'lerato@project360.co.za', role: 'MEMBER', status: 'active' },
  { id: '4', name: 'Sipho Dlamini', email: 'sipho@project360.co.za', role: 'VIEWER', status: 'suspended' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('General');
  const { currentTenant } = useTenantStore();
  const { theme, toggleTheme } = useUiStore();

  return (
    <div className="animate-fade-in">
      <h1 className="text-h1 mb-8">Settings</h1>

      <div className="flex gap-8">
        {/* Left tab navigation */}
        <nav className="hidden md:flex flex-col gap-1 min-w-[180px]">
          {settingsTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'text-left px-4 py-2.5 text-[0.78rem] font-body transition-all duration-300',
                activeTab === tab
                  ? 'text-[var(--accent)] border-l-2 border-[var(--accent)] bg-[var(--accent-sand-glow)]'
                  : 'text-[var(--text-secondary)] border-l-2 border-transparent hover:text-[var(--accent)] hover:border-[var(--accent)]',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Content area */}
        <div className="flex-1 max-w-3xl">
          {/* General */}
          {activeTab === 'General' && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
              <h3 className="text-h3">Organisation Settings</h3>
              <FormInput label="Organisation Name" value={currentTenant?.name ?? ''} />
              <div>
                <label className="text-eyebrow text-[var(--text-muted)] mb-2 block">Logo</label>
                <div className="h-20 w-20 border border-dashed border-[var(--border-strong)] flex items-center justify-center">
                  <Avatar name={currentTenant?.name ?? 'S'} size="xl" />
                </div>
              </div>
              <FormInput label="Primary Contact" placeholder="Contact name" />
              <FormInput label="Address" placeholder="Business address" />
              <FormInput label="Timezone" placeholder="Africa/Johannesburg" />
              <Button variant="primary">Save Changes</Button>
            </div>
          )}

          {/* Users */}
          {activeTab === 'Users' && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <h3 className="text-h3">Team Members</h3>
                <Button variant="primary">Invite User</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'var(--table-header-bg)' }}>
                      {['Name', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="text-table-header text-left px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map((u, i) => (
                      <tr key={u.id} className={`border-b border-[var(--border)] ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-card)]'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} size="md" />
                            <span className="text-[0.82rem] font-body font-medium text-[var(--text-primary)]">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-table-cell">{u.email}</td>
                        <td className="px-4 py-3 text-[0.7rem] text-[var(--text-muted)] uppercase tracking-wider">{u.role.replace('_', ' ')}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={u.status === 'active' ? 'active' : 'danger'}>
                            {u.status}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" className="!text-[0.55rem]">Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'Notifications' && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
              <h3 className="text-h3">Notification Preferences</h3>
              {['Project updates', 'Task assignments', 'Report submissions', 'Deadline reminders', 'Team invitations'].map((pref) => (
                <label key={pref} className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                  <span className="text-body">{pref}</span>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-5 bg-[var(--bg-secondary)] border border-[var(--border)] peer-checked:bg-[var(--accent)] peer-checked:border-[var(--accent)] transition-colors cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--text-primary)] peer-checked:translate-x-5 transition-transform" />
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'Appearance' && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
              <h3 className="text-h3">Appearance</h3>
              <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                <div>
                  <p className="text-body font-medium text-[var(--text-primary)]">Theme</p>
                  <p className="text-[0.7rem] text-[var(--text-muted)]">Switch between dark and light mode</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                >
                  {theme === 'dark' ? <Moon className="h-4 w-4 text-[var(--accent)]" /> : <Sun className="h-4 w-4 text-[var(--accent)]" />}
                  <span className="text-[0.78rem] text-[var(--text-secondary)]">
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Billing */}
          {activeTab === 'Billing' && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
              <h3 className="text-h3">Billing</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[0.7rem] text-[var(--text-muted)]">Current Plan</span>
                  <StatusBadge status="accent">Starter</StatusBadge>
                </div>
                <div className="flex items-baseline justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[0.7rem] text-[var(--text-muted)]">Seats</span>
                  <span className="text-[0.82rem] text-[var(--text-primary)]">4 / 10</span>
                </div>
                <div className="flex items-baseline justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[0.7rem] text-[var(--text-muted)]">Next Billing Date</span>
                  <span className="text-[0.82rem] text-[var(--text-primary)]">1 April 2026</span>
                </div>
              </div>
              <p className="text-[0.7rem] text-[var(--text-muted)]">
                Payment integration will be available in a future release.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
