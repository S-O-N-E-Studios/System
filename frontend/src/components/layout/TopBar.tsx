import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Bell, Menu, X, Sun, Moon, ArrowRight, Clock } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useTenantStore } from '@/store/tenantStore';
import { useAuthStore } from '@/store/authStore';
import { useClientAccessStore } from '@/store/clientAccessStore';
import ClientAccessBanner from '@/components/ui/ClientAccessBanner';
import { useProjectStore } from '@/store/projectStore';

export default function TopBar() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { setSidebarMobileOpen, theme, toggleTheme } = useUiStore();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();
  const { expiresAt } = useClientAccessStore();

  const setFilters = useProjectStore((s) => s.setFilters);
  // Reactive selector so the dropdown updates immediately when pins change.
  const pinnedProjects = useProjectStore(
    (s) => s.pinnedProjectsByTenant[tenantSlug ?? ''] ?? [],
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchDropPos, setSearchDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchDropRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null);

  type Notification = { id: string; title: string; body: string; date: string; read: boolean };
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'n1', title: 'Stage gate pending', body: 'PBD.pdf is required for Stage 4 completion.', date: '2h ago', read: false },
    { id: 'n2', title: 'Payment received', body: 'A payment was recorded for PRJ-2026-002.', date: 'Yesterday', read: false },
    { id: 'n3', title: 'Activity update', body: 'Geo-Tec report moved to In Review.', date: '3 days ago', read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const openNotifications = () => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setNotificationsOpen(true);
  };

  const closeNotifications = () => setNotificationsOpen(false);

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    closeNotifications();
  };

  const tenantRole =
    user && tenantSlug ? user.tenants.find((t) => t.slug === tenantSlug)?.role : undefined;
  const showClientBanner = tenantRole === 'CLIENT_TEMP' && Boolean(expiresAt);

  const openSearchDrop = () => {
    if (searchWrapRef.current) {
      const rect = searchWrapRef.current.getBoundingClientRect();
      setSearchDropPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    setSearchFocused(true);
  };

  const closeSearchDrop = () => setSearchFocused(false);

  const commitSearch = () => {
    if (!tenantSlug) return;
    const q = searchValue.trim();
    setFilters({ search: q || undefined });
    closeSearchDrop();
    navigate(`/${tenantSlug}/projects`);
  };

  const goToProject = (projectId: string) => {
    if (!tenantSlug) return;
    closeSearchDrop();
    navigate(`/${tenantSlug}/projects/${projectId}`);
  };

  const filteredPins = searchValue.trim()
    ? pinnedProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          (p.ref ?? '').toLowerCase().includes(searchValue.toLowerCase()),
      )
    : pinnedProjects.slice(0, 5);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === 'k';
      if (!isK) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      searchInputRef.current?.focus();
      openSearchDrop();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tenantSlug]);

  useEffect(() => {
    if (!searchFocused) return;
    const onMouseDown = (e: MouseEvent) => {
      const drop = searchDropRef.current;
      const wrap = searchWrapRef.current;
      if (!drop || !wrap) return;
      if (e.target instanceof Node && (drop.contains(e.target) || wrap.contains(e.target))) return;
      closeSearchDrop();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeSearchDrop(); searchInputRef.current?.blur(); }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [searchFocused]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const panel = panelRef.current;
      const bell = bellRef.current;
      if (!panel || !bell) return;
      if (e.target instanceof Node && (panel.contains(e.target) || bell.contains(e.target))) return;
      closeNotifications();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNotifications();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [notificationsOpen]);

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

          <div ref={searchWrapRef} className="relative flex items-center flex-1 max-w-md">
            <div
              className={[
                'flex items-center w-full border',
                'bg-[var(--bg-surface)] border-[var(--border-default)]',
                searchFocused
                  ? 'border-[var(--accent-sand)] shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                  : 'hover:border-[var(--accent-sand)]',
                'transition-all duration-200',
              ].join(' ')}
            >
              <Search className="absolute left-3 h-4 w-4 text-[var(--accent-sand)] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search projects… (⌘K)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={openSearchDrop}
                onKeyDown={(e) => { if (e.key === 'Enter') commitSearch(); }}
                className={[
                  'w-full bg-transparent border-0 pl-9 pr-10 py-2.5',
                  'font-body text-[0.85rem] text-[var(--text-primary)]',
                  'placeholder:text-[var(--text-muted)]',
                  'focus:outline-none',
                ].join(' ')}
                aria-label="Search projects"
                aria-expanded={searchFocused}
                aria-haspopup="listbox"
                role="combobox"
                autoComplete="off"
              />
              {searchValue.trim() ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute right-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                  onClick={() => {
                    setSearchValue('');
                    setFilters({ search: undefined });
                    searchInputRef.current?.focus();
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {/* Search dropdown portal */}
            {searchFocused && searchDropPos && createPortal(
              <div
                ref={searchDropRef}
                role="listbox"
                aria-label="Search suggestions"
                className="fixed bg-[var(--bg-card)] border border-[var(--border-default)] shadow-2xl z-[200] overflow-hidden"
                style={{ top: searchDropPos.top, left: searchDropPos.left, width: searchDropPos.width }}
              >
                {/* Pinned / filtered projects */}
                {filteredPins.length > 0 && (
                  <>
                    <div className="px-3 pt-2.5 pb-1">
                      <p className="text-[0.62rem] uppercase tracking-wider text-[var(--text-muted)] font-semibold flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {searchValue.trim() ? 'Pinned matches' : 'Pinned projects'}
                      </p>
                    </div>
                    <ul>
                      {filteredPins.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={false}
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--accent-sand-glow)] transition-colors text-left group"
                            onClick={() => goToProject(p.id)}
                          >
                            <span className="min-w-0">
                              <span className="block text-[0.82rem] text-[var(--text-primary)] truncate">{p.name}</span>
                              {p.ref && (
                                <span className="text-[0.65rem] text-[var(--text-muted)]"
                                  style={{ fontFamily: 'var(--font-mono)' }}
                                >
                                  {p.ref}
                                </span>
                              )}
                            </span>
                            <ArrowRight className="h-3 w-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-[var(--border-default)]" />
                  </>
                )}

                {/* No pinned + no query: prompt */}
                {filteredPins.length === 0 && !searchValue.trim() && (
                  <div className="px-3 py-4 text-center">
                    <p className="text-[0.78rem] text-[var(--text-muted)]">Type to search all projects</p>
                  </div>
                )}

                {/* No pin matches but has query */}
                {filteredPins.length === 0 && searchValue.trim() && (
                  <div className="px-3 pt-2.5 pb-1">
                    <p className="text-[0.72rem] text-[var(--text-muted)]">No pinned matches</p>
                  </div>
                )}

                {/* Search all row */}
                {tenantSlug && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--accent-sand-glow)] transition-colors text-left"
                    onClick={commitSearch}
                  >
                    <Search className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
                    <span className="text-[0.82rem] text-[var(--accent)]">
                      {searchValue.trim()
                        ? `Search all projects for "${searchValue.trim()}"`
                        : 'Browse all projects'}
                    </span>
                  </button>
                )}
              </div>,
              document.body,
            )}
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
          <div className="relative">
            <button
              ref={bellRef}
              type="button"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-expanded={notificationsOpen}
              className="relative text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors p-1"
              onClick={() => (notificationsOpen ? closeNotifications() : openNotifications())}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-[var(--status-danger)] rounded-full text-white leading-none"
                  style={{ fontSize: '0.58rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && panelPos && createPortal(
              <div
                ref={panelRef}
                role="dialog"
                aria-label="Notifications"
                className="fixed w-[340px] max-w-[calc(100vw-2rem)] bg-[var(--bg-card)] border border-[var(--border-default)] shadow-2xl z-[200] overflow-hidden"
                style={{ top: panelPos.top, right: panelPos.right }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
                  <p className="text-[0.68rem] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-[var(--status-danger)] text-white rounded-full"
                        style={{ fontSize: '0.58rem', fontWeight: 700 }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={closeNotifications}
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    aria-label="Close notifications"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Items */}
                <ul className="max-h-[320px] overflow-y-auto divide-y divide-[var(--border-default)]">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => { markRead(n.id); closeNotifications(); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { markRead(n.id); closeNotifications(); } }}
                      className={[
                        'flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors',
                        'hover:bg-[var(--accent-sand-glow)]',
                        !n.read ? 'bg-[var(--accent-light)]' : '',
                      ].join(' ')}
                    >
                      {/* Unread dot */}
                      <span
                        className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full transition-colors"
                        style={{ background: n.read ? 'transparent' : 'var(--accent)' }}
                      />
                      <div className="min-w-0">
                        <p className={`text-[0.82rem] leading-snug ${n.read ? 'text-[var(--text-secondary)]' : 'font-semibold text-[var(--text-primary)]'}`}>
                          {n.title}
                        </p>
                        <p className="text-[0.75rem] text-[var(--text-muted)] mt-0.5 leading-snug">
                          {n.body}
                        </p>
                        <p className="text-[0.6rem] text-[var(--text-muted)] mt-1.5"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {n.date}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-[var(--border-default)] flex items-center justify-between">
                  <button
                    type="button"
                    className="text-[0.7rem] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-medium disabled:opacity-40"
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                  >
                    Mark all as read
                  </button>
                  <span className="text-[0.65rem] text-[var(--text-muted)]">
                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>,
              document.body,
            )}
          </div>
        </div>
      </div>

    </header>
  );
}
