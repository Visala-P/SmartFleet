import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

import {
  AUTH_ROLE_STORAGE_KEY,
  AUTH_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  DEMO_CREDENTIALS,
  LEGACY_AUTH_ROLE_STORAGE_KEY,
  normalizeAuthRole,
  normalizeRoleLabel,
  type AuthRole,
  type AuthSession,
  type AuthUser,
  type Driver,
  type NotificationItem,
  type Shipment,
  type Vehicle,
} from "@/types";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

type ApiMethod = "get" | "post" | "put" | "patch" | "delete";

type MockableRequestConfig = AxiosRequestConfig & {
  method?: ApiMethod;
  __mockFallbackApplied?: boolean;
};

interface PaginatedResponse<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface MockDatabase {
  auth: {
    user: AuthUser | null;
    token: string | null;
    rbacRole: AuthRole | null;
  };
  analytics: Record<string, unknown>;
  vehicles: Vehicle[];
  shipments: Shipment[];
  drivers: Driver[];
  notifications: NotificationItem[];
}

const API_TIMEOUT = 12000;
const MOCK_STORAGE_KEY = "smartfleet_mock_db";
const THEME_STORAGE_KEY = "smartfleet_theme";

const DEFAULT_ANALYTICS = {
  kpis: {
    totalDeliveries: 124,
    activeVehicles: 18,
    delayedShipments: 3,
    fleetHealth: 91,
    totalDrivers: 12,
    warehouseEfficiency: 87,
  },
  deliveriesTrend: [
    { month: "Jan", deliveries: 32 },
    { month: "Feb", deliveries: 41 },
    { month: "Mar", deliveries: 37 },
    { month: "Apr", deliveries: 53 },
    { month: "May", deliveries: 48 },
    { month: "Jun", deliveries: 56 },
  ],
  fleetUtilization: [
    { status: "Available", value: 8 },
    { status: "In Transit", value: 6 },
    { status: "Maintenance", value: 2 },
    { status: "Inactive", value: 1 },
  ],
  fuelUsage: [
    { month: "Jan", liters: 920 },
    { month: "Feb", liters: 880 },
    { month: "Mar", liters: 940 },
    { month: "Apr", liters: 870 },
    { month: "May", liters: 910 },
    { month: "Jun", liters: 860 },
  ],
  delayAnalytics: [
    { month: "Jan", delays: 2 },
    { month: "Feb", delays: 1 },
    { month: "Mar", delays: 3 },
    { month: "Apr", delays: 1 },
    { month: "May", delays: 2 },
    { month: "Jun", delays: 0 },
  ],
};

