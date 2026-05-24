import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { faker } from "@faker-js/faker";

import type { Driver, NotificationItem, Shipment, Vehicle } from "@/types";

faker.seed(20260523);

type KPIName = "activeDeliveries" | "delayedShipments" | "vehiclesActive" | "fuelConsumption" | "driversOnDuty";

interface DashboardSnapshot {
  kpis: Record<KPIName, number>;
  deliveriesTrend: { month: string; deliveries: number }[];
  fleetUtilization: { status: string; value: number }[];
  fuelUsage: { month: string; liters: number }[];
  delayAnalytics: { month: string; delays: number }[];
  activityFeed: string[];
}

interface SimulationContextValue {
  vehicles: Vehicle[];
  shipments: Shipment[];
  drivers: Driver[];
  notifications: NotificationItem[];
  inventory: any[];
  docks: any[];
  dashboard: DashboardSnapshot;
  createVehicle: (payload: Omit<Vehicle, "_id">) => void;
  updateVehicle: (id: string, payload: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  createShipment: (payload: Partial<Shipment>) => void;
  updateShipment: (id: string, payload: Partial<Shipment>) => void;
  deleteShipment: (id: string) => void;
  createDriver: (payload: Partial<Driver>) => void;
  updateDriver: (id: string, payload: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  markNotificationRead: (id: string) => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

const locations = ["Hyderabad", "Chennai", "Bangalore", "Pune", "Mumbai", "Aurangabad", "Nashik", "Vijayawada"];
const vehicleTypes = ["Container Truck", "Flatbed", "Light Commercial", "Reefer", "Tanker", "Pickup"];
const shipmentStatuses: Shipment["status"][] = ["Pending", "In Transit", "Delivered", "Delayed"];
const vehicleStatuses: Vehicle["status"][] = ["Available", "In Transit", "Maintenance", "Inactive"];
const driverStatuses: Driver["availabilityStatus"][] = ["Available", "On Trip", "On Leave"];

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const randomId = (prefix: string, min = 100, max = 999) => `${prefix}-${faker.number.int({ min, max })}`;

const buildDrivers = (): Driver[] =>
  Array.from({ length: 12 }).map((_, index) => ({
    _id: faker.string.uuid(),
    employeeId: `DRV-${100 + index}`,
    name: faker.person.fullName(),
    phone: faker.phone.number("+91-##########"),
    licenseNumber: `DL${faker.number.int({ min: 10, max: 99 })}${faker.string.alphanumeric({ length: 6, casing: "upper" })}`,
    availabilityStatus: pick(driverStatuses),
    rating: Number(faker.number.float({ min: 4.2, max: 5, fractionDigits: 1 })),
    completedTrips: faker.number.int({ min: 84, max: 520 }),
    onTimeRate: faker.number.int({ min: 85, max: 99 }),
    safetyScore: faker.number.int({ min: 88, max: 100 }),
  }));

const buildVehicles = (drivers: Driver[]): Vehicle[] =>
  Array.from({ length: 16 }).map((_, index) => {
    const driver = faker.helpers.arrayElement([...drivers, undefined]);
    const status = pick(vehicleStatuses);
    return {
      _id: faker.string.uuid(),
      vehicleNumber: index < 5 ? `TRK-${800 + index}` : randomId(index % 2 ? "TRK" : "VAN", 200, 999),
      type: pick(vehicleTypes),
      capacity: faker.number.int({ min: 3500, max: 24000 }),
      driverAssigned: driver
        ? { _id: driver._id, name: driver.name, employeeId: driver.employeeId }
        : undefined,
      status,
      insuranceExpiryDate: faker.date.soon({ days: 120 }).toISOString(),
      lastServiceDate: faker.date.recent({ days: 80 }).toISOString(),
      nextServiceDate: faker.date.soon({ days: 45 }).toISOString(),
    };
  });

const buildShipments = (vehicles: Vehicle[], drivers: Driver[]): Shipment[] =>
  Array.from({ length: 18 }).map((_, index) => {
    const vehicle = faker.helpers.arrayElement([...vehicles, undefined]);
    const driver = vehicle?.driverAssigned
      ? drivers.find((entry) => entry._id === vehicle.driverAssigned?._id)
      : faker.helpers.arrayElement([...drivers, undefined]);
    const status = index < 4 ? "In Transit" : pick(shipmentStatuses);
    const source = pick(locations);
    const destination = pick(locations.filter((item) => item !== source));
    return {
      _id: faker.string.uuid(),
      shipmentId: `SHP-${1000 + index}`,
      title: `${faker.commerce.productAdjective()} ${faker.commerce.product()} - ${source} to ${destination}`,
      origin: `${source} Warehouse ${faker.number.int({ min: 1, max: 4 })}`,
      destination: `${destination} Hub ${faker.number.int({ min: 1, max: 4 })}`,
      vehicle: vehicle ? { _id: vehicle._id, vehicleNumber: vehicle.vehicleNumber } : undefined,
      driver: driver ? { _id: driver._id, name: driver.name } : undefined,
      status,
      priority: faker.helpers.arrayElement(["Low", "Medium", "High", "Critical"] as Shipment["priority"][]),
      weight: faker.number.int({ min: 800, max: 22000 }),
      scheduledPickup: faker.date.soon({ days: 5 }).toISOString(),
      estimatedDelivery: faker.date.soon({ days: 9 }).toISOString(),
      deliveredAt: status === "Delivered" ? faker.date.recent({ days: 5 }).toISOString() : undefined,
      timeline: [
        { label: "Shipment Created", timestamp: faker.date.recent({ days: 7 }), note: "Auto-generated from ERP" },
        ...(status !== "Pending"
          ? [{ label: "Loaded", timestamp: faker.date.recent({ days: 4 }), note: "Dock verification completed" }]
          : []),
      ],
    };
  });

const buildNotifications = (): NotificationItem[] =>
  Array.from({ length: 8 }).map((_, index) => ({
    _id: faker.string.uuid(),
    type: faker.helpers.arrayElement(["Shipment Delay", "Maintenance", "Task", "Info"] as NotificationItem["type"][]),
    title: [`Vehicle maintenance due`, `Driver assignment updated`, `Shipment delay alert`, `Delivery completed`][index % 4],
    message: faker.helpers.arrayElement([
      `Vehicle ${randomId("TRK", 200, 999)} requires service within 72 hours.`,
      `Driver ${faker.person.firstName()} assigned to upcoming route.`,
      `Shipment ${randomId("SHP", 1000, 9999)} delayed by traffic on NH-48.`,
      `Shipment ${randomId("SHP", 1000, 9999)} delivered and closed from the control tower.`,
    ]),
    audienceRoles: ["Admin", "Transport Manager"],
    isReadBy: [],
    createdAt: faker.date.recent({ days: 3 }).toISOString(),
  }));

const buildDashboard = (vehicles: Vehicle[], shipments: Shipment[], drivers: Driver[]): DashboardSnapshot => {
  const deliveriesTrend = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => ({
    month,
    deliveries: faker.number.int({ min: 68, max: 142 }),
  }));

  const fleetUtilization = [
    { status: "Available", value: vehicles.filter((item) => item.status === "Available").length },
    { status: "In Transit", value: vehicles.filter((item) => item.status === "In Transit").length },
    { status: "Maintenance", value: vehicles.filter((item) => item.status === "Maintenance").length },
    { status: "Inactive", value: vehicles.filter((item) => item.status === "Inactive").length },
  ];

  const fuelUsage = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => ({
    month,
    liters: faker.number.int({ min: 6500, max: 8200 }),
  }));

  const delayAnalytics = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => ({
    month,
    delays: faker.number.int({ min: 2, max: 17 }),
  }));

