import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTenantStore } from '@/store/tenantStore';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Avatar from '@/components/ui/Avatar';
import { Sun, Moon } from 'lucide-react';
import {
  applyCustomAccentColors,
  CUSTOM_ACCENT_PERIWINKLE_KEY,
  CUSTOM_ACCENT_SAND_KEY,
} from '@/utils/customAccentColors';
import {
  loadOrgGeneral,
  saveOrgGeneral,
  loadNotificationPrefs,
  saveNotificationPrefs,
  NOTIFY_LABELS,
  loadTeamMembers,
  saveTeamMembers,
  type NotificationPrefKey,
} from '@/utils/tenantSettingsStorage';
import type { MockSettingsTeamMember } from '@/mocks/settingsTeamMembers';
import ClientAccessSettings from './ClientAccessSettings';
import InviteUserModal, { INVITE_USER_MODAL_ID, type InviteTenantRole } from './InviteUserModal';

const DEFAULT_PERIWINKLE = '#C0642C';
const DEFAULT_SAND = '#B89040';

type SettingsTab = 'General' | 'Users' | 'Client access' | 'Notifications' | 'Appearance';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('General');
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { currentTenant } = useTenantStore();
  const { theme, toggleTheme, openModal, addToast, closeModal } = useUiStore();
  const { user } = useAuthStore();
  const tenantRole = user && tenantSlug ? user.tenants.find((t) => t.slug === tenantSlug)?.role : undefined;
  const canCustomizePalette = tenantRole === 'ORG_ADMIN' || tenantRole === 'SUPER_ADMIN';
  const settingsTabs: SettingsTab[] =
    tenantRole === 'ORG_ADMIN'
      ? ['General', 'Users', 'Client access', 'Notifications', 'Appearance']
      : ['General', 'Users', 'Notifications', 'Appearance'];

  const [accentPeriwinkle, setAccentPeriwinkle] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_PERIWINKLE;
    return localStorage.getItem(CUSTOM_ACCENT_PERIWINKLE_KEY) ?? DEFAULT_PERIWINKLE;
  });
  const [accentSand, setAccentSand] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_SAND;
    return localStorage.getItem(CUSTOM_ACCENT_SAND_KEY) ?? DEFAULT_SAND;
  });

  const [orgName, setOrgName] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('Africa/Johannesburg');
  const [notifyPrefs, setNotifyPrefs] = useState<Record<NotificationPrefKey, boolean>>(() =>
    loadNotificationPrefs(undefined),
  );
  const [teamMembers, setTeamMembers] = useState<MockSettingsTeamMember[]>([]);

  useEffect(() => {
    if (!tenantSlug) return;
    const g = loadOrgGeneral(tenantSlug);
    setOrgName(g.orgName || currentTenant?.name || '');
    setPrimaryContact(g.primaryContact);
    setAddress(g.address);
    setTimezone(g.timezone);
    setNotifyPrefs(loadNotificationPrefs(tenantSlug));
    setTeamMembers(loadTeamMembers(tenantSlug));
  }, [tenantSlug, currentTenant?.name]);

  useEffect(() => {
    if (activeTab === 'Client access' && tenantRole !== 'ORG_ADMIN') {
      setActiveTab('General');
    }
  }, [activeTab, tenantRole]);

  const applyAndPersist = (next: { periwinkleHex: string; sandHex: string }) => {
    if (typeof window === 'undefined') return;
    applyCustomAccentColors(next);
    try {
      localStorage.setItem(CUSTOM_ACCENT_PERIWINKLE_KEY, next.periwinkleHex);
      localStorage.setItem(CUSTOM_ACCENT_SAND_KEY, next.sandHex);
    } catch {
      // Quota / private mode: colours still apply for this session via applyCustomAccentColors.
    }
  };

  const resetAccents = () => {
    setAccentPeriwinkle(DEFAULT_PERIWINKLE);
    setAccentSand(DEFAULT_SAND);
    applyAndPersist({ periwinkleHex: DEFAULT_PERIWINKLE, sandHex: DEFAULT_SAND });
  };

  const handleSaveGeneral = () => {
    if (!tenantSlug) return;
    const ok = saveOrgGeneral(tenantSlug, {
      orgName,
      primaryContact,
      address,
      timezone,
    });
    addToast({
      type: ok ? 'success' : 'error',
      message: ok
        ? 'Organisation details saved locally for this tenant (mock until API exists).'
        : 'Could not save — browser storage may be full or blocked.',
    });
  };

  const updateNotifyPref = (key: NotificationPrefKey, checked: boolean) => {
    setNotifyPrefs((prev) => {
      const next = { ...prev, [key]: checked };
      if (tenantSlug) {
        const saved = saveNotificationPrefs(tenantSlug, next);
        if (!saved) {
          addToast({ type: 'error', message: 'Could not persist notification preference.' });
        }
      }
      return next;
    });
  };

  const handleInviteUser = (email: string, role: InviteTenantRole) => {
    if (!tenantSlug) return;
    const localPart = email.split('@')[0] ?? 'User';
    const name = localPart.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const newMember: MockSettingsTeamMember = {
      id: `inv-${Date.now().toString(36)}`,
      name,
      email,
      role,
      status: 'active',
    };
    const next = [...teamMembers, newMember];
    setTeamMembers(next);
    saveTeamMembers(tenantSlug, next);
    closeModal();
    addToast({
      type: 'success',
      message: `Invitation queued for ${email} (mock; no email sent).`,
    });
  };

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
              <p className="text-[0.72rem] text-[var(--text-muted)]">
                Values persist in <span className="font-mono">localStorage</span> per tenant until the settings API is available.
              </p>
              <FormInput
                label="Organisation Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={currentTenant?.name ?? 'Organisation name'}
              />
              <div>
                <label className="text-eyebrow text-[var(--text-muted)] mb-2 block">Logo</label>
                <div className="h-20 w-20 border border-dashed border-[var(--border-strong)] flex items-center justify-center">
                  <Avatar name={orgName || currentTenant?.name || 'S'} size="xl" />
                </div>
              </div>
              <FormInput
                label="Primary Contact"
                placeholder="Contact name"
                value={primaryContact}
                onChange={(e) => setPrimaryContact(e.target.value)}
              />
              <FormInput
                label="Address"
                placeholder="Business address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <FormInput
                label="Timezone"
                placeholder="Africa/Johannesburg"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
              <Button variant="primary" onClick={handleSaveGeneral} disabled={!tenantSlug}>
                Save Changes
              </Button>
            </div>
          )}

          {/* Client access (org admin) */}
          {activeTab === 'Client access' && tenantRole === 'ORG_ADMIN' && <ClientAccessSettings />}

          {/* Users */}
          {activeTab === 'Users' && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <h3 className="text-h3">Team Members</h3>
                <Button variant="primary" onClick={() => openModal(INVITE_USER_MODAL_ID)}>
                  Invite User
                </Button>
              </div>
              <div>
                <table className="w-full table-fixed">
                  <thead>
                    <tr style={{ background: 'var(--table-header-bg)' }}>
                      {['Name', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="text-table-header text-left px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((u, i) => (
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
                          <Button
                            variant="ghost"
                            className="!text-[0.55rem]"
                            onClick={() =>
                              addToast({
                                type: 'info',
                                message: 'User edit will open when the directory API is connected.',
                              })
                            }
                          >
                            Edit
                          </Button>
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
              <p className="text-[0.72rem] text-[var(--text-muted)]">
                Toggles save per tenant in the browser. Delivery rules will use the API later.
              </p>
              {NOTIFY_LABELS.map((pref) => (
                <label key={pref} className="flex items-center justify-between py-3 border-b border-[var(--border)] cursor-pointer">
                  <span className="text-body">{pref}</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifyPrefs[pref]}
                      onChange={(e) => updateNotifyPref(pref, e.target.checked)}
                      className="sr-only peer"
                    />
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

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-6 pb-4 border-b border-[var(--border)]">
                  <div>
                    <p className="text-body font-medium text-[var(--text-primary)]">Primary Accent</p>
                    <p className="text-[0.7rem] text-[var(--text-muted)]">Used for active states and highlights</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={accentPeriwinkle}
                      aria-label="Primary accent color"
                      disabled={!canCustomizePalette}
                      onChange={(e) => {
                        const next = e.target.value;
                        setAccentPeriwinkle(next);
                        applyAndPersist({ periwinkleHex: next, sandHex: accentSand });
                      }}
                      className="h-10 w-10 border border-[var(--border-default)] rounded-sm bg-transparent p-0 cursor-pointer"
                    />
                    <span className="text-[0.78rem] text-[var(--text-muted)] font-mono">{accentPeriwinkle.toUpperCase()}</span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-6 pb-4 border-b border-[var(--border)]">
                  <div>
                    <p className="text-body font-medium text-[var(--text-primary)]">Secondary Accent</p>
                    <p className="text-[0.7rem] text-[var(--text-muted)]">Used for financial figures and borders</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={accentSand}
                      aria-label="Secondary accent color"
                      disabled={!canCustomizePalette}
                      onChange={(e) => {
                        const next = e.target.value;
                        setAccentSand(next);
                        applyAndPersist({ periwinkleHex: accentPeriwinkle, sandHex: next });
                      }}
                      className="h-10 w-10 border border-[var(--border-default)] rounded-sm bg-transparent p-0 cursor-pointer"
                    />
                    <span className="text-[0.78rem] text-[var(--text-muted)] font-mono">{accentSand.toUpperCase()}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  {canCustomizePalette ? (
                    <Button variant="ghost" onClick={resetAccents}>
                      Reset to Atlas Sahara defaults
                    </Button>
                  ) : (
                    <p className="text-[0.72rem] text-[var(--text-muted)]">
                      Theme colors can only be changed by Org Admins.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <InviteUserModal onInvite={handleInviteUser} />
    </div>
  );
}
