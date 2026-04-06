import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/router';
import { useAuthStore } from '@/store/authStore';
import '@/styles/globals.css';
import { authApi } from '@/api/auth';
import 'leaflet/dist/leaflet.css';

// Hydrate auth session on load (cookie-based refresh tokens on real backend).
// When using mock auth, don't auto-login; keep the existing "login-first" dev flow.
const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH !== 'false';

if (useMockAuth) {
  useAuthStore.getState().setLoading(false);
} else {
  useAuthStore.getState().setLoading(true);

  void (async () => {
    try {
      const tokens = await authApi.refreshToken();
      const user = await authApi.getMe();
      useAuthStore.getState().login(user, tokens);
    } catch {
      useAuthStore.getState().logout();
      useAuthStore.getState().setLoading(false);
    }
  })();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Apply persisted theme on load
const savedTheme = localStorage.getItem('p360-theme') ?? 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
