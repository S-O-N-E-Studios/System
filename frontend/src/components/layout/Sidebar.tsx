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
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const { user, logout } = useAuthStore();
  const { sidebarMobileOpen, setSidebarMobileOpen } = useUiStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 shrink-0" />, path: 'dashboard' },
    { label: 'Projects', icon: <FolderKanban className="h-4 w-4 shrink-0" />, path: 'projects' },
    {
      label: 'Kanban Board',
      icon: <Columns3 className="h-4 w-4 shrink-0" />,
      path: 'kanban',
      roles: ['PROJECT_MANAGER', 'ORG_ADMIN', 'SUPER_ADMIN'],
    },
    { label: 'Reports', icon: <FileBarChart className="h-4 w-4 shrink-0" />, path: 'reports' },
    { label: 'Maps', icon: <MapPin className="h-4 w-4 shrink-0" />, path: 'maps' },
    { label: 'Files', icon: <FolderOpen className="h-4 w-4 shrink-0" />, path: 'files' },
    {
      label: 'Settings',
      icon: <Settings className="h-4 w-4 shrink-0" />,
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

      {/* Desktop: collapsed by default, expand on hover. Mobile: full drawer. */}
      <aside
        className={[
          'fixed top-0 left-0 z-50 h-screen flex flex-col',
          'bg-[var(--bg-secondary)] border-r border-[var(--border)]',
          'overflow-y-auto overflow-x-hidden scrollbar-hidden',
          'transition-[width] duration-300 ease-in-out',
          'lg:translate-x-0',
          sidebarMobileOpen ? 'translate-x-0 w-[290px]' : '-translate-x-full',
          'lg:w-[72px] lg:hover:w-[290px] group',
        ].join(' ')}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between shrink-0 lg:justify-center lg:px-0 lg:group-hover:justify-between px-6 py-6 border-b border-[var(--border)] min-h-[72px]">
          <div className="flex items-center gap-3 lg:gap-0 lg:group-hover:gap-3">
            <div className="h-8 w-8 border border-[var(--accent)] flex items-center justify-center shrink-0">
              <span className="font-display text-sm font-semibold text-[var(--accent)]">S</span>
            </div>
            <div className="hidden lg:block overflow-hidden w-0 lg:group-hover:w-auto whitespace-nowrap transition-[width] duration-300">
              <h1 className="font-display text-sm font-medium tracking-[2px] text-[var(--text-primary)] uppercase pl-3">
                S · O · N · E
              </h1>
              <p className="text-[0.5rem] tracking-[3px] text-[var(--text-muted)] uppercase pl-3">
                Studios
              </p>
            </div>
          </div>
          <button
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--accent)] shrink-0"
            onClick={() => setSidebarMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 lg:px-4 py-6" aria-label="Main navigation">
          <p className="text-eyebrow px-3 mb-4 hidden lg:block overflow-hidden w-0 h-0 lg:group-hover:w-auto lg:group-hover:h-auto opacity-0 lg:group-hover:opacity-100 transition-all duration-200">
            Navigation
          </p>
          <p className="text-eyebrow px-3 mb-4 lg:hidden">Navigation</p>
          <ul className="flex flex-col gap-0.5">
            {filteredNav.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={`${basePath}/${item.path}`}
                  onClick={() => setSidebarMobileOpen(false)}
                  className={({ isActive }: { isActive: boolean }) =>
                    [
                      'flex items-center gap-3 px-3 py-2.5 min-h-[40px] rounded-r',
                      'text-nav transition-all duration-300',
                      'lg:justify-center lg:group-hover:justify-start',
                      isActive
                        ? 'border-l-2 border-[var(--accent)] text-[var(--accent)] bg-[rgba(201,169,97,0.08)]'
                        : 'border-l-2 border-transparent hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[rgba(201,169,97,0.08)]',
                    ].join(' ')
                  }
                >
                  <span className="opacity-70 shrink-0">{item.icon}</span>
                  <span className="hidden lg:inline overflow-hidden w-0 lg:group-hover:w-auto lg:group-hover:inline whitespace-nowrap transition-[width] duration-300">
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Favourites: icon only when collapsed */}
          <div className="mt-8">
            <p className="text-eyebrow px-3 mb-4 hidden lg:block overflow-hidden w-0 h-0 lg:group-hover:w-auto lg:group-hover:h-auto opacity-0 lg:group-hover:opacity-100 transition-all duration-200">
              Favourites
            </p>
            <p className="text-eyebrow px-3 mb-4 lg:hidden">Favourites</p>
            <div className="px-3 py-2 text-[0.7rem] text-[var(--text-muted)] flex items-center gap-2 lg:justify-center lg:group-hover:justify-start">
              <Star className="h-3 w-3 shrink-0" />
              <span className="hidden lg:inline overflow-hidden w-0 lg:group-hover:w-auto whitespace-nowrap">
                Pin projects here
              </span>
            </div>
          </div>
        </nav>

        {user && (
          <div className="border-t border-[var(--border)] shrink-0">
            <NavLink
              to={`${basePath}/profile`}
              className="flex items-center gap-3 px-6 py-3 hover:bg-[rgba(201,169,97,0.08)] transition-colors lg:justify-center lg:group-hover:justify-start lg:px-6"
              onClick={() => setSidebarMobileOpen(false)}
            >
              <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="lg" />
              <div className="hidden lg:flex flex-col min-w-0 overflow-hidden w-0 lg:group-hover:w-auto lg:group-hover:flex whitespace-nowrap transition-[width] duration-300">
                <span className="text-[0.78rem] font-body font-medium text-[var(--text-primary)] truncate">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[0.6rem] text-[var(--text-muted)] tracking-wider uppercase">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <User className="h-4 w-4 ml-auto text-[var(--text-muted)] hidden lg:group-hover:block shrink-0" />
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-6 py-3 text-[0.75rem] text-[var(--text-muted)] hover:text-[var(--status-danger)] hover:bg-[rgba(239,68,68,0.08)] transition-all lg:justify-center lg:group-hover:justify-start lg:px-6"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline overflow-hidden w-0 lg:group-hover:w-auto whitespace-nowrap transition-[width] duration-300">
                Sign Out
              </span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
