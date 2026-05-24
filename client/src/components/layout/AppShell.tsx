import { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { SidebarLayout } from "@/components/shared/SidebarLayout";
import { useAuth } from "@/context/AuthContext";
import { getNavigationForRole, getRouteTitle, roleRouteAccess } from "@/lib/rbac";
import type { UserRole } from "@/types";

interface AppShellProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  brandName?: string;
}

const normalizePath = (pathname: string) => {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
};

const matchesRoute = (pathname: string, route: string) => {
  const normalizedPath = normalizePath(pathname);
  const normalizedRoute = normalizePath(route);

  return normalizedPath === normalizedRoute || normalizedPath.startsWith(`${normalizedRoute}/`);
};

const getFallbackRoute = (role: UserRole | null | undefined) => {
  const navigation = getNavigationForRole(role);
  return navigation[0]?.to ?? "/app";
};

const getMatchedRoute = (pathname: string, role: UserRole | null | undefined) => {
  if (!role) return null;

  const accessibleRoutes = Object.entries(roleRouteAccess)
    .filter(([, roles]) => roles.includes(role))
    .map(([route]) => route)
    .sort((left, right) => right.length - left.length);

  return accessibleRoutes.find((route) => matchesRoute(pathname, route)) ?? null;
};

export const AppShell = ({ children, title, subtitle, brandName = "SmartFleet" }: AppShellProps) => {
  const location = useLocation();
  const { user, loading, logout } = useAuth();

  const currentRole = user?.role ?? null;
  const navigation = useMemo(() => getNavigationForRole(currentRole), [currentRole]);
  const resolvedTitle = title ?? getRouteTitle(location.pathname);
  const resolvedSubtitle = subtitle ?? (currentRole ? `${currentRole} workspace` : undefined);
  const allowedRoute = useMemo(() => getMatchedRoute(location.pathname, currentRole), [currentRole, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="space-y-4">
              <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
              <div className="h-8 w-3/4 animate-pulse rounded-2xl bg-muted" />
              <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (!allowedRoute && location.pathname !== "/app") {
    return <Navigate replace to={getFallbackRoute(currentRole)} />;
  }

  const shellContent = children ?? <Outlet />;

  return (
    <SidebarLayout
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      brandName={brandName}
      userName={user.name}
      role={user.role}
      navigation={navigation}
      onLogout={logout}
    >
      {shellContent}
    </SidebarLayout>
  );
};
