export type AuthRole = "admin" | "transport_manager" | "warehouse_staff" | "driver";
export type UserRole = "Admin" | "Transport Manager" | "Warehouse Staff" | "Driver";

export const AUTH_ROLES: AuthRole[] = ["admin", "transport_manager", "warehouse_staff", "driver"];

export const AUTH_ROLE_LABELS: Record<AuthRole, UserRole> = {
  admin: "Admin",
  transport_manager: "Transport Manager",
  warehouse_staff: "Warehouse Staff",
  driver: "Driver",
};

export const LEGACY_ROLE_TO_AUTH_ROLE: Record<UserRole, AuthRole> = {
  Admin: "admin",
  "Transport Manager": "transport_manager",
  "Warehouse Staff": "warehouse_staff",
  Driver: "driver",
};

export const AUTH_STORAGE_KEY = "smartfleet_auth_session";
export const AUTH_TOKEN_STORAGE_KEY = "smartfleet_auth_token";
export const AUTH_USER_STORAGE_KEY = "smartfleet_auth_user";
export const AUTH_ROLE_STORAGE_KEY = "smartfleet_auth_role";
export const LEGACY_AUTH_ROLE_STORAGE_KEY = "smartfleet_role";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rbacRole?: AuthRole;
  isActive: boolean;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  rbacRole: AuthRole;
}

export interface Vehicle {
  _id: string;
  vehicleNumber: string;
  type: string;
  capacity: number;
  driverAssigned?: { _id: string; name: string; employeeId: string };
  status: "Available" | "In Transit" | "Maintenance" | "Inactive";
  fuelLevel?: number;
  insuranceExpiryDate: string;
  lastServiceDate: string;
  nextServiceDate: string;
}

export interface Driver {
  _id: string;
  employeeId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  availabilityStatus: "Available" | "On Trip" | "On Leave";
  rating: number;
  completedTrips: number;
  onTimeRate: number;
  safetyScore: number;
}

export interface Shipment {
  _id: string;
  shipmentId: string;
  title: string;
  origin: string;
  destination: string;
  progress?: number;
  vehicle?: { _id: string; vehicleNumber: string };
  driver?: { _id: string; name: string };
  status: "Pending" | "In Transit" | "Delivered" | "Delayed";
  priority: "Low" | "Medium" | "High" | "Critical";
  weight: number;
  scheduledPickup: string;
  estimatedDelivery: string;
  deliveredAt?: string;
  timeline?: {
    label: string;
    timestamp: Date;
    note?: string;
  }[];
}

export interface NotificationItem {
  _id: string;
  type: "Shipment Delay" | "Maintenance" | "Task" | "Info";
  title: string;
  message: string;
  audienceRoles: UserRole[];
  isReadBy: string[];
  createdAt: string;
}

export const isAuthRole = (value: string | null | undefined): value is AuthRole =>
  value === "admin" || value === "transport_manager" || value === "warehouse_staff" || value === "driver";

export const isUserRole = (value: string | null | undefined): value is UserRole =>
  value === "Admin" || value === "Transport Manager" || value === "Warehouse Staff" || value === "Driver";

export const normalizeRoleLabel = (role: AuthRole | UserRole): UserRole => {
  if (role === "admin") return "Admin";
  if (role === "transport_manager") return "Transport Manager";
  if (role === "warehouse_staff") return "Warehouse Staff";
  if (role === "driver") return "Driver";
  return role;
};

export const normalizeAuthRole = (role: AuthRole | UserRole | null | undefined): AuthRole | null => {
  if (!role) return null;
  if (isAuthRole(role)) return role;
  if (isUserRole(role)) return LEGACY_ROLE_TO_AUTH_ROLE[role];
  return null;
};
