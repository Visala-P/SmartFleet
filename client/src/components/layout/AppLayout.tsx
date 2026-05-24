import { Outlet, useLocation } from "react-router-dom";

import { SidebarLayout } from "@/components/shared/SidebarLayout";
import { useAuth } from "@/context/AuthContext";
import { getNavigationForRole, getRouteTitle } from "@/lib/rbac";

export const AppLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const title = getRouteTitle(location.pathname);
  const navigation = getNavigationForRole(user?.role);

  return (
    <SidebarLayout
      title={title}
      userName={user?.name || "User"}
      role={user?.role || "Role"}
      navigation={navigation}
      onLogout={logout}
      brandName="SmartFleet"
    >
      <Outlet />
    </SidebarLayout>
  );
};
