import { Navigate, useLocation } from "react-router-dom";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { roleRouteAccess } from "@/lib/rbac";
import type { UserRole } from "@/types";

export const ProtectedRoute = ({
  children,
  roles,
}: {
  children: JSX.Element;
  roles?: UserRole[];
}) => {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-16 w-64" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const routeKey = Object.keys(roleRouteAccess)
    .filter((route) => location.pathname === route || location.pathname.startsWith(`${route}/`))
    .sort((left, right) => right.length - left.length)[0];
  const allowedRoles = routeKey ? roleRouteAccess[routeKey] : roles;

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }

  return children;
};
