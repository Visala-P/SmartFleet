import { Navigate } from "react-router-dom";

import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { DriverDashboard } from "@/components/dashboards/DriverDashboard";
import { TransportManagerDashboard } from "@/components/dashboards/TransportManagerDashboard";
import { WarehouseStaffDashboard } from "@/components/dashboards/WarehouseStaffDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { normalizeAuthRole, type AuthRole } from "@/types";

const DashboardSkeleton = () => (
  <div className="w-full min-w-0 overflow-x-hidden space-y-6 pb-6">
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={`kpi-skeleton-${index}`} className="border-border/70 bg-card">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-36" />
          </CardContent>
        </Card>
      ))}
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2 border-border/70 bg-card">
        <CardContent className="space-y-4 p-4">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-[320px] w-full rounded-2xl" />
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card">
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </CardContent>
      </Card>
    </section>
  </div>
);

const renderDashboard = (role: AuthRole | null) => {
  switch (role) {
    case "transport_manager":
      return <TransportManagerDashboard />;
    case "warehouse_staff":
      return <WarehouseStaffDashboard />;
    case "driver":
      return <DriverDashboard />;
    case "admin":
    default:
      return <AdminDashboard />;
  }
};

export const DashboardDispatcher = () => {
  const { user, loading } = useAuth();
  const role = normalizeAuthRole(user?.rbacRole ?? user?.role);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return <div className="w-full min-w-0 overflow-x-hidden">{renderDashboard(role)}</div>;
};

export default DashboardDispatcher;
