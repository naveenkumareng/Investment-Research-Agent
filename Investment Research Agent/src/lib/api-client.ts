import axios, { type AxiosInstance } from "axios";

/**
 * Axios instance for the Spring Boot backend.
 * Base URL: http://localhost:8080/api
 *
 * Features:
 * - Automatic JWT token injection
 * - Automatic token refresh on 401 (Unauthorized)
 * - CORS support for localhost
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080") + "/api",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "auth.token";
const REFRESH_KEY = "auth.refresh";
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export const tokenStorage = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  getRefresh: () => (typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY)),
  set: (token: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// Request interceptor: Add JWT token to requests
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshToken = tokenStorage.getRefresh();
          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
          const response = await axios.post(
            `${baseURL}/api/auth/refresh`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );

          const { token, refreshToken: newRefreshToken } = response.data;
          tokenStorage.set(token, newRefreshToken);

          // Notify all subscribers that token is refreshed
          refreshSubscribers.forEach((callback) => callback(token));
          refreshSubscribers = [];

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          tokenStorage.clear();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // If already refreshing, queue the request
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }
    }

    return Promise.reject(error);
  }
);
