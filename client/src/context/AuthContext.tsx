import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import api from "@/lib/api";
import type { AuthUser } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role?: AuthUser["role"];
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const clearClientAuthState = () => {
  // Preserve UI preferences such as theme across logout
  try {
    const theme = localStorage.getItem("smartfleet_theme");
    // Clear other keys but keep theme
    localStorage.clear();
    if (theme) localStorage.setItem("smartfleet_theme", theme);
  } catch (e) {
    // Fallback to clearing everything if access fails
    try {
      localStorage.clear();
    } catch (e) {
      /* ignore */
    }
  }

  try {
    sessionStorage.clear();
  } catch (e) {
    /* ignore */
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: AuthUser }>("/auth/me");
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  // Development convenience: auto-set a local dev user when running locally and
  // the backend is not present. Also allow role override via `?as=Role` query
  // parameter for quick manual testing (e.g. /app?as=Driver).
  useEffect(() => {
    if (import.meta.env.DEV) {
      // wait until initial refresh completes
      if (!loading && !user) {
        try {
          const params = new URLSearchParams(window.location.search);
          const as = params.get("as");
          const validRoles = ["Admin", "Transport Manager", "Driver", "Warehouse Staff"] as const;
          const role = validRoles.includes(as as any) ? (as as AuthUser['role']) : ("Admin" as AuthUser['role']);
          setUser({ id: "dev-user", name: role, email: "dev@local", role, isActive: true });
        } catch (e) {
          // ignore in non-browser environments
        }
      }
    }
  }, [loading, user]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ user: AuthUser }>("/auth/login", { email, password });
    setUser(data.user);
  }, []);

  const signup = useCallback(async (payload: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role?: AuthUser["role"];
  }) => {
    await api.post("/auth/signup", payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearClientAuthState();
      setUser(null);
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, loading, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
