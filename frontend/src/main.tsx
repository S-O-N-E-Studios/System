import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/router';
import { useAuthStore } from '@/store/authStore';
import '@/styles/globals.css';
import { authApi } from '@/api/auth';
import 'leaflet/dist/leaflet.css';
import {
  applyCustomAccentColors,
  CUSTOM_ACCENT_PERIWINKLE_KEY,
  CUSTOM_ACCENT_SAND_KEY,
} from '@/utils/customAccentColors';
import { syncAppFavicon } from '@/utils/syncAppFavicon';

// Hydrate auth session on load via cookie-based refresh tokens.
useAuthStore.getState().setLoading(true);

void (async () => {
  try {
    const tokens = await authApi.refreshToken();
    useAuthStore.getState().refreshTokens(tokens);
    const user = await authApi.getMe();
    useAuthStore.getState().login(user, tokens);
  } catch {
    useAuthStore.getState().logout();
    useAuthStore.getState().setLoading(false);
  }
})();

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

// Apply persisted user accent colours (overrides default Sahara tokens).
const savedPeriwinkle = localStorage.getItem(CUSTOM_ACCENT_PERIWINKLE_KEY);
const savedSand = localStorage.getItem(CUSTOM_ACCENT_SAND_KEY);
if (savedPeriwinkle && savedSand) {
  applyCustomAccentColors({ periwinkleHex: savedPeriwinkle, sandHex: savedSand });
}

document.title = 'EVIDENTIARY';

syncAppFavicon();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
