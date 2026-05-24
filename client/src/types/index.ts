export type UserRole = "Admin" | "Transport Manager" | "Driver" | "Warehouse Staff";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
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