  const activityFeed = [
    `Vehicle ${pick(vehicles).vehicleNumber} assigned to shipment ${pick(shipments).shipmentId}`,
    `Driver ${pick(drivers).name} checked in at ${pick(locations)} Warehouse`,
    `Shipment ${pick(shipments).shipmentId} delayed due to traffic`,
    `Fuel refill scheduled for ${pick(vehicles).vehicleNumber}`,
  ];

  return {
    kpis: {
      activeDeliveries: shipments.filter((item) => item.status === "In Transit").length,
      delayedShipments: shipments.filter((item) => item.status === "Delayed").length,
      vehiclesActive: vehicles.filter((item) => item.status !== "Inactive").length,
      fuelConsumption: faker.number.int({ min: 1020, max: 1890 }),
      driversOnDuty: drivers.filter((item) => item.availabilityStatus === "On Trip").length,
    },
    deliveriesTrend,
    fleetUtilization,
    fuelUsage,
    delayAnalytics,
    activityFeed,
  };
};

export const SmartFleetSimulationProvider = ({ children }: { children: React.ReactNode }) => {
  const [drivers, setDrivers] = useState<Driver[]>(() => buildDrivers());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => buildVehicles(drivers));
  const [shipments, setShipments] = useState<Shipment[]>(() => buildShipments(vehicles, drivers));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => buildNotifications());
  const [inventory, setInventory] = useState<any[]>([]);
  const [docks, setDocks] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSnapshot>(() => buildDashboard(vehicles, shipments, drivers));

  const createVehicle = useCallback((payload: Omit<Vehicle, "_id">) => {
    const item = { ...payload, _id: faker.string.uuid() };
    setVehicles((current) => [item, ...current]);
  }, []);

  const updateVehicle = useCallback((id: string, payload: Partial<Vehicle>) => {
    setVehicles((current) => current.map((item) => (item._id === id ? { ...item, ...payload } : item)));
  }, []);

  const deleteVehicle = useCallback((id: string) => {
    setVehicles((current) => current.filter((item) => item._id !== id));
  }, []);

  const createShipment = useCallback((payload: Partial<Shipment>) => {
    const item: Shipment = {
      _id: faker.string.uuid(),
      shipmentId: payload.shipmentId || `SHP-${faker.number.int({ min: 1000, max: 9999 })}`,
      title: payload.title || "New Shipment",
      origin: payload.origin || pick(locations),
      destination: payload.destination || pick(locations),
      vehicle: payload.vehicle,
      driver: payload.driver,
      status: (payload.status as Shipment["status"]) || "Pending",
      priority: (payload.priority as Shipment["priority"]) || "Medium",
      weight: payload.weight || faker.number.int({ min: 800, max: 22000 }),
      scheduledPickup: payload.scheduledPickup || new Date().toISOString(),
      estimatedDelivery: payload.estimatedDelivery || faker.date.soon({ days: 4 }).toISOString(),
      deliveredAt: payload.deliveredAt,
      timeline: [{ label: "Shipment Created", timestamp: new Date(), note: "Created in console" }],
    };
    setShipments((current) => [item, ...current]);
  }, []);

  const updateShipment = useCallback((id: string, payload: Partial<Shipment>) => {
    setShipments((current) =>
      current.map((item) => {
        if (item._id !== id) return item;
        const next: Shipment = { ...item, ...payload };
        if (payload.status && payload.status !== item.status) {
          next.timeline = [
            ...item.timeline,
            { label: `Status changed to ${payload.status}`, timestamp: new Date(), note: "Live console update" },
          ];
        }
        return next;
      })
    );
  }, []);

  const deleteShipment = useCallback((id: string) => {
    setShipments((current) => current.filter((item) => item._id !== id));
  }, []);

  const createDriver = useCallback((payload: Partial<Driver>) => {
    const item: Driver = {
      _id: faker.string.uuid(),
      employeeId: payload.employeeId || `DRV-${faker.number.int({ min: 100, max: 999 })}`,
      name: payload.name || faker.person.fullName(),
      phone: payload.phone || faker.phone.number("+91-##########"),
      licenseNumber: payload.licenseNumber || `DL${faker.number.int({ min: 10, max: 99 })}${faker.string.alphanumeric({ length: 6, casing: "upper" })}`,
      availabilityStatus: (payload.availabilityStatus as Driver["availabilityStatus"]) || "Available",
      rating: payload.rating || 4.6,
      completedTrips: payload.completedTrips || 0,
      onTimeRate: payload.onTimeRate || 93,
      safetyScore: payload.safetyScore || 95,
    };
    setDrivers((current) => [item, ...current]);
  }, []);

  const updateDriver = useCallback((id: string, payload: Partial<Driver>) => {
    setDrivers((current) => current.map((item) => (item._id === id ? { ...item, ...payload } : item)));
  }, []);

  const deleteDriver = useCallback((id: string) => {
    setDrivers((current) => current.filter((item) => item._id !== id));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((current) => current.map((item) => (item._id === id ? { ...item, isReadBy: [...item.isReadBy, "me"] } : item)));
  }, []);

  useEffect(() => {
    setDashboard(buildDashboard(vehicles, shipments, drivers));
  }, [vehicles, shipments, drivers]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVehicles((current) =>
        current.map((item) => {
          const fuelDrop = faker.number.int({ min: 0, max: 2 });
          const lowerFuel = Math.max(8, faker.number.int({ min: 18, max: 100 }) - fuelDrop);
          const nextStatus = Math.random() > 0.82 ? pick(vehicleStatuses) : item.status;
          return { ...item, status: nextStatus, fuelLevel: lowerFuel } as Vehicle;
        })
      );

      setShipments((current) =>
        current.map((item) => {
          if (item.status === "Delivered") return item;
          const advance = faker.number.int({ min: 3, max: 15 });
          const newStatus = Math.random() > 0.75 ? pick(["In Transit", "Delayed", "Delivered"] as Shipment["status"][]) : item.status;
          return {
            ...item,
            status: newStatus,
            estimatedDelivery: new Date(Date.now() + advance * 3600 * 1000).toISOString(),
            deliveredAt: newStatus === "Delivered" ? new Date().toISOString() : item.deliveredAt,
          };
        })
      );

      setDrivers((current) =>
        current.map((item) => ({
          ...item,
          availabilityStatus: Math.random() > 0.75 ? pick(driverStatuses) : item.availabilityStatus,
          completedTrips: item.completedTrips + (Math.random() > 0.6 ? 1 : 0),
        }))
      );

      setNotifications((current) => {
        const shouldAdd = Math.random() > 0.45;
        if (!shouldAdd) return current.slice(0, 12);
        const generated: NotificationItem = {
          _id: faker.string.uuid(),
          type: faker.helpers.arrayElement(["Shipment Delay", "Maintenance", "Task", "Info"] as NotificationItem["type"][]),
          title: faker.helpers.arrayElement([
            "Route update received",
            "Maintenance window created",
            "Driver assignment changed",
            "Delivery milestone reached",
          ]),
          message: faker.helpers.arrayElement([
            `Shipment ${randomId("SHP", 1000, 9999)} updated by control tower.`,
            `Vehicle ${randomId("TRK", 200, 999)} scheduled for maintenance.`,
            `Driver ${faker.person.firstName()} reassigned to route ${pick(locations)}.`,
            `Delivery completed at ${pick(locations)} warehouse.`,
          ]),
          audienceRoles: ["Admin", "Transport Manager"],
          isReadBy: [],
          createdAt: new Date().toISOString(),
        };
        return [generated, ...current].slice(0, 15);
      });
    }, 7000);

    return () => window.clearInterval(interval);
  }, []);

  const value = useMemo(
    () => ({
      vehicles,
      shipments,
      drivers,
      notifications,
      inventory,
      docks,
      dashboard,
      createVehicle,
      updateVehicle,
      deleteVehicle,
      createShipment,
      updateShipment,
      deleteShipment,
      createDriver,
      updateDriver,
      deleteDriver,
      markNotificationRead,
    }),
    [vehicles, shipments, drivers, notifications, inventory, docks, dashboard, createVehicle, updateVehicle, deleteVehicle, createShipment, updateShipment, deleteShipment, createDriver, updateDriver, deleteDriver, markNotificationRead]
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
};

export const useSmartFleetSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) throw new Error("useSmartFleetSimulation must be used inside SmartFleetSimulationProvider");
  return context;
};