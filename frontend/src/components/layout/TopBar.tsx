import { useNavigate, useParams } from 'react-router-dom';
import { Search, Sun, Moon, Bell, Menu } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useTenantStore } from '@/store/tenantStore';
import { useAuthStore } from '@/store/authStore';
import Avatar from '@/components/ui/Avatar';

export default function TopBar() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { theme, toggleTheme, setSidebarMobileOpen } = useUiStore();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();

  return (
    <header
      className={[
        'fixed top-0 right-0 z-30 h-16',
        'bg-[var(--nav-backdrop)] backdrop-blur-[30px]',
        'border-b border-[var(--border)]',
        'flex items-center justify-between px-6',
        'w-full lg:w-[calc(100%-290px)]',
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
          <Search className="absolute left-0 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search..."
            className={[
              'w-full bg-transparent border-0 border-b border-[var(--border)]',
              'pl-6 pr-16 py-1.5',
              'font-body text-[0.82rem] font-light text-[var(--text-primary)]',
              'placeholder:text-[var(--text-muted)]',
              'focus:border-[var(--accent)] focus:outline-none',
              'transition-[border-color] duration-200',
            ].join(' ')}
            aria-label="Search"
          />
          <kbd className="absolute right-0 px-2 py-0.5 text-[0.55rem] font-mono text-[var(--text-muted)] border border-[var(--border)] bg-[var(--bg-secondary)]">
            ⌘K
          </kbd>
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

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors p-1"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

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
