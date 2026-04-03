import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Search, Bell, Menu, X, Sun, Moon } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useTenantStore } from '@/store/tenantStore';
import { useAuthStore } from '@/store/authStore';
import { useClientAccessStore } from '@/store/clientAccessStore';
import ClientAccessBanner from '@/components/ui/ClientAccessBanner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useProjectStore } from '@/store/projectStore';

export default function TopBar() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { setSidebarMobileOpen, openModal, closeModal, theme, toggleTheme } = useUiStore();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();
  const { expiresAt } = useClientAccessStore();

  const setFilters = useProjectStore((s) => s.setFilters);

  const [searchValue, setSearchValue] = useState('');
  const [searchDraft, setSearchDraft] = useState('');

  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  const notifications = [
    { id: 'n1', title: 'Stage gate pending', body: 'PBD.pdf is required for completion.', date: '2h ago' },
    { id: 'n2', title: 'Payment received', body: 'A payment was recorded for PRJ-2026-002.', date: 'Yesterday' },
    { id: 'n3', title: 'Activity update', body: 'Geo-Tec report moved to In Review.', date: '3 days ago' },
  ];

  const tenantRole =
    user && tenantSlug ? user.tenants.find((t) => t.slug === tenantSlug)?.role : undefined;
  const showClientBanner = tenantRole === 'CLIENT_TEMP' && Boolean(expiresAt);

  const openSearch = () => {
    if (!tenantSlug) return;
    setSearchDraft(searchValue);
    openModal('topbar-search');
  };

  const applySearch = () => {
    const q = searchDraft.trim();
    setFilters({ search: q ? q : undefined });
    closeModal();
    if (tenantSlug) navigate(`/${tenantSlug}/projects`);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === 'k';
      if (!isK) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      openSearch();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, searchValue]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!notificationsOpen) return;
      const el = notificationsRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setNotificationsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [notificationsOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotificationsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header
      className={[
        'fixed top-0 right-0 z-30',
        'bg-[var(--nav-backdrop)] backdrop-blur-[30px]',
        'border-b border-[var(--border)]',
        'flex flex-col',
        'w-full lg:left-[72px] lg:w-[calc(100%-72px)]',
      ].join(' ')}
    >
      {showClientBanner && expiresAt && <ClientAccessBanner expiresAt={expiresAt} />}

      {/* Top bar row */}
      <div className="flex items-center justify-between px-6 py-4 w-full">
        {/* Left: Hamburger (mobile) + Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            onClick={() => setSidebarMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative flex items-center flex-1 max-w-md">
            <div
              className={[
                'flex items-center w-full rounded-sm border',
                'bg-[var(--bg-surface)] border-[var(--border-default)]',
                'focus-within:border-[var(--accent-sand)] focus-within:shadow-[0_0_12px_rgba(212,175,55,0.2)]',
                'transition-all duration-200',
              ].join(' ')}
            >
              <Search className="absolute left-3 h-4 w-4 text-[var(--accent-sand)]" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchValue}
                onChange={(e) => {
                  const next = e.target.value;
                  setSearchValue(next);
                  setFilters({ search: next.trim() ? next : undefined });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') openSearch();
                }}
                className={[
                  'w-full bg-transparent border-0 pl-9 pr-10 py-2.5',
                  'font-body text-[0.85rem] text-[var(--text-primary)]',
                  'placeholder:text-[var(--text-muted)]',
                  'focus:outline-none',
                ].join(' ')}
                aria-label="Search projects"
              />
              {searchValue.trim() ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute right-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                  onClick={() => {
                    setSearchValue('');
                    setFilters({ search: undefined });
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right: Tenant + Notifications + Avatar */}
        <div className="flex items-center gap-5">
          {/* Tenant name */}
          {currentTenant && (
            <button
              onClick={() => navigate(`/${tenantSlug}/settings`)}
              className="hidden md:block text-[0.7rem] font-body font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors tracking-wider uppercase"
            >
              {currentTenant.name}
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors p-1"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          {/* Notifications */}
          <div ref={notificationsRef} className="relative">
            <button
              className="relative text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors p-1"
              aria-label="Notifications"
              onClick={() => {
                setNotificationsOpen((v) => !v);
                setHasUnreadNotifications(false);
              }}
              type="button"
            >
              <Bell className="h-4 w-4" />
              {hasUnreadNotifications && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-[var(--status-danger)] rounded-full" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-[360px] bg-[var(--bg-card)] border border-[var(--border-default)] rounded-sm shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-default)]">
                  <p className="text-[0.72rem] uppercase tracking-wider text-[var(--text-muted)] font-medium">Notifications</p>
                </div>
                <ul className="max-h-[320px] overflow-y-auto">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className="px-4 py-3 border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--accent-sand-glow)] transition-colors cursor-pointer"
                      onClick={() => setNotificationsOpen(false)}
                      role="button"
                      tabIndex={0}
                    >
                      <p className="text-[0.86rem] font-medium text-[var(--text-primary)]">{n.title}</p>
                      <p className="text-[0.78rem] text-[var(--text-secondary)] mt-1 leading-snug">{n.body}</p>
                      <p className="text-[0.62rem] text-[var(--text-muted)] mt-2">{n.date}</p>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-3 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    className="text-[0.75rem] text-[var(--accent-sand)] hover:text-[var(--accent)]"
                    onClick={() => {
                      setHasUnreadNotifications(false);
                      setNotificationsOpen(false);
                    }}
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        modalId="topbar-search"
        title="Search Projects"
        size="sm"
        onClose={() => {
          closeModal();
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-[var(--accent-sand)] shrink-0" />
            <input
              autoFocus
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Type a project name or ref..."
              className="w-full bg-transparent border border-[var(--border-default)] rounded-sm px-3 py-2 text-[0.85rem] focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => closeModal()}>
              Cancel
            </Button>
            <Button variant="primary" onClick={applySearch}>
              Search
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
