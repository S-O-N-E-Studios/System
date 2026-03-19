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
  CalendarDays,
  Landmark,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import Avatar from '@/components/ui/Avatar';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
  hideForClientTemp?: boolean;
}

export default function Sidebar() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user } = useAuthStore();
  const { sidebarMobileOpen, setSidebarMobileOpen } = useUiStore();

  const isClientTemp = user?.tenants[0]?.role === 'CLIENT_TEMP';

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 shrink-0" />, path: 'dashboard', hideForClientTemp: true },
    { label: 'Projects', icon: <FolderKanban className="h-4 w-4 shrink-0" />, path: 'projects' },
    { label: 'IDP View', icon: <FileSpreadsheet className="h-4 w-4 shrink-0" />, path: 'idp', hideForClientTemp: true },
    { label: 'Normal Services', icon: <Layers className="h-4 w-4 shrink-0" />, path: 'services', hideForClientTemp: true },
    {
      label: 'Kanban Board',
      icon: <Columns3 className="h-4 w-4 shrink-0" />,
      path: 'kanban',
      roles: ['PROJECT_MANAGER', 'ORG_ADMIN', 'SUPER_ADMIN'],
      hideForClientTemp: true,
    },
    { label: 'Calendar', icon: <CalendarDays className="h-4 w-4 shrink-0" />, path: 'calendar', hideForClientTemp: true },
    { label: 'Grants', icon: <Landmark className="h-4 w-4 shrink-0" />, path: 'grants', hideForClientTemp: true },
    { label: 'Reports', icon: <FileBarChart className="h-4 w-4 shrink-0" />, path: 'reports', hideForClientTemp: true },
    { label: 'Maps', icon: <MapPin className="h-4 w-4 shrink-0" />, path: 'maps', hideForClientTemp: true },
    { label: 'Files', icon: <FolderOpen className="h-4 w-4 shrink-0" />, path: 'files', hideForClientTemp: true },
    {
      label: 'Settings',
      icon: <Settings className="h-4 w-4 shrink-0" />,
      path: 'settings',
      roles: ['ORG_ADMIN', 'SUPER_ADMIN'],
      hideForClientTemp: true,
    },
  ];

  const filteredNav = navItems.filter((item) => {
    if (isClientTemp && item.hideForClientTemp) return false;
    if (item.roles && user && !item.roles.includes(user.role)) return false;
    return true;
  });

  const basePath = `/${tenantSlug}`;

  return (
    <>
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed top-0 left-0 z-50 h-screen flex flex-col',
          'bg-[var(--bg-surface)] border-r border-[var(--border-default)]',
          'overflow-y-auto overflow-x-hidden scrollbar-hidden',
          'transition-[width] duration-300 ease-in-out',
          'lg:translate-x-0',
          sidebarMobileOpen ? 'translate-x-0 w-[290px]' : '-translate-x-full',
          'lg:w-[72px] lg:hover:w-[290px] group',
        ].join(' ')}
      >
        <div className="flex items-center justify-between shrink-0 lg:justify-center lg:px-0 lg:group-hover:justify-between px-6 py-6 border-b border-[var(--border-default)] min-h-[72px]">
          <div className="flex items-center gap-3 lg:gap-0 lg:group-hover:gap-3">
            <div className="h-8 w-8 border border-[var(--accent-sand)] flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-[var(--accent-sand)]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>P</span>
            </div>
            <div className="hidden lg:block overflow-hidden w-0 lg:group-hover:w-auto whitespace-nowrap transition-[width] duration-300">
              <h1 className="text-sm font-medium tracking-[2px] text-[var(--text-primary)] uppercase pl-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Project 360
              </h1>
            </div>
          </div>
          <button
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--accent-sand)] shrink-0"
            onClick={() => setSidebarMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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
                      'flex items-center gap-3 px-3 py-2.5 min-h-[40px]',
                      'text-nav transition-all duration-300',
                      'lg:justify-center lg:group-hover:justify-start',
                      isActive
                        ? 'border-l-2 border-[var(--accent-sand)] text-[var(--accent-sand)] bg-[var(--accent-sand-glow)]'
                        : 'border-l-2 border-transparent hover:border-[var(--accent-sand)] hover:text-[var(--accent-sand)] hover:bg-[var(--accent-sand-glow)]',
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

          {!isClientTemp && (
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
          )}
        </nav>

        {user && (
          <NavLink
            to={`${basePath}/profile`}
            className="flex items-center gap-3 px-6 py-4 border-t border-[var(--border-default)] hover:bg-[var(--accent-sand-glow)] transition-colors shrink-0 lg:justify-center lg:group-hover:justify-start lg:px-6"
            onClick={() => setSidebarMobileOpen(false)}
          >
            <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="lg" />
            <div className="hidden lg:flex flex-col min-w-0 overflow-hidden w-0 lg:group-hover:w-auto lg:group-hover:flex whitespace-nowrap transition-[width] duration-300">
              <span className="text-[0.78rem] font-medium text-[var(--text-primary)] truncate">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-[0.6rem] text-[var(--text-muted)] tracking-wider uppercase">
                {user.role.replace(/_/g, ' ')}
              </span>
            </div>
            <User className="h-4 w-4 ml-auto text-[var(--text-muted)] hidden lg:group-hover:block shrink-0" />
          </NavLink>
        )}
      </aside>
    </>
  );
}
