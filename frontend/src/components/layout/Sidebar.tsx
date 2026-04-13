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
import { useProjectStore } from '@/store/projectStore';
import Avatar from '@/components/ui/Avatar';
import BrandMarkSvg from '@/components/ui/BrandMarkSvg';
import { useCan } from '@/rbac/useCan';
import type { Permission } from '@/rbac/permissions';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  permission?: Permission;
}

export default function Sidebar() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user } = useAuthStore();
  const { sidebarMobileOpen, setSidebarMobileOpen } = useUiStore();
  const can = useCan();

  const tenantRole = user && tenantSlug ? user.tenants.find((t) => t.slug === tenantSlug)?.role : undefined;
  const isClientTemp = tenantRole === 'CLIENT_TEMP';
  const pinnedProjects = useProjectStore((s) => (tenantSlug ? s.getPinnedProjects(tenantSlug) : []));

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 shrink-0" />, path: 'dashboard', permission: 'view_dashboard' },
    { label: 'Projects', icon: <FolderKanban className="h-4 w-4 shrink-0" />, path: 'projects', permission: 'view_projects' },
    { label: 'Multi-Year Planning', icon: <CalendarDays className="h-4 w-4 shrink-0" />, path: 'planning', permission: 'view_planning' },
    { label: 'IDP View', icon: <FileSpreadsheet className="h-4 w-4 shrink-0" />, path: 'idp', permission: 'view_idp' },
    { label: 'Normal Services', icon: <Layers className="h-4 w-4 shrink-0" />, path: 'services', permission: 'view_services' },
    {
      label: 'Kanban Board',
      icon: <Columns3 className="h-4 w-4 shrink-0" />,
      path: 'kanban',
      permission: 'view_kanban',
    },
    { label: 'Calendar', icon: <CalendarDays className="h-4 w-4 shrink-0" />, path: 'calendar', permission: 'view_calendar' },
    { label: 'Grants', icon: <Landmark className="h-4 w-4 shrink-0" />, path: 'grants', permission: 'view_grants' },
    { label: 'Reports', icon: <FileBarChart className="h-4 w-4 shrink-0" />, path: 'reports', permission: 'view_reports' },
    { label: 'Maps', icon: <MapPin className="h-4 w-4 shrink-0" />, path: 'maps', permission: 'view_maps' },
    { label: 'Files', icon: <FolderOpen className="h-4 w-4 shrink-0" />, path: 'files', permission: 'view_files' },
    {
      label: 'Settings',
      icon: <Settings className="h-4 w-4 shrink-0" />,
      path: 'settings',
      permission: 'view_settings',
    },
  ];

  const filteredNav = navItems.filter((item) => {
    if (!item.permission) return true;
    // If auth isn't ready yet, don't hide everything.
    if (!user) return true;
    return can(item.permission);
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
            <BrandMarkSvg />
            <div className="overflow-hidden lg:w-0 lg:group-hover:w-auto max-w-[200px] transition-[width] duration-300">
              <h1 className="text-eyebrow pl-4 leading-tight">
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
          <p className="text-eyebrow px-3 mb-4 lg:overflow-hidden lg:w-0 lg:h-0 lg:group-hover:w-auto lg:group-hover:h-auto lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200">
            Navigation
          </p>
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
                  <span className="overflow-hidden lg:w-0 lg:group-hover:w-auto whitespace-nowrap transition-[width] duration-300">
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>

          {!isClientTemp && (
            <div className="mt-8">
              <p className="text-eyebrow px-3 mb-4 lg:overflow-hidden lg:w-0 lg:h-0 lg:group-hover:w-auto lg:group-hover:h-auto lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200">
                Favourites
              </p>
              {pinnedProjects.length === 0 ? (
                <div className="px-3 py-2 text-[0.7rem] text-[var(--text-muted)] flex items-center gap-2 lg:justify-center lg:group-hover:justify-start">
                  <Star className="h-3 w-3 shrink-0" />
                  <span className="overflow-hidden lg:w-0 lg:group-hover:w-auto whitespace-nowrap transition-[width] duration-300">
                    Pin projects here
                  </span>
                </div>
              ) : (
                <ul className="px-3 py-1 flex flex-col gap-1">
                  {pinnedProjects.map((p) => (
                    <li key={p.id}>
                      <NavLink
                        to={`${basePath}/projects/${p.id}`}
                        onClick={() => setSidebarMobileOpen(false)}
                        className={({ isActive }: { isActive: boolean }) =>
                          [
                            'flex items-center gap-3 px-3 py-2 min-h-[36px]',
                            'text-nav transition-all duration-300',
                            'lg:justify-center lg:group-hover:justify-start',
                            isActive
                              ? 'border-l-2 border-[var(--accent-sand)] text-[var(--accent-sand)] bg-[var(--accent-sand-glow)]'
                              : 'border-l-2 border-transparent hover:border-[var(--accent-sand)] hover:text-[var(--accent-sand)] hover:bg-[var(--accent-sand-glow)]',
                          ].join(' ')
                        }
                      >
                        <Star className="h-3 w-3 shrink-0 text-[var(--accent-sand)] fill-[var(--accent-sand)]" />
                        <span className="overflow-hidden lg:w-0 lg:group-hover:w-auto whitespace-nowrap transition-[width] duration-300">
                          {p.name}
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
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
            <div className="flex flex-col min-w-0 overflow-hidden lg:w-0 lg:group-hover:w-auto whitespace-nowrap transition-[width] duration-300">
              <span className="text-[0.78rem] font-medium text-[var(--text-primary)] truncate">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-[0.6rem] text-[var(--text-muted)] tracking-wider uppercase">
                {(tenantRole ?? user.role).replace(/_/g, ' ')}
              </span>
            </div>
            <User className="h-4 w-4 ml-auto text-[var(--text-muted)] lg:hidden lg:group-hover:block shrink-0" />
          </NavLink>
        )}
      </aside>
    </>
  );
}
