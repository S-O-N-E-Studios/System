import { useCallback, useEffect, useRef, useState } from 'react';
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
  type TeamMember,
} from '@/utils/tenantSettingsStorage';
import { usersApi } from '@/api/users';
import { organizationApi, type OrganizationPatch } from '@/api/organization';
import {
  fetchNotifications,
  NOTIFICATION_PREFS,
  updateNotificationPreferences,
  type NotificationPrefKey,
  type NotificationPreferences,
} from '@/api/notifications';
import ClientAccessSettings from './ClientAccessSettings';
import InviteUserModal, { INVITE_USER_MODAL_ID, type InviteTenantRole } from './InviteUserModal';
import {
  TABLE_HEAD_CELL,
  TABLE_HEAD_ROW,
  TABLE_ROW_BASE,
  TABLE_SURFACE,
} from '@/utils/tableStyles';

const DEFAULT_PERIWINKLE = '#C0642C';
const DEFAULT_SAND = '#B89040';

/** Only `<col />` children — no whitespace/comments inside `<colgroup>` (React DOM nesting). */
const USERS_TABLE_COL_WIDTHS = ['24%', '27%', '16%', '11%', '22%'] as const;

type SettingsTab = 'General' | 'Users' | 'Client access' | 'Notifications' | 'Appearance';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('General');
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { currentTenant, setTenant } = useTenantStore();
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
  const [notifyPrefs, setNotifyPrefs] = useState<NotificationPreferences>({
    projectUpdates: true,
    taskAssignments: true,
    reportSubmissions: true,
    deadlineReminders: true,
    teamInvitations: true,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [, setTeamLoading] = useState(false);

  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpAuthUser, setSmtpAuthUser] = useState('');
  const [smtpAuthPass, setSmtpAuthPass] = useState('');
  const [smtpAuthPassSet, setSmtpAuthPassSet] = useState(false);
  const [smtpFromName, setSmtpFromName] = useState('');
  const [smtpFromAddress, setSmtpFromAddress] = useState('');
  const [smtpReplyTo, setSmtpReplyTo] = useState('');
  const [smtpClearPassword, setSmtpClearPassword] = useState(false);

  const [orgLogoUrl, setOrgLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const orgLogoInputRef = useRef<HTMLInputElement>(null);

  const syncOrgLogoToShell = useCallback(
    (url: string | null | undefined) => {
      if (!tenantSlug) return;
      const ct = useTenantStore.getState().currentTenant;
      if (ct?.slug !== tenantSlug) return;
      if (url) {
        setTenant({ ...ct, logo: url });
      } else {
        const next = { ...ct };
        delete next.logo;
        setTenant(next);
      }
    },
    [tenantSlug, setTenant],
  );

  useEffect(() => {
    if (!tenantSlug) return;
    const g = loadOrgGeneral(tenantSlug);
    setAddress(g.address);
    setTimezone(g.timezone);
    let cancelled = false;
    setTeamLoading(true);

    Promise.all([
      organizationApi
        .get()
        .then((org) => {
          if (cancelled) return;
          setOrgName(org.name || currentTenant?.name || '');
          setPrimaryContact(org.primaryContact || '');
          setAddress(org.address || g.address);
          setTimezone(org.timezone || g.timezone || 'Africa/Johannesburg');
          setOrgLogoUrl(org.logoUrl ?? null);
          syncOrgLogoToShell(org.logoUrl ?? null);
          const oe = org.outboundEmail;
          if (oe) {
            setSmtpEnabled(Boolean(oe.enabled));
            setSmtpHost(oe.host || '');
            setSmtpPort(String(oe.port ?? 587));
            setSmtpSecure(Boolean(oe.secure));
            setSmtpAuthUser(oe.authUser || '');
            setSmtpAuthPass('');
            setSmtpClearPassword(false);
            setSmtpAuthPassSet(Boolean(oe.authPassSet));
            setSmtpFromName(oe.fromName || '');
            setSmtpFromAddress(oe.fromAddress || '');
            setSmtpReplyTo(oe.replyTo || '');
          }
        })
        .catch(() => {
          if (cancelled) return;
          setOrgName(g.orgName || currentTenant?.name || '');
          setPrimaryContact(g.primaryContact);
        }),
      fetchNotifications()
        .then((payload) => {
          if (cancelled) return;
          setNotifyPrefs(payload.preferences);
        })
        .catch(() => {
          if (cancelled) return;
        }),
      usersApi
        .list()
        .then((users) => {
          if (cancelled) return;
          setTeamMembers(
            users.map((u) => ({
              id: u.id,
              name: u.fullName || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
              email: u.email,
              role: u.role,
              status: (u.isActive === false ? 'suspended' : 'active') as TeamMember['status'],
            })),
          );
        })
        .catch(() => {
          if (!cancelled) setTeamMembers([]);
        }),
    ]).finally(() => {
      if (!cancelled) setTeamLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [tenantSlug, currentTenant?.name, syncOrgLogoToShell]);

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

  const handleSaveGeneral = async () => {
    if (!tenantSlug) return;
    try {
      if (tenantRole === 'ORG_ADMIN') {
        await organizationApi.update({ name: orgName, primaryContact, address, timezone });
      }
      const ok = saveOrgGeneral(tenantSlug, {
        orgName,
        primaryContact,
        address,
        timezone,
      });
      addToast({
        type: ok ? 'success' : 'error',
        message: ok
          ? tenantRole === 'ORG_ADMIN'
            ? 'Organisation profile saved (server and local extras).'
            : 'Local preferences saved.'
          : tenantRole === 'ORG_ADMIN'
            ? 'Profile saved on server; local extras could not be written to browser storage.'
            : 'Could not save — browser storage may be full or blocked.',
      });
    } catch {
      addToast({ type: 'error', message: 'Could not save organisation profile on the server.' });
    }
  };

  const handleSaveOutboundEmail = async () => {
    if (!tenantSlug || tenantRole !== 'ORG_ADMIN') return;
    try {
      const outboundEmail: NonNullable<OrganizationPatch['outboundEmail']> = {
        enabled: smtpEnabled,
        host: smtpHost.trim() || '',
        port: Number(smtpPort) || 587,
        secure: smtpSecure,
        authUser: smtpAuthUser.trim() || '',
        fromName: smtpFromName.trim() || '',
        fromAddress: smtpFromAddress.trim() || '',
        replyTo: smtpReplyTo.trim() || '',
      };
      if (smtpAuthPass.trim()) {
        outboundEmail.authPass = smtpAuthPass.trim();
      } else if (smtpClearPassword) {
        outboundEmail.authPass = '';
      }
      const org = await organizationApi.update({ outboundEmail });
      setSmtpAuthPass('');
      setSmtpClearPassword(false);
      if (org.outboundEmail) {
        setSmtpAuthPassSet(Boolean(org.outboundEmail.authPassSet));
      }
      addToast({ type: 'success', message: 'Email delivery settings saved.' });
    } catch {
      addToast({ type: 'error', message: 'Could not save email delivery settings.' });
    }
  };

  const updateNotifyPref = (key: NotificationPrefKey, checked: boolean) => {
    const previous = notifyPrefs;
    const next = { ...previous, [key]: checked };
    setNotifyPrefs(next);
    void updateNotificationPreferences({ [key]: checked })
      .catch(() => {
        setNotifyPrefs(previous);
        addToast({ type: 'error', message: 'Could not persist notification preference.' });
      });
  };

  const handleOrgLogoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || tenantRole !== 'ORG_ADMIN') return;
    setLogoUploading(true);
    try {
      const org = await organizationApi.uploadLogo(file);
      const url = org.logoUrl ?? null;
      setOrgLogoUrl(url);
      syncOrgLogoToShell(url ?? undefined);
      addToast({ type: 'success', message: 'Organisation logo updated.' });
    } catch {
      addToast({ type: 'error', message: 'Could not upload logo. Use JPEG, PNG, WebP, or GIF (max 2MB).' });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleInviteUser = async (email: string, role: InviteTenantRole) => {
    if (!tenantSlug) return;
    try {
      await usersApi.invite({ email, role });
      closeModal();
      addToast({ type: 'success', message: `Invitation sent to ${email}.` });
      const users = await usersApi.list();
      setTeamMembers(
        users.map((u) => ({
          id: u.id,
          name: u.fullName || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
          email: u.email,
          role: u.role,
          status: (u.isActive === false ? 'suspended' : 'active') as TeamMember['status'],
        })),
      );
    } catch {
      addToast({ type: 'error', message: `Failed to invite ${email}. Please try again.` });
    }
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
                Organisation name, address, contact, and timezone sync to the server for administrators. Local browser
                storage is still used as a fallback when the API is unavailable.
              </p>
              <FormInput
                label="Organisation Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={currentTenant?.name ?? 'Organisation name'}
              />
              <div>
                <label className="text-eyebrow text-[var(--text-muted)] mb-2 block">Logo</label>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-20 w-20 border border-dashed border-[var(--border-strong)] flex items-center justify-center shrink-0 overflow-hidden rounded-sm">
                    <Avatar
                      name={orgName || currentTenant?.name || 'S'}
                      src={orgLogoUrl ?? undefined}
                      size="xl"
                    />
                  </div>
                  {tenantRole === 'ORG_ADMIN' && (
                    <>
                      <input
                        ref={orgLogoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        onChange={(ev) => void handleOrgLogoSelected(ev)}
                      />
                      <Button
                        variant="secondary"
                        type="button"
                        isLoading={logoUploading}
                        disabled={logoUploading}
                        onClick={() => orgLogoInputRef.current?.click()}
                      >
                        Upload logo
                      </Button>
                    </>
                  )}
                </div>
                {tenantRole !== 'ORG_ADMIN' && (
                  <p className="text-[0.68rem] text-[var(--text-muted)] mt-2">
                    Only organisation administrators can change the logo.
                  </p>
                )}
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
              <Button variant="primary" onClick={() => void handleSaveGeneral()} disabled={!tenantSlug}>
                Save Changes
              </Button>

              {tenantRole === 'ORG_ADMIN' && (
                <div className="pt-8 mt-8 border-t border-[var(--border)] space-y-5">
                  <h4 className="text-[0.85rem] font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                    Email delivery (organisation)
                  </h4>
                  <p className="text-[0.72rem] text-[var(--text-muted)] leading-relaxed">
                    Use your own mail server for invitations, password reset (for members of this organisation), and
                    client access emails. When disabled, the platform mail settings from the server environment are used.
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smtpEnabled}
                      onChange={(e) => setSmtpEnabled(e.target.checked)}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-[0.78rem] text-[var(--text-primary)]">Send mail via organisation SMTP</span>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                      label="SMTP host"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="mail.yourorganisation.gov.za"
                    />
                    <FormInput
                      label="Port"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-[0.72rem] text-[var(--text-muted)]">Use TLS implicit (port 465)</span>
                  </label>
                  <FormInput
                    label="SMTP username (optional)"
                    value={smtpAuthUser}
                    onChange={(e) => setSmtpAuthUser(e.target.value)}
                    autoComplete="off"
                  />
                  <div>
                    <FormInput
                      label="SMTP password"
                      type="password"
                      value={smtpAuthPass}
                      onChange={(e) => {
                        setSmtpAuthPass(e.target.value);
                        setSmtpClearPassword(false);
                      }}
                      placeholder={smtpAuthPassSet ? '•••••••• (leave blank to keep)' : 'Optional'}
                      autoComplete="new-password"
                    />
                    {smtpAuthPassSet && (
                      <button
                        type="button"
                        className="mt-2 text-[0.68rem] text-[var(--status-danger)] hover:underline"
                        onClick={() => {
                          setSmtpClearPassword(true);
                          setSmtpAuthPass('');
                        }}
                      >
                        Clear saved password
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                      label="From name"
                      value={smtpFromName}
                      onChange={(e) => setSmtpFromName(e.target.value)}
                      placeholder={orgName || 'Organisation name'}
                    />
                    <FormInput
                      label="From email"
                      type="email"
                      value={smtpFromAddress}
                      onChange={(e) => setSmtpFromAddress(e.target.value)}
                      placeholder="noreply@yourorganisation.gov.za"
                    />
                  </div>
                  <FormInput
                    label="Reply-To (optional)"
                    type="email"
                    value={smtpReplyTo}
                    onChange={(e) => setSmtpReplyTo(e.target.value)}
                    placeholder="pmo@yourorganisation.gov.za"
                  />
                  <Button variant="secondary" type="button" onClick={() => void handleSaveOutboundEmail()}>
                    Save email delivery
                  </Button>
                </div>
              )}
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
              <div className={TABLE_SURFACE}>
                <table className="w-full min-w-[720px]" style={{ tableLayout: 'fixed' }}>
                  <colgroup>{USERS_TABLE_COL_WIDTHS.map((w) => (<col key={w} style={{ width: w }} />))}</colgroup>
                  <thead>
                    <tr className={TABLE_HEAD_ROW}>
                      {['Name', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                        <th key={h} className={TABLE_HEAD_CELL}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((u, i) => (
                      <tr
                        key={u.id ? String(u.id) : `${u.email}-${i}`}
                        className={`${TABLE_ROW_BASE} align-middle ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-card)]'}`}
                      >
                        {/* Name + avatar */}
                        <td className="px-4 py-3 max-w-0 overflow-hidden">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={u.name} size="md" />
                            <span
                              className="text-[0.82rem] font-body font-medium text-[var(--text-primary)] truncate"
                              title={u.name}
                            >
                              {u.name}
                            </span>
                          </div>
                        </td>
                        {/* Email */}
                        <td className="px-4 py-3 max-w-0 overflow-hidden">
                          <span
                            className="block text-[0.78rem] text-[var(--text-secondary)] font-mono truncate"
                            title={u.email}
                          >
                            {u.email}
                          </span>
                        </td>
                        {/* Role */}
                        <td className="px-4 py-3 max-w-0 overflow-hidden">
                          <span
                            className="block text-[0.68rem] text-[var(--text-muted)] uppercase tracking-wider truncate"
                            title={u.role.replace(/_/g, ' ')}
                          >
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge status={u.status === 'active' ? 'active' : 'danger'}>
                            {u.status === 'active' ? 'Active' : 'Suspended'}
                          </StatusBadge>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-nowrap">
                            <button
                              type="button"
                              title="Edit user"
                              className="shrink-0 px-3 py-1 text-[0.7rem] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors whitespace-nowrap"
                              onClick={() => addToast({ type: 'info', message: 'User editing coming soon.' })}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              title="Remove user"
                              className="shrink-0 px-3 py-1 text-[0.7rem] font-medium border border-[var(--border)] text-[var(--status-danger)] hover:border-[var(--status-danger)] transition-colors whitespace-nowrap"
                              onClick={() => addToast({ type: 'info', message: 'User removal coming soon.' })}
                            >
                              Remove
                            </button>
                          </div>
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
                Notification settings are now saved to your account for this organisation.
              </p>
              {NOTIFICATION_PREFS.map((pref) => {
                const on = notifyPrefs[pref.key];
                return (
                  <label key={pref.key} className="flex items-center justify-between py-3 border-b border-[var(--border)] cursor-pointer select-none">
                    <span className="text-body">{pref.label}</span>
                    <div className="relative shrink-0">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => updateNotifyPref(pref.key, e.target.checked)}
                        className="sr-only"
                      />
                      {/* Track */}
                      <div
                        className="w-10 h-[22px] border transition-colors duration-200 cursor-pointer"
                        style={{
                          background: on ? 'var(--accent)' : 'var(--bg-secondary)',
                          borderColor: on ? 'var(--accent)' : 'var(--border)',
                        }}
                      >
                        {/* Thumb */}
                        <div
                          className="absolute top-[3px] w-4 h-4 transition-all duration-200"
                          style={{
                            left: on ? 'calc(100% - 18px)' : '3px',
                            background: on ? '#fff' : 'var(--text-muted)',
                          }}
                        />
                      </div>
                    </div>
                  </label>
                );
              })}
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
