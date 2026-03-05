import { NavLink, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Columns3,
  FileBarChart,
  MapPin,
  FolderOpen,
  Settings,
  User,
  X,
  Star,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import Avatar from '@/components/ui/Avatar';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
}

export default function Sidebar() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user } = useAuthStore();
  const { sidebarMobileOpen, setSidebarMobileOpen } = useUiStore();

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, path: 'dashboard' },
    { label: 'Projects', icon: <FolderKanban className="h-4 w-4" />, path: 'projects' },
    {
      label: 'Kanban Board',
      icon: <Columns3 className="h-4 w-4" />,
      path: 'kanban',
      roles: ['PROJECT_MANAGER', 'ORG_ADMIN', 'SUPER_ADMIN'],
    },
    { label: 'Reports', icon: <FileBarChart className="h-4 w-4" />, path: 'reports' },
    { label: 'Maps', icon: <MapPin className="h-4 w-4" />, path: 'maps' },
    { label: 'Files', icon: <FolderOpen className="h-4 w-4" />, path: 'files' },
    {
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      path: 'settings',
      roles: ['ORG_ADMIN', 'SUPER_ADMIN'],
    },
  ];

  const filteredNav = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const basePath = `/${tenantSlug}`;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed top-0 left-0 z-50 h-screen w-[290px]',
          'bg-[var(--bg-secondary)] border-r border-[var(--border)]',
          'flex flex-col',
          'overflow-y-auto scrollbar-hidden',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:sticky',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border border-[var(--accent)] flex items-center justify-center">
              <span className="font-display text-sm font-semibold text-[var(--accent)]">S</span>
            </div>
            <div>
              <h1 className="font-display text-sm font-medium tracking-[2px] text-[var(--text-primary)] uppercase">
                S · O · N · E
              </h1>
              <p className="text-[0.5rem] tracking-[3px] text-[var(--text-muted)] uppercase">
                Studios
              </p>
            </div>
          </div>
          <button
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--accent)]"
            onClick={() => setSidebarMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6" aria-label="Main navigation">
          <p className="text-eyebrow px-3 mb-4">Navigation</p>
          <ul className="flex flex-col gap-0.5">
            {filteredNav.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={`${basePath}/${item.path}`}
                  onClick={() => setSidebarMobileOpen(false)}
                  className={({ isActive }: { isActive: boolean }) =>
                    [
                      'flex items-center gap-3 px-3 py-2.5 min-h-[40px]',
                      'text-nav transition-all duration-300',
                      isActive
                        ? 'border-l-2 border-[var(--accent)] text-[var(--accent)] bg-[rgba(201,169,97,0.08)]'
                        : 'border-l-2 border-transparent hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[rgba(201,169,97,0.08)]',
                    ].join(' ')
                  }
                >
                  <span className="opacity-70">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Favourites section placeholder */}
          <div className="mt-8">
            <p className="text-eyebrow px-3 mb-4">Favourites</p>
            <div className="px-3 py-2 text-[0.7rem] text-[var(--text-muted)] flex items-center gap-2">
              <Star className="h-3 w-3" />
              <span>Pin projects here</span>
            </div>
          </div>
        </nav>

        {/* User Profile (bottom-pinned) */}
        {user && (
          <NavLink
            to={`${basePath}/profile`}
            className="flex items-center gap-3 px-6 py-4 border-t border-[var(--border)] hover:bg-[rgba(201,169,97,0.08)] transition-colors"
          >
            <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="lg" />
            <div className="flex flex-col min-w-0">
              <span className="text-[0.78rem] font-body font-medium text-[var(--text-primary)] truncate">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-[0.6rem] text-[var(--text-muted)] tracking-wider uppercase">
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <User className="h-4 w-4 ml-auto text-[var(--text-muted)]" />
          </NavLink>
        )}
      </aside>
    </>
  );
}