const createId = (prefix: string) => {
  const randomPart = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${randomPart}`;
};

const safeStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const readJson = <T,>(value: string | null): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const normalizeBaseUrl = () => {
  const viteBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const reactBaseUrl = process?.env?.REACT_APP_API_URL?.trim();
  const configuredBaseUrl = viteBaseUrl || reactBaseUrl;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return new URL("/api", window.location.origin).toString().replace(/\/+$/, "");
  }

  return "/api";
};

const api = axios.create({
  baseURL: normalizeBaseUrl(),
  withCredentials: true,
  timeout: API_TIMEOUT,
});

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const seedVehicles = (): Vehicle[] => [
  {
    _id: createId("veh"),
    vehicleNumber: "TRK-941",
    type: "Container Truck",
    capacity: 12000,
    status: "Available",
    fuelLevel: 96,
    insuranceExpiryDate: "2026-09-15T00:00:00.000Z",
    lastServiceDate: "2026-05-02T00:00:00.000Z",
    nextServiceDate: "2026-06-15T00:00:00.000Z",
  },
  {
    _id: createId("veh"),
    vehicleNumber: "VAN-348",
    type: "Delivery Van",
    capacity: 3500,
    status: "In Transit",
    fuelLevel: 83,
    insuranceExpiryDate: "2026-08-12T00:00:00.000Z",
    lastServiceDate: "2026-05-18T00:00:00.000Z",
    nextServiceDate: "2026-06-15T00:00:00.000Z",
  },
  {
    _id: createId("veh"),
    vehicleNumber: "TRK-802",
    type: "Heavy Hauler",
    capacity: 16000,
    status: "Available",
    fuelLevel: 95,
    insuranceExpiryDate: "2026-11-03T00:00:00.000Z",
    lastServiceDate: "2026-05-11T00:00:00.000Z",
    nextServiceDate: "2026-07-06T00:00:00.000Z",
  },
  {
    _id: createId("veh"),
    vehicleNumber: "TRK-956",
    type: "Refrigerated Truck",
    capacity: 9800,
    status: "Inactive",
    fuelLevel: 98,
    insuranceExpiryDate: "2026-12-20T00:00:00.000Z",
    lastServiceDate: "2026-05-20T00:00:00.000Z",
    nextServiceDate: "2026-06-06T00:00:00.000Z",
  },
];

const seedDrivers = (): Driver[] => [
  {
    _id: createId("drv"),
    employeeId: "EMP-201",
    name: "Seth R.",
    phone: "+91-90000-10001",
    licenseNumber: "DL-01-2024-0001",
    availabilityStatus: "Available",
    rating: 4.9,
    completedTrips: 64,
    onTimeRate: 97,
    safetyScore: 98,
  },
  {
    _id: createId("drv"),
    employeeId: "EMP-202",
    name: "Roland K.",
    phone: "+91-90000-10002",
    licenseNumber: "DL-01-2024-0002",
    availabilityStatus: "On Trip",
    rating: 4.8,
    completedTrips: 58,
    onTimeRate: 95,
    safetyScore: 96,
  },
  {
    _id: createId("drv"),
    employeeId: "EMP-203",
    name: "Brandi G.",
    phone: "+91-90000-10003",
    licenseNumber: "DL-01-2024-0003",
    availabilityStatus: "Available",
    rating: 4.7,
    completedTrips: 46,
    onTimeRate: 93,
    safetyScore: 94,
  },
  {
    _id: createId("drv"),
    employeeId: "EMP-204",
    name: "Karl B.",
    phone: "+91-90000-10004",
    licenseNumber: "DL-01-2024-0004",
    availabilityStatus: "On Leave",
    rating: 4.6,
    completedTrips: 39,
    onTimeRate: 90,
    safetyScore: 92,
  },
];

const seedShipments = (): Shipment[] => [
  {
    _id: createId("shp"),
    shipmentId: "SHP-1000",
    title: "Industrial parts batch",
    origin: "Mumbai Warehouse 3",
    destination: "Hyderabad Hub 1",
    vehicle: { _id: createId("vehref"), vehicleNumber: "VAN-348" },
    driver: { _id: createId("drvref"), name: "Seth R." },
    status: "In Transit",
    priority: "Low",
    weight: 1400,
    scheduledPickup: "2026-05-24T06:15:00.000Z",
    estimatedDelivery: "2026-05-24T14:30:00.000Z",
    timeline: [],
  },
  {
    _id: createId("shp"),
    shipmentId: "SHP-1001",
    title: "Retail stock replenishment",
    origin: "Pune Warehouse 2",
    destination: "Chennai Hub 1",
    vehicle: { _id: createId("vehref"), vehicleNumber: "TRK-802" },
    driver: { _id: createId("drvref"), name: "Roland K." },
    status: "In Transit",
    priority: "Critical",
    weight: 2100,
    scheduledPickup: "2026-05-24T08:45:00.000Z",
    estimatedDelivery: "2026-05-24T19:10:00.000Z",
    timeline: [],
  },
  {
    _id: createId("shp"),
    shipmentId: "SHP-1002",
    title: "Cold chain delivery",
    origin: "Mumbai Warehouse 1",
    destination: "Hyderabad Hub 1",
    vehicle: { _id: createId("vehref"), vehicleNumber: "TRK-956" },
    driver: { _id: createId("drvref"), name: "Brandi G." },
    status: "Delivered",
    priority: "Medium",
    weight: 980,
    scheduledPickup: "2026-05-22T07:30:00.000Z",
    estimatedDelivery: "2026-05-22T15:40:00.000Z",
    deliveredAt: "2026-05-22T15:12:00.000Z",
    timeline: [],
  },
  {
    _id: createId("shp"),
    shipmentId: "SHP-1003",
    title: "Urgent machinery parts",
    origin: "Delhi Warehouse 4",
    destination: "Bangalore Hub 2",
    vehicle: { _id: createId("vehref"), vehicleNumber: "TRK-941" },
    driver: { _id: createId("drvref"), name: "Karl B." },
    status: "Delayed",
    priority: "High",
    weight: 1750,
    scheduledPickup: "2026-05-24T05:15:00.000Z",
    estimatedDelivery: "2026-05-24T21:00:00.000Z",
    timeline: [],
  },
];

const seedNotifications = (): NotificationItem[] => [
  {
    _id: createId("ntf"),
    type: "Shipment Delay",
    title: "SHP-1003 delayed",
    message: "Traffic pressure on the Bangalore corridor.",
    audienceRoles: ["Admin", "Transport Manager"],
    isReadBy: [],
    createdAt: "2026-05-24T09:15:00.000Z",
  },
  {
    _id: createId("ntf"),
    type: "Maintenance",
    title: "TRK-956 service due",
    message: "Preventive maintenance is scheduled for the refrigerated truck.",
    audienceRoles: ["Admin", "Transport Manager"],
    isReadBy: [],
    createdAt: "2026-05-24T09:45:00.000Z",
  },
  {
    _id: createId("ntf"),
    type: "Task",
    title: "Loading dock assignment",
    message: "Warehouse staff should load dispatch bay 2.",
    audienceRoles: ["Warehouse Staff"],
    isReadBy: [],
    createdAt: "2026-05-24T10:05:00.000Z",
  },
  {
    _id: createId("ntf"),
    type: "Info",
    title: "Route update",
    message: "Driver route details refreshed for afternoon departures.",
    audienceRoles: ["Driver"],
    isReadBy: [],
    createdAt: "2026-05-24T10:25:00.000Z",
  },
];

const createSeedDatabase = (): MockDatabase => ({
  auth: { user: null, token: null, rbacRole: null },
  analytics: clone(DEFAULT_ANALYTICS),
  vehicles: seedVehicles(),
  shipments: seedShipments(),
  drivers: seedDrivers(),
  notifications: seedNotifications(),
});

const readMockDatabase = (): MockDatabase => {
  const storage = safeStorage();
  const stored = readJson<MockDatabase>(storage?.getItem(MOCK_STORAGE_KEY) ?? null);

  if (stored) return stored;

  const seed = createSeedDatabase();
  if (storage) {
    storage.setItem(MOCK_STORAGE_KEY, JSON.stringify(seed));
  }

  return seed;
};

const writeMockDatabase = (database: MockDatabase) => {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(MOCK_STORAGE_KEY, JSON.stringify(database));
};

const updateMockDatabase = (updater: (database: MockDatabase) => MockDatabase) => {
  const updated = updater(readMockDatabase());
  writeMockDatabase(updated);
  return updated;
};

const getStoredSession = (): AuthSession | null => {
  const storage = safeStorage();
  if (!storage) return null;

  const rawSession = readJson<AuthSession>(storage.getItem(AUTH_STORAGE_KEY));
  if (rawSession?.user && rawSession.token && rawSession.rbacRole) {
    return {
      ...rawSession,
      user: {
        ...rawSession.user,
        role: normalizeRoleLabel(rawSession.user.rbacRole ?? rawSession.user.role),
        rbacRole: rawSession.rbacRole,
        isActive: rawSession.user.isActive ?? true,
      },
      rbacRole: rawSession.rbacRole,
    };
  }

  const legacyUser = readJson<AuthUser>(storage.getItem(AUTH_USER_STORAGE_KEY));
  const legacyToken = storage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const legacyRole = storage.getItem(AUTH_ROLE_STORAGE_KEY) ?? storage.getItem(LEGACY_AUTH_ROLE_STORAGE_KEY);

  if (!legacyUser || !legacyToken || !legacyRole) return null;

  const rbacRole = normalizeAuthRole(legacyRole as AuthRole | AuthUser["role"]);
  if (!rbacRole) return null;

  return {
    user: {
      ...legacyUser,
      role: normalizeRoleLabel(legacyUser.rbacRole ?? legacyUser.role),
      rbacRole,
      isActive: legacyUser.isActive ?? true,
    },
    token: legacyToken,
    rbacRole,
  };
};

const persistAuthSession = (session: AuthSession) => {
  const storage = safeStorage();
  if (!storage) return;

  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  storage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token);
  storage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
  storage.setItem(AUTH_ROLE_STORAGE_KEY, session.rbacRole);
  storage.setItem(LEGACY_AUTH_ROLE_STORAGE_KEY, session.user.role);
};

const clearAuthStorage = () => {
  const storage = safeStorage();
  if (!storage) return;

  const theme = storage.getItem(THEME_STORAGE_KEY);
  [AUTH_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY, AUTH_ROLE_STORAGE_KEY, LEGACY_AUTH_ROLE_STORAGE_KEY].forEach((key) =>
    storage.removeItem(key)
  );

  if (theme !== null) {
    storage.setItem(THEME_STORAGE_KEY, theme);
  }
};

const parseRequestData = <T,>(data: unknown): T | null => {
  if (data == null) return null;
  if (typeof data === "string") {
    return readJson<T>(data);
  }
  return data as T;
};

const createSessionFromDemo = (email: string, password: string): AuthSession | null => {
  const normalizedEmail = email.trim().toLowerCase();
  const credential = Object.values(DEMO_CREDENTIALS).find((item) => item.email === normalizedEmail && item.password === password);

  if (!credential) return null;

  const userRole = normalizeRoleLabel(credential.role);
  return {
    user: {
      id: `demo-${credential.role}`,
      name: userRole,
      email: credential.email,
      role: userRole,
      rbacRole: credential.role,
      isActive: true,
    },
    token: `demo-${credential.role}-token`,
    rbacRole: credential.role,
  };
};

const createSessionFromApi = (payload: AuthUser & { token?: string; accessToken?: string; authToken?: string }) => {
  const rbacRole = normalizeAuthRole(payload.rbacRole ?? payload.role);
  if (!rbacRole) return null;

  return {
    user: {
      ...payload,
      id: payload.id || payload.email,
      name: payload.name || normalizeRoleLabel(rbacRole),
      role: normalizeRoleLabel(payload.role ?? rbacRole),
      rbacRole,
      isActive: payload.isActive ?? true,
    },
    token: payload.token ?? payload.accessToken ?? payload.authToken ?? `session-${rbacRole}`,
    rbacRole,
  } satisfies AuthSession;
};

const buildPaginatedResponse = <T,>(items: T[], params?: Record<string, string | number | boolean | undefined>): PaginatedResponse<T> => {
  const page = Math.max(1, Number(params?.page ?? 1) || 1);
  const limit = Math.max(1, Number(params?.limit ?? 10) || 10);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    items: clone(items.slice(start, start + limit)),
    meta: { page, limit, total, totalPages },
  };
};

const buildAnalyticsPayload = (database: MockDatabase) => {
  const delivered = database.shipments.filter((item) => item.status === "Delivered").length;
  const delayed = database.shipments.filter((item) => item.status === "Delayed").length;
  const activeVehicles = database.vehicles.filter((item) => item.status !== "Inactive").length;
  const onDutyDrivers = database.drivers.filter((item) => item.availabilityStatus === "On Trip").length;

  return {
    ...clone(DEFAULT_ANALYTICS),
    kpis: {
      totalDeliveries: delivered,
      activeVehicles,
      delayedShipments: delayed,
      fleetHealth: Math.max(72, 98 - delayed * 5),
      totalDrivers: database.drivers.length,
      warehouseEfficiency: Math.max(76, 90 - delayed * 2),
    },
    summary: {
      activeVehicles,
      onDutyDrivers,
      delayedShipments: delayed,
      deliveredShipments: delivered,
    },
  };
};

const respondWith = <T,>(config: InternalAxiosRequestConfig, data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config,
  request: undefined,
});

const shouldUseMockFallback = (error: unknown) => {
  if (!(error instanceof AxiosError)) return false;
  if (!error.config) return false;

  const status = error.response?.status;
  return error.code === "ECONNABORTED" || !error.response || (typeof status === "number" && status >= 400);
};

const resolveMockResponse = async (config: MockableRequestConfig) => {
  const method = (config.method ?? "get").toLowerCase() as ApiMethod;
  const path = (config.url ?? "").split("?")[0];
  const requestData = parseRequestData<Record<string, unknown>>(config.data);
  const database = readMockDatabase();

  if (path === "/auth/me" && method === "get") {
    const session = getStoredSession();
    return session ? { user: session.user, token: session.token } : { user: null };
  }

  if (path === "/auth/login" && method === "post") {
    const email = String(requestData?.email ?? "");
    const password = String(requestData?.password ?? "");
    const demoSession = createSessionFromDemo(email, password);

    if (!demoSession) return null;

    persistAuthSession(demoSession);
    return {
      user: demoSession.user,
      token: demoSession.token,
      rbacRole: demoSession.rbacRole,
    };
  }

  if (path === "/auth/logout" && method === "post") {
    clearAuthStorage();
    return { success: true };
  }

  if (path === "/auth/signup" && method === "post") {
    return { success: true };
  }

  if (path === "/analytics" && method === "get") {
    return buildAnalyticsPayload(database);
  }

  if (path === "/vehicles" && method === "get") {
    return buildPaginatedResponse(database.vehicles, config.params as Record<string, string | number | boolean | undefined> | undefined);
  }

  if (path === "/vehicles" && method === "post") {
    const payload = requestData as Partial<Vehicle>;
    const vehicle: Vehicle = {
      _id: createId("veh"),
      vehicleNumber: payload.vehicleNumber ?? `TRK-${Math.floor(Math.random() * 900 + 100)}`,
      type: payload.type ?? "Truck",
      capacity: payload.capacity ?? 0,
      driverAssigned: payload.driverAssigned,
      status: payload.status ?? "Available",
      fuelLevel: payload.fuelLevel ?? 100,
      insuranceExpiryDate: payload.insuranceExpiryDate ?? new Date().toISOString(),
      lastServiceDate: payload.lastServiceDate ?? new Date().toISOString(),
      nextServiceDate: payload.nextServiceDate ?? new Date().toISOString(),
    };

    updateMockDatabase((current) => ({ ...current, vehicles: [vehicle, ...current.vehicles] }));
    return vehicle;
  }

  if (path.startsWith("/vehicles/") && (method === "put" || method === "patch")) {
    const id = path.split("/")[2];
    const payload = requestData as Partial<Vehicle>;
    let updatedVehicle: Vehicle | null = null;

    updateMockDatabase((current) => ({
      ...current,
      vehicles: current.vehicles.map((vehicle) => {
        if (vehicle._id !== id) return vehicle;
        updatedVehicle = { ...vehicle, ...payload };
        return updatedVehicle;
      }),
    }));

    return updatedVehicle ?? null;
  }

  if (path.startsWith("/vehicles/") && method === "delete") {
    const id = path.split("/")[2];
    updateMockDatabase((current) => ({
      ...current,
      vehicles: current.vehicles.filter((vehicle) => vehicle._id !== id),
    }));
    return { success: true };
  }

  if (path === "/shipments" && method === "get") {
    return buildPaginatedResponse(database.shipments, config.params as Record<string, string | number | boolean | undefined> | undefined);
  }

  if (path === "/shipments/board" && method === "get") {
    const boardStatuses: Shipment["status"][] = ["Pending", "In Transit", "Delivered", "Delayed"];
    return boardStatuses.map((status) => ({ status, items: clone(database.shipments.filter((shipment) => shipment.status === status)) }));
  }

  if (path === "/shipments" && method === "post") {
    const payload = requestData as Partial<Shipment>;
    const shipment: Shipment = {
      _id: createId("shp"),
      shipmentId: payload.shipmentId ?? `SHP-${Math.floor(Math.random() * 9000 + 1000)}`,
      title: payload.title ?? payload.shipmentId ?? "New Shipment",
      origin: payload.origin ?? "Unknown Origin",
      destination: payload.destination ?? "Unknown Destination",
      progress: payload.progress,
      vehicle: payload.vehicle,
      driver: payload.driver,
      status: payload.status ?? "Pending",
      priority: payload.priority ?? "Medium",
      weight: payload.weight ?? 0,
      scheduledPickup: payload.scheduledPickup ?? new Date().toISOString(),
      estimatedDelivery: payload.estimatedDelivery ?? new Date().toISOString(),
      deliveredAt: payload.deliveredAt,
      timeline: payload.timeline,
    };

    updateMockDatabase((current) => ({ ...current, shipments: [shipment, ...current.shipments] }));
    return shipment;
  }

  if (path.startsWith("/shipments/") && (method === "put" || method === "patch")) {
    const id = path.split("/")[2];
    const payload = requestData as Partial<Shipment>;
    let updatedShipment: Shipment | null = null;

    updateMockDatabase((current) => ({
      ...current,
      shipments: current.shipments.map((shipment) => {
        if (shipment._id !== id) return shipment;
        updatedShipment = { ...shipment, ...payload };
        return updatedShipment;
      }),
    }));

    return updatedShipment ?? null;
  }

  if (path === "/drivers" && method === "get") {
    return buildPaginatedResponse(database.drivers, config.params as Record<string, string | number | boolean | undefined> | undefined);
  }

  if (path === "/drivers" && method === "post") {
    const payload = requestData as Partial<Driver>;
    const driver: Driver = {
      _id: createId("drv"),
      employeeId: payload.employeeId ?? `EMP-${Math.floor(Math.random() * 900 + 100)}`,
      name: payload.name ?? "New Driver",
      phone: payload.phone ?? "",
      licenseNumber: payload.licenseNumber ?? "",
      availabilityStatus: payload.availabilityStatus ?? "Available",
      rating: payload.rating ?? 4.5,
      completedTrips: payload.completedTrips ?? 0,
      onTimeRate: payload.onTimeRate ?? 0,
      safetyScore: payload.safetyScore ?? 0,
    };

    updateMockDatabase((current) => ({ ...current, drivers: [driver, ...current.drivers] }));
    return driver;
  }

  if (path.startsWith("/drivers/") && (method === "put" || method === "patch")) {
    const id = path.split("/")[2];
    const payload = requestData as Partial<Driver>;
    let updatedDriver: Driver | null = null;

    updateMockDatabase((current) => ({
      ...current,
      drivers: current.drivers.map((driver) => {
        if (driver._id !== id) return driver;
        updatedDriver = { ...driver, ...payload };
        return updatedDriver;
      }),
    }));

    return updatedDriver ?? null;
  }

  if (path === "/notifications" && method === "get") {
    return clone(database.notifications);
  }

  if (path.startsWith("/notifications/") && path.endsWith("/read") && method === "patch") {
    const id = path.split("/")[2];
    let updatedNotification: NotificationItem | null = null;

    updateMockDatabase((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => {
        if (notification._id !== id) return notification;
        const nextNotification = {
          ...notification,
          isReadBy: notification.isReadBy.includes("demo-user") ? notification.isReadBy : [...notification.isReadBy, "demo-user"],
        };
        updatedNotification = nextNotification;
        return nextNotification;
      }),
    }));

    return updatedNotification ?? null;
  }

  return null;
};

api.interceptors.request.use((request) => {
  const session = getStoredSession();
  if (session?.token) {
    const headers = request.headers instanceof AxiosHeaders ? request.headers : AxiosHeaders.from(request.headers);
    headers.set("Authorization", `Bearer ${session.token}`);
    request.headers = headers;
  }

  return request;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestConfig = error.config as MockableRequestConfig | undefined;
    if (!requestConfig || requestConfig.__mockFallbackApplied || !shouldUseMockFallback(error)) {
      return Promise.reject(error);
    }

    const mockPayload = await resolveMockResponse(requestConfig);
    if (mockPayload === null) {
      return Promise.reject(error);
    }

    requestConfig.__mockFallbackApplied = true;
    return respondWith(requestConfig as InternalAxiosRequestConfig, mockPayload);
  }
);

export default api;
