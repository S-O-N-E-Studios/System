import { useNavigate, useParams } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useTenantStore } from '@/store/tenantStore';
import { useAuthStore } from '@/store/authStore';
import Avatar from '@/components/ui/Avatar';

export default function TopBar() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { setSidebarMobileOpen } = useUiStore();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();

  return (
    <header
      className={[
        'fixed top-0 right-0 z-30 h-16',
        'bg-[var(--nav-backdrop)] backdrop-blur-[30px]',
        'border-b border-[var(--border)]',
        'flex items-center justify-between px-6',
        'w-full lg:left-[72px] lg:w-[calc(100%-72px)]',
      ].join(' ')}
    >
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
              className={[
                'w-full bg-transparent border-0 pl-9 pr-14 py-2.5',
                'font-body text-[0.85rem] text-[var(--text-primary)]',
                'placeholder:text-[var(--text-muted)]',
                'focus:outline-none',
              ].join(' ')}
              aria-label="Search projects"
            />
            <kbd className="absolute right-2 px-2 py-1 text-[0.55rem] font-mono text-[var(--text-muted)] border border-[var(--border-default)] bg-[var(--bg-primary)] rounded">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Tenant + Theme + Notifications + Avatar */}
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

        {/* Notifications */}
        <button
          className="relative text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors p-1"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-[var(--status-danger)] rounded-full" />
        </button>

        {/* User avatar */}
        {user && (
          <Avatar
            name={`${user.firstName} ${user.lastName}`}
            src={user.avatarUrl}
            size="md"
          />
        )}
      </div>
    </header>
  );
}
