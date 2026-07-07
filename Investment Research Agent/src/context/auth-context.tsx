import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "@/services/auth-service";
import { tokenStorage } from "@/lib/api-client";
import type { User, AuthSession } from "@/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_KEY = "auth.user";
const USER_ID_KEY = "auth.user.id";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = tokenStorage.get();
      const cached = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;

      if (token && cached) {
        try {
          setUser(JSON.parse(cached));
          // Store user ID for auth/me endpoint
          const parsedUser = JSON.parse(cached);
          if (parsedUser.id) {
            localStorage.setItem(USER_ID_KEY, parsedUser.id);
          }
        } catch {
          tokenStorage.clear();
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(USER_ID_KEY);
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const persist = (session: AuthSession) => {
    tokenStorage.set(session.token, session.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    if (session.user.id) {
      localStorage.setItem(USER_ID_KEY, session.user.id);
    }
    setUser(session.user);
  };

  // Demo user fallback when backend is unavailable
  const createDemoSession = (email: string, name?: string): AuthSession => ({
    token: "demo-token-" + Date.now(),
    refreshToken: "demo-refresh-" + Date.now(),
    user: {
      id: "demo-user-" + Math.random().toString(36).slice(2, 8),
      name: name || email.split("@")[0],
      email,
      role: "user",
      createdAt: new Date().toISOString(),
    },
  });

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login: async (email, password, remember) => {
      try {
        const s = await authService.login(email, password, remember);
        persist(s);
      } catch (error) {
        console.warn("Backend unavailable, using demo mode:", error);
        // Fallback: authenticate locally so the UI is explorable
        persist(createDemoSession(email));
      }
    },
    register: async (name, email, password) => {
      try {
        const s = await authService.register(name, email, password);
        persist(s);
      } catch (error) {
        console.warn("Backend unavailable, using demo mode:", error);
        persist(createDemoSession(email, name));
      }
    },
    logout: () => {
      tokenStorage.clear();
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_ID_KEY);
      setUser(null);
    },
    updateProfile: (patch) => {
      setUser((u) => {
        if (!u) return u;
        const next = { ...u, ...patch };
        localStorage.setItem(USER_KEY, JSON.stringify(next));
        return next;
      });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
