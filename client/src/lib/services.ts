import api from "@/lib/api";
import type { Driver, NotificationItem, Shipment, Vehicle } from "@/types";

interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },
};

export const analyticsService = {
  async getDashboard() {
    const { data } = await api.get("/analytics");
    return data;
  },
};

export const vehicleService = {
  async list(params?: Record<string, string | number>) {
    const { data } = await api.get<Paginated<Vehicle>>("/vehicles", { params });
    return data;
  },
  async create(payload: Omit<Vehicle, "_id">) {
    const { data } = await api.post<Vehicle>("/vehicles", payload);
    return data;
  },
  async update(id: string, payload: Partial<Vehicle>) {
    const { data } = await api.put<Vehicle>(`/vehicles/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    await api.delete(`/vehicles/${id}`);
  },
};

export const shipmentService = {
  async list(params?: Record<string, string | number>) {
    const { data } = await api.get<Paginated<Shipment>>("/shipments", { params });
    return data;
  },
  async board() {
    const { data } = await api.get<{ status: Shipment["status"]; items: Shipment[] }[]>("/shipments/board");
    return data;
  },
  async create(payload: Partial<Shipment>) {
    const { data } = await api.post<Shipment>("/shipments", payload);
    return data;
  },
  async update(id: string, payload: Partial<Shipment>) {
    const { data } = await api.put<Shipment>(`/shipments/${id}`, payload);
    return data;
  },
};

export const driverService = {
  async list(params?: Record<string, string | number>) {
    const { data } = await api.get<Paginated<Driver>>("/drivers", { params });
    return data;
  },
  async create(payload: Partial<Driver>) {
    const { data } = await api.post<Driver>("/drivers", payload);
    return data;
  },
  async update(id: string, payload: Partial<Driver>) {
    const { data } = await api.put<Driver>(`/drivers/${id}`, payload);
    return data;
  },
};

export const notificationService = {
  async list() {
    const { data } = await api.get<NotificationItem[]>("/notifications");
    return data;
  },
  async markRead(id: string) {
    const { data } = await api.patch<NotificationItem>(`/notifications/${id}/read`);
    return data;
  },
};
