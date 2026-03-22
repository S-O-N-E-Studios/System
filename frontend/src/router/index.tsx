import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import {
  AuthGuard,
  TenantGuard,
  PermanentUserGuard,
  ClientGuard,
  DeptGuard,
  SuperAdminGuard,
} from './guards';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

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

// Lazy Imports - Public
const Login = lazy(() => import('@/features/auth/Login'));
const Register = lazy(() => import('@/features/auth/Register'));
const InviteAccept = lazy(() => import('@/features/auth/InviteAccept'));
const ClientActivate = lazy(() => import('@/features/auth/ClientActivate'));

// Lazy Imports - App Shell and Screens
const AppShell = lazy(() => import('@/components/layout/AppShell'));
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'));
const DepartmentView = lazy(() => import('@/features/departments/DepartmentView'));
const Projects = lazy(() => import('@/features/projects/Projects'));
const ProjectDetail = lazy(() => import('@/features/projects/ProjectDetail'));
const ProjectForm = lazy(() => import('@/features/projects/ProjectForm'));
const Kanban = lazy(() => import('@/features/kanban/Kanban'));
const Calendar = lazy(() => import('@/features/calendar/Calendar'));
const Grants = lazy(() => import('@/features/grants/Grants'));
const IDPView = lazy(() => import('@/features/idp/IDPView'));
const NormalServices = lazy(() => import('@/features/services/NormalServices'));
const Reports = lazy(() => import('@/features/reports/Reports'));
const MapsView = lazy(() => import('@/features/maps/MapsView'));
const FileManager = lazy(() => import('@/features/files/FileManager'));
const Settings = lazy(() => import('@/features/settings/Settings'));
const Profile = lazy(() => import('@/features/auth/Profile'));

// Lazy Imports - Super Admin
const SuperAdminTenants = lazy(() => import('@/features/superadmin/Tenants'));
const SuperAdminTenantDetail = lazy(() => import('@/features/superadmin/TenantDetail'));

// Router Configuration
export const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <LazyRoute component={Login} /> },
  { path: '/register', element: <LazyRoute component={Register} /> },
  { path: '/invite/:token', element: <LazyRoute component={InviteAccept} /> },
  { path: '/client-access/:token', element: <LazyRoute component={ClientActivate} /> },

  // Authenticated routes
  {
    element: <AuthGuard />,
    children: [
      // Tenant-scoped routes
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

              // Routes blocked for CLIENT_TEMP users
              {
                element: <PermanentUserGuard />,
                children: [
                  { path: 'dashboard', element: <LazyRoute component={Dashboard} /> },
                  { path: 'idp', element: <LazyRoute component={IDPView} /> },
                  { path: 'services', element: <LazyRoute component={NormalServices} /> },
                  { path: 'kanban', element: <LazyRoute component={Kanban} /> },
                  { path: 'calendar', element: <LazyRoute component={Calendar} /> },
                  { path: 'grants', element: <LazyRoute component={Grants} /> },
                  { path: 'reports', element: <LazyRoute component={Reports} /> },
                  { path: 'maps', element: <LazyRoute component={MapsView} /> },
                  { path: 'files', element: <LazyRoute component={FileManager} /> },
                  { path: 'settings/*', element: <LazyRoute component={Settings} /> },
                ],
              },

              // Department routes (with DeptGuard)
              {
                path: 'departments/:deptId',
                element: <DeptGuard />,
                children: [
                  { index: true, element: <LazyRoute component={DepartmentView} /> },
                ],
              },

              // Project routes (CLIENT_TEMP scoped via ClientGuard)
              { path: 'projects', element: <LazyRoute component={Projects} /> },
              { path: 'projects/new', element: <LazyRoute component={ProjectForm} /> },
              {
                path: 'projects/:id',
                element: <ClientGuard />,
                children: [
                  { index: true, element: <LazyRoute component={ProjectDetail} /> },
                ],
              },
              { path: 'projects/:id/edit', element: <LazyRoute component={ProjectForm} /> },

              { path: 'profile', element: <LazyRoute component={Profile} /> },
            ],
          },
        ],
      },

      // Super Admin routes
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
