import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/router';
import { useAuthStore } from '@/store/authStore';
import '@/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const savedTheme = localStorage.getItem('sone-theme') ?? 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

async function restoreSession() {
  const store = useAuthStore.getState();
  const refreshToken = store.getStoredRefreshToken();

  if (!refreshToken) {
    store.setLoading(false);
    return;
  }

  try {
    const axios = (await import('axios')).default;
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

    const { data: refreshData } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    const tokens = refreshData.data ?? refreshData;

    store.refreshTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    const { data: meData } = await axios.get(`${baseURL}/users/me`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    const user = meData.data ?? meData;

    store.login(user, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch {
    store.logout();
  }
}

restoreSession().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>
  );
});
