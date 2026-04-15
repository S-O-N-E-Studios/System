import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import { useUiStore } from '@/store/uiStore';
import { getApiBaseUrl } from './apiBaseUrl';

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Do not chain access-token refresh for these requests:
 * - `/auth/refresh` itself (avoid nested handling / loops)
 * - Public auth routes that legitimately return 401 (wrong password, validation, etc.)
 */
function skipAccessTokenRefresh(config: InternalAxiosRequestConfig | undefined): boolean {
  const u = String(config?.url ?? '');
  if (!u) return false;
  if (u.includes('/auth/refresh')) return true;
  const publicAuth = [
    '/auth/login',
    '/auth/register-org',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/accept-invite',
    '/auth/client-activate',
  ];
  return publicAuth.some((p) => u.includes(p));
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const slug = useTenantStore.getState().getSlug();
  if (slug) {
    config.headers['X-Tenant-Slug'] = slug;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && skipAccessTokenRefresh(originalRequest)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const refreshUrl = `${getApiBaseUrl()}/auth/refresh`;

        // Cookie-based refresh must send credentials; body optional when refresh JWT is only in httpOnly cookie.
        const { data: raw } = refreshToken
          ? await axios.post(refreshUrl, { refreshToken }, { withCredentials: true })
          : await axios.post(refreshUrl, {}, { withCredentials: true });

        const body = raw?.data ?? raw;
        useAuthStore.getState().refreshTokens({
          accessToken: body.accessToken,
          refreshToken: body.refreshToken,
        });

        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        useAuthStore.getState().logout();
        // Avoid full-page navigation to `/` when already on login — that re-ran bootstrap and spammed POST /auth/refresh.
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status && error.response.status >= 500) {
      useUiStore.getState().addToast({
        type: 'error',
        message: 'A server error occurred. Please try again.',
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
