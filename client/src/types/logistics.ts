export type LogisticsRole = "Admin" | "Transport Manager" | "Warehouse Staff" | "Driver";

export type LogisticsSeverity = "low" | "medium" | "high" | "critical";

export type LogisticsShipmentStatus = "Pending" | "Ready" | "Loading" | "In Transit" | "Delayed" | "Delivered";

export type LogisticsVehicleStatus = "Available" | "In Transit" | "Maintenance" | "Inactive";

export type LogisticsDriverStatus = "Available" | "Driving" | "On Break" | "Off Duty";

export interface LogisticsTimelineEntry {
  id: string;
  label: string;
  details: string;
  timestamp: string;
  tone?: LogisticsSeverity;
}

export interface LogisticsAlert {
  id: string;
  title: string;
  details: string;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: string;
  acknowledged: boolean;
}

export interface LogisticsShipment {
  id: string;
  shipmentId: string;
  warehouse: string;
  route: string;
  origin: string;
  destination: string;
  status: LogisticsShipmentStatus;
  progress: number;
  priority: "Low" | "Medium" | "High" | "Critical";
  eta: string;
  updatedAt: string;
  driverName?: string;
  vehicleId?: string;
}

export interface LogisticsVehicle {
  id: string;
  vehicleId: string;
  vehicleType: string;
  warehouse: string;
  status: LogisticsVehicleStatus;
  fuelLevel: number;
  healthScore: number;
  nextServiceAt: string;
  lastServiceAt: string;
  assignedDriver?: string;
}

export interface LogisticsDriver {
  id: string;
  name: string;
  employeeId: string;
  route: string;
  status: LogisticsDriverStatus;
  tripsCompleted: number;
  onTimeRate: number;
  safetyScore: number;
  fuelEfficiency: number;
}

export interface LogisticsLog {
  id: string;
  actor: string;
  title: string;
  description: string;
  timestamp: string;
  tone: LogisticsSeverity;
}

export interface LogisticsKpi {
  label: string;
  value: string | number;
  delta: string;
  tone: LogisticsSeverity;
  hint: string;
}

export interface LogisticsMaintenanceLog {
  id: string;
  vehicleId: string;
  status: LogisticsVehicleStatus;
  lastServiceAt: string;
  nextServiceAt: string;
  fuelLevel: number;
}
