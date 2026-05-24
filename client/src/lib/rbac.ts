import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CarFront,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  MapPinned,
  PackageOpen,
  Route,
  Settings2,
  Truck,
  Users2,
  Wrench,
  Warehouse,
} from "lucide-react";

import type { UserRole } from "@/types";

export interface RoleNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
}

export const allRoles: UserRole[] = ["Admin", "Transport Manager", "Warehouse Staff", "Driver"];

export const routeTitles: Record<string, string> = {
  "/app": "Dashboard",
  "/app/fleet": "Fleet",
  "/app/shipments": "Shipments",
  "/app/drivers": "Drivers",
  "/app/analytics": "Analytics",
  "/app/notifications": "Notifications",
  "/app/dispatch": "Dispatch Queue",
  "/app/route-planner": "Route Planning",
  "/app/assignments": "Driver Assignment",
  "/app/maintenance": "Maintenance",
  "/app/user-activity": "User Activity",
  "/app/settings": "Settings",
  "/app/incoming-shipments": "Incoming Shipments",
  "/app/outgoing-shipments": "Outgoing Shipments",
  "/app/loading-tasks": "Loading Tasks",
  "/app/my-trips": "My Trips",
  "/app/delivery-updates": "Delivery Updates",
  "/app/route-details": "Route Details",
};

const adminNav: RoleNavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/fleet", label: "Fleet", icon: CarFront },
  { to: "/app/shipments", label: "Shipments", icon: PackageOpen },
  { to: "/app/drivers", label: "Drivers", icon: Users2 },
  { to: "/app/analytics", label: "Analytics", icon: Gauge },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/app/user-activity", label: "User Activity", icon: Activity },
  { to: "/app/settings", label: "Settings", icon: Settings2 },
];

const transportManagerNav: RoleNavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/fleet", label: "Fleet", icon: CarFront },
  { to: "/app/shipments", label: "Shipments", icon: PackageOpen },
  { to: "/app/assignments", label: "Driver Assignment", icon: ClipboardList },
  { to: "/app/route-planner", label: "Route Planning", icon: MapPinned },
  { to: "/app/analytics", label: "Analytics", icon: Gauge },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
];

const warehouseNav: RoleNavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/dispatch", label: "Dispatch Queue", icon: ClipboardList },
  { to: "/app/incoming-shipments", label: "Incoming Shipments", icon: Truck },
  { to: "/app/outgoing-shipments", label: "Outgoing Shipments", icon: PackageOpen },
  { to: "/app/loading-tasks", label: "Loading Tasks", icon: Warehouse },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
];

const driverNav: RoleNavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/my-trips", label: "My Trips", icon: Truck },
  { to: "/app/delivery-updates", label: "Delivery Updates", icon: Bell },
  { to: "/app/route-details", label: "Route Details", icon: Route },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
];

export const roleNavigation: Record<UserRole, RoleNavItem[]> = {
  Admin: adminNav,
  "Transport Manager": transportManagerNav,
  "Warehouse Staff": warehouseNav,
  Driver: driverNav,
};

export const roleRouteAccess: Record<string, UserRole[]> = {
  "/app": allRoles,
  "/app/fleet": ["Admin", "Transport Manager"],
  "/app/shipments": ["Admin", "Transport Manager", "Warehouse Staff"],
  "/app/drivers": ["Admin", "Transport Manager"],
  "/app/analytics": ["Admin", "Transport Manager"],
  "/app/notifications": allRoles,
  "/app/dispatch": ["Transport Manager", "Warehouse Staff"],
  "/app/route-planner": ["Transport Manager", "Driver"],
  "/app/assignments": ["Transport Manager"],
  "/app/maintenance": ["Admin"],
  "/app/user-activity": ["Admin"],
  "/app/settings": ["Admin"],
  "/app/incoming-shipments": ["Warehouse Staff"],
  "/app/outgoing-shipments": ["Warehouse Staff"],
  "/app/loading-tasks": ["Warehouse Staff"],
  "/app/my-trips": ["Driver"],
  "/app/delivery-updates": ["Driver"],
  "/app/route-details": ["Driver"],
};

export const getNavigationForRole = (role: UserRole | null | undefined) => {
  if (!role) {
    return roleNavigation.Admin;
  }

  return roleNavigation[role];
};

export const getRouteTitle = (pathname: string) => routeTitles[pathname] || "SmartFleet";
