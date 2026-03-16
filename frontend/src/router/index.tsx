import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthGuard, TenantGuard, SuperAdminGuard } from './guards';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

// Skeleton fallback for lazy-loaded routes
function PageSkeleton() {
  return <LoadingOverlay />;
}

function LazyRoute({ component: Component }: { component: React.LazyExoticComponent<() => JSX.Element | null> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Component />
    </Suspense>
  );
}

// ─── Lazy Imports ───────────────────────────────────────────────────────
const Login = lazy(() => import('@/features/auth/Login'));
const Register = lazy(() => import('@/features/auth/Register'));
const InviteAccept = lazy(() => import('@/features/auth/InviteAccept'));
const AppShell = lazy(() => import('@/components/layout/AppShell'));
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'));
const Projects = lazy(() => import('@/features/projects/Projects'));
const ProjectDetail = lazy(() => import('@/features/projects/ProjectDetail'));
const ProjectForm = lazy(() => import('@/features/projects/ProjectForm'));
const Kanban = lazy(() => import('@/features/kanban/Kanban'));
const Reports = lazy(() => import('@/features/reports/Reports'));
const MapsView = lazy(() => import('@/features/maps/MapsView'));
const FileManager = lazy(() => import('@/features/files/FileManager'));
const Settings = lazy(() => import('@/features/settings/Settings'));
const Profile = lazy(() => import('@/features/auth/Profile'));
const SuperAdminTenants = lazy(() => import('@/features/superadmin/Tenants'));
const SuperAdminTenantDetail = lazy(() => import('@/features/superadmin/TenantDetail'));

// ─── Router Configuration ───────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    path: '/',
    element: <LazyRoute component={Login} />,
  },
  {
    path: '/register',
    element: <LazyRoute component={Register} />,
  },
  {
    path: '/invite/:token',
    element: <LazyRoute component={InviteAccept} />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        path: '/:tenantSlug',
        element: <TenantGuard />,
        children: [
          {
            element: (
              <Suspense fallback={<PageSkeleton />}>
                <AppShell />
              </Suspense>
            ),
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: 'dashboard', element: <LazyRoute component={Dashboard} /> },
              { path: 'projects', element: <LazyRoute component={Projects} /> },
              { path: 'projects/new', element: <LazyRoute component={ProjectForm} /> },
              { path: 'projects/:id', element: <LazyRoute component={ProjectDetail} /> },
              { path: 'projects/:id/edit', element: <LazyRoute component={ProjectForm} /> },
              { path: 'kanban', element: <LazyRoute component={Kanban} /> },
              { path: 'reports', element: <LazyRoute component={Reports} /> },
              { path: 'maps', element: <LazyRoute component={MapsView} /> },
              { path: 'files', element: <LazyRoute component={FileManager} /> },
              { path: 'settings/*', element: <LazyRoute component={Settings} /> },
              { path: 'profile', element: <LazyRoute component={Profile} /> },
            ],
          },
        ],
      },
      {
        path: '/super-admin',
        element: <SuperAdminGuard />,
        children: [
          { path: 'tenants', element: <LazyRoute component={SuperAdminTenants} /> },
          { path: 'tenants/:id', element: <LazyRoute component={SuperAdminTenantDetail} /> },
        ],
      },
    ],
  },
]);
