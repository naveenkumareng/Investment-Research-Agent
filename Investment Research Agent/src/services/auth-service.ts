import { apiClient } from "@/lib/api-client";
import type { AuthSession, User } from "@/types";

/**
 * Authentication service - connects to Spring Boot backend
 * Endpoints:
 *   POST /api/auth/login     -> { token, refreshToken, user }
 *   POST /api/auth/register  -> { token, refreshToken, user }
 *   POST /api/auth/refresh   -> { token, refreshToken, user }
 *   GET  /api/auth/me        -> { id, name, email, role, createdAt }
 *   GET  /api/auth/health    -> Health check
 */

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  message?: string;
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string, _remember?: boolean): Promise<AuthSession> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/login", {
        email,
        password,
        remember: _remember,
      });

      if (!response.data.token || !response.data.user) {
        throw new Error("Invalid response from server");
      }

      return {
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        user: response.data.user,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Login failed";
      throw new Error(message);
    }
  },

  /**
   * Register new user
   */
  async register(name: string, email: string, password: string): Promise<AuthSession> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/register", {
        name,
        email,
        password,
        confirmPassword: password,
      });

      if (!response.data.token || !response.data.user) {
        throw new Error("Invalid response from server");
      }

      return {
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        user: response.data.user,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Registration failed";
      throw new Error(message);
    }
  },

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthSession> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/refresh", {
        refreshToken,
      });

      if (!response.data.token || !response.data.user) {
        throw new Error("Invalid response from server");
      }

      return {
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        user: response.data.user,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Token refresh failed";
      throw new Error(message);
    }
  },

  /**
   * Get current user info
   * Note: Requires valid JWT token in Authorization header
   */
  async me(): Promise<User> {
    try {
      const userId = localStorage.getItem("auth.user.id");
      if (!userId) {
        throw new Error("User ID not found");
      }

      const response = await apiClient.get<User>("/auth/me", {
        headers: {
          "X-User-Id": userId,
        },
      });

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to fetch user";
      throw new Error(message);
    }
  },

  /**
   * Health check
   */
  async health(): Promise<boolean> {
    try {
      await apiClient.get("/auth/health");
      return true;
    } catch {
      return false;
    }
  },
};
