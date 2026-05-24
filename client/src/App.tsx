import { Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ToastRegion } from "@/components/ui/toast-region";
import { ToastProvider } from "@/hooks/useToast";
import type { UserRole } from "@/types";
import { DashboardPage } from "@/pages/app/DashboardPage";
import { DriversPage } from "@/pages/app/DriversPage";
import { FleetPage } from "@/pages/app/FleetPage";
import { AnalyticsPage } from "@/pages/app/AnalyticsPage";
import { NotificationsPage } from "@/pages/app/NotificationsPage";
import { ShipmentsPage } from "@/pages/app/ShipmentsPage";
import DispatchPage from "@/pages/app/DispatchPage";
import RoutePlannerPage from "@/pages/app/RoutePlannerPage";
import AssignmentsPage from "@/pages/app/AssignmentsPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/RegisterPage";
import { LandingPage } from "@/pages/public/LandingPage";

const allRoles: UserRole[] = ["Admin", "Transport Manager", "Warehouse Staff", "Driver"];
const adminAndManager: UserRole[] = ["Admin", "Transport Manager"];
const adminOnly: UserRole[] = ["Admin"];
const managerOnly: UserRole[] = ["Transport Manager"];
const warehouseOnly: UserRole[] = ["Warehouse Staff"];
const driverOnly: UserRole[] = ["Driver"];

const App = () => (
  <ToastProvider>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="fleet" element={<ProtectedRoute roles={adminAndManager}><FleetPage /></ProtectedRoute>} />
        <Route path="shipments" element={<ProtectedRoute roles={["Admin", "Transport Manager", "Warehouse Staff"]}><ShipmentsPage /></ProtectedRoute>} />
        <Route path="drivers" element={<ProtectedRoute roles={adminAndManager}><DriversPage /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute roles={adminAndManager}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute roles={allRoles}><NotificationsPage /></ProtectedRoute>} />
        <Route path="dispatch" element={<ProtectedRoute roles={["Transport Manager", "Warehouse Staff"]}><DispatchPage /></ProtectedRoute>} />
        <Route path="route-planner" element={<ProtectedRoute roles={["Transport Manager", "Driver"]}><RoutePlannerPage /></ProtectedRoute>} />
        <Route path="assignments" element={<ProtectedRoute roles={managerOnly}><AssignmentsPage /></ProtectedRoute>} />
        <Route path="maintenance" element={<ProtectedRoute roles={adminOnly}><FleetPage /></ProtectedRoute>} />
        <Route path="user-activity" element={<ProtectedRoute roles={adminOnly}><NotificationsPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute roles={adminOnly}><NotificationsPage /></ProtectedRoute>} />
        <Route path="incoming-shipments" element={<ProtectedRoute roles={warehouseOnly}><ShipmentsPage /></ProtectedRoute>} />
        <Route path="outgoing-shipments" element={<ProtectedRoute roles={warehouseOnly}><ShipmentsPage /></ProtectedRoute>} />
        <Route path="loading-tasks" element={<ProtectedRoute roles={warehouseOnly}><DispatchPage /></ProtectedRoute>} />
        <Route path="my-trips" element={<ProtectedRoute roles={driverOnly}><DashboardPage /></ProtectedRoute>} />
        <Route path="delivery-updates" element={<ProtectedRoute roles={driverOnly}><NotificationsPage /></ProtectedRoute>} />
        <Route path="route-details" element={<ProtectedRoute roles={driverOnly}><RoutePlannerPage /></ProtectedRoute>} />
      </Route>
    </Routes>

    <ToastRegion />
  </ToastProvider>
);

export default App;
