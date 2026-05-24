import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import api from "@/lib/api";
import {
  AUTH_ROLE_STORAGE_KEY,
  AUTH_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  DEMO_CREDENTIALS,
  LEGACY_AUTH_ROLE_STORAGE_KEY,
  normalizeAuthRole,
  normalizeRoleLabel,
  type AuthRole,
  type AuthSession,
  type AuthUser,
  type UserRole,
} from "@/types";

type AuthApiUser = Partial<AuthUser> & {
  token?: string;
  accessToken?: string;
  authToken?: string;
};

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  rbacRole: AuthRole | null;
  token: string | null;
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

const AUTH_KEYS = [AUTH_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY, AUTH_ROLE_STORAGE_KEY, LEGACY_AUTH_ROLE_STORAGE_KEY];
const THEME_KEY = "smartfleet_theme";

const safeStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const safeSessionStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const readJson = <T,>(value: string | null): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const buildSession = (user: AuthUser, token: string, rbacRole: AuthRole): AuthSession => ({
  user: {
    ...user,
    role: normalizeRoleLabel(user.rbacRole ?? user.role),
    rbacRole,
    isActive: user.isActive ?? true,
  },
  token,
  rbacRole,
});

const persistSession = (session: AuthSession) => {
  const storage = safeStorage();
  if (!storage) return;

  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  storage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token);
  storage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
  storage.setItem(AUTH_ROLE_STORAGE_KEY, session.rbacRole);
  storage.setItem(LEGACY_AUTH_ROLE_STORAGE_KEY, session.user.role);
};

const clearAuthStorage = () => {
  const storage = safeStorage();
  const sessionStorageRef = safeSessionStorage();

  if (storage) {
    const theme = storage.getItem(THEME_KEY);
    AUTH_KEYS.forEach((key) => storage.removeItem(key));
    if (theme !== null) {
      storage.setItem(THEME_KEY, theme);
    }
  }

  if (sessionStorageRef) {
    AUTH_KEYS.forEach((key) => sessionStorageRef.removeItem(key));
  }
};

const readStoredSession = (): AuthSession | null => {
  const storage = safeStorage();
  if (!storage) return null;

  const storedSession = readJson<AuthSession>(storage.getItem(AUTH_STORAGE_KEY));
  if (storedSession?.user && storedSession.token) {
    const rbacRole = normalizeAuthRole(storedSession.rbacRole ?? storedSession.user.rbacRole ?? storedSession.user.role);
    if (!rbacRole) return null;
    return buildSession(storedSession.user, storedSession.token, rbacRole);
  }

  const storedUser = readJson<AuthUser>(storage.getItem(AUTH_USER_STORAGE_KEY));
  const storedToken = storage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const storedRole = storage.getItem(AUTH_ROLE_STORAGE_KEY) ?? storage.getItem(LEGACY_AUTH_ROLE_STORAGE_KEY);

  if (!storedUser || !storedToken || !storedRole) return null;

  const rbacRole = normalizeAuthRole(storedRole as AuthRole | UserRole);
  if (!rbacRole) return null;

  return buildSession(
    {
      ...storedUser,
      role: normalizeRoleLabel(storedUser.rbacRole ?? storedUser.role),
      rbacRole,
      isActive: storedUser.isActive ?? true,
    },
    storedToken,
    rbacRole
  );
};

const isDemoCredential = (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  // Support existing demo credentials plus a single Admin/Admin fallback
  if (normalizedEmail === "admin" && password === "Admin") {
    return { email: "admin", password: "Admin", role: "admin" } as const;
  }

  return Object.values(DEMO_CREDENTIALS).find((credential) => credential.email === normalizedEmail && credential.password === password) ?? null;
};

const createDemoSession = (email: string, password: string): AuthSession | null => {
  const credential = isDemoCredential(email, password);
  if (!credential) return null;

  const role = credential.role;
  return buildSession(
    {
      id: `demo-${role}`,
      name: normalizeRoleLabel(role),
      email: credential.email,
      role: normalizeRoleLabel(role),
      rbacRole: role,
      isActive: true,
    },
    `demo-${role}-token`,
    role
  );
};

const createApiSession = (payload: AuthApiUser): AuthSession | null => {
  if (!payload.email) return null;

  const rbacRole = normalizeAuthRole(payload.rbacRole ?? payload.role);
  if (!rbacRole) return null;

  const user: AuthUser = {
    id: payload.id || payload.email,
    name: payload.name || normalizeRoleLabel(rbacRole),
    email: payload.email,
    role: normalizeRoleLabel(payload.role ?? rbacRole),
    rbacRole,
    isActive: payload.isActive ?? true,
  };

  const token = payload.token ?? payload.accessToken ?? payload.authToken ?? "";
  return buildSession(user, token, rbacRole);
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);

    try {
      const storedSession = readStoredSession();
      if (storedSession) {
        setUser(storedSession.user);
        setToken(storedSession.token);
        return;
      }

      const { data } = await api.get<{ user?: AuthApiUser; token?: string; accessToken?: string; authToken?: string }>("/auth/me");
      const session = data.user ? createApiSession({ ...data.user, token: data.token ?? data.accessToken ?? data.authToken }) : null;

      if (session) {
        persistSession(session);
        setUser(session.user);
        setToken(session.token);
        return;
      }

      setUser(null);
      setToken(null);
    } catch (err: unknown) {
      const fallbackSession = readStoredSession();
      if (fallbackSession) {
        setUser(fallbackSession.user);
        setToken(fallbackSession.token);
      } else {
        setUser(null);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    // Try real backend login first. If backend is unreachable or login fails,
    // allow a local demo fallback (single Admin/Admin account) for offline demo mode.
    try {
      const { data } = await api.post<{ user?: AuthApiUser; token?: string; accessToken?: string; authToken?: string }>("/auth/login", {
        email,
        password,
      });

      const session = data.user ? createApiSession({ ...data.user, token: data.token ?? data.accessToken ?? data.authToken }) : null;
      if (!session) {
        throw new Error("Invalid authentication response");
      }

      persistSession(session);
      setUser(session.user);
      setToken(session.token);
      return;
    } catch (error: unknown) {
      // If backend is down or returns an error, permit demo login for offline use.
      const offlineDemoSession = createDemoSession(email, password);
      if (offlineDemoSession) {
        persistSession(offlineDemoSession);
        setUser(offlineDemoSession.user);
        setToken(offlineDemoSession.token);
        return;
      }

      if (error instanceof Error) throw error;
      throw new Error(String(error));
    }
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
    } catch (err: unknown) {
      // Ignore backend logout failures and continue with local teardown.
    } finally {
      clearAuthStorage();
      setUser(null);
      setToken(null);

      if (typeof window !== "undefined") {
        const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
        const loginPath = `${basePath}/login`.replace(/\/\/+/, "/");
        const currentPath = window.location.pathname || "/";
        if (!currentPath.endsWith("/login") && currentPath !== loginPath) {
          window.location.replace(loginPath.startsWith("/") ? loginPath : `/${loginPath}`);
        }
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      rbacRole: user?.rbacRole ?? normalizeAuthRole(user?.role),
      token,
      loading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, token, loading, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
