import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Gauge,
  Globe2,
  Layers3,
  MapPinned,
  Maximize2,
  PackageCheck,
  ShieldAlert,
  Sparkles,
  TimerReset,
  Truck,
  UserCheck,
  Warehouse,
  Wrench,
  TrendingUp,
} from "lucide-react";

import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";
import { cn } from "@/lib/utils";
import type { LogisticsAlert, LogisticsDriver, LogisticsKpi, LogisticsShipment, LogisticsMaintenanceLog, LogisticsLog } from "@/types/logistics";

const chartColors = ["#22d3ee", "#38bdf8", "#4f46e5", "#14b8a6", "#f59e0b"];

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));

const statusTone: Record<string, string> = {
  Pending: "bg-slate-700 text-white border-slate-600",
  Ready: "bg-cyan-600 text-white border-cyan-700",
  Loading: "bg-amber-600 text-white border-amber-700",
  "In Transit": "bg-blue-600 text-white border-blue-700",
  Delayed: "bg-rose-600 text-white border-rose-700",
  Delivered: "bg-emerald-600 text-white border-emerald-700",
  Available: "bg-emerald-600 text-white border-emerald-700",
  Maintenance: "bg-amber-600 text-white border-amber-700",
  Inactive: "bg-slate-600 text-white border-slate-700",
  Driving: "bg-blue-600 text-white border-blue-700",
  "On Break": "bg-slate-600 text-white border-slate-700",
  "Off Duty": "bg-slate-600 text-white border-slate-700",
};

const sortByNumber = <T,>(items: T[], getter: (item: T) => number) => [...items].sort((left, right) => getter(right) - getter(left));

const metricCardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const sanitizeName = (raw = "") =>
  String(raw)
    .replace(/\bdev\b/gi, "")
    .replace(/\bdeveloper\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

// Shared Tailwind class groups to reduce repetition
const smallButtonClasses = "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/10";
const seeMoreButtonClasses = "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100 transition hover:bg-white/10";
const cardItemClasses = "rounded-2xl border border-white/10 bg-white/5 p-3";

type ChartViewKey = "monthlyDeliveries" | "fleetUtilization" | "fuelUsage" | "driverPerformance" | "routeEfficiency";
type DashboardViewKey = ChartViewKey | "alerts" | "shipments" | "maintenance" | "activity" | "drivers" | "insights";

export const AdminDashboard = () => {
  const { vehicles, shipments, drivers, notifications, dashboard } = useSmartFleetSimulation();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeView, setActiveView] = useState<DashboardViewKey | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLastRefresh(new Date());
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const derived = useMemo(() => {
    const activeVehicles = vehicles.filter((item) => item.status !== "Inactive");
    const delayedShipments = shipments.filter((item) => item.status === "Delayed");
    const deliveredShipments = shipments.filter((item) => item.status === "Delivered");
    const maintenanceVehicles = vehicles.filter((item) => item.status === "Maintenance");
    const lowFuelVehicles = vehicles.filter((item) => (item.fuelLevel ?? 100) < 30);
    const onDutyDrivers = drivers.filter((item) => item.availabilityStatus === "On Trip");
    const routeEfficiency = Math.min(99, 75 + Math.round((dashboard.kpis.activeDeliveries - dashboard.kpis.delayedShipments) * 2.3));
    const warehouseEfficiency = Math.min(
      99,
      Math.max(
        62,
        Math.round(
          68 +
            deliveredShipments.length * 1.9 -
            delayedShipments.length * 2.2 +
            activeVehicles.length * 0.6 -
            maintenanceVehicles.length * 1.4
        )
      )
    );
    const fleetHealth = Math.max(54, Math.min(98, 98 - maintenanceVehicles.length * 5 - lowFuelVehicles.length * 2 - delayedShipments.length * 2));
    const riskScore = Math.min(100, delayedShipments.length * 11 + maintenanceVehicles.length * 7 + lowFuelVehicles.length * 2);

    const shipmentRows: LogisticsShipment[] = shipments.slice(0, 6).map((shipment) => ({
      id: shipment._id,
      shipmentId: shipment.shipmentId,
      warehouse: shipment.origin,
      route: `${shipment.origin} → ${shipment.destination}`,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.status,
      progress:
        shipment.status === "Delivered"
          ? 100
          : shipment.status === "In Transit"
            ? 66
            : shipment.status === "Delayed"
              ? 42
              : 18,
      priority: shipment.priority,
      eta: shipment.estimatedDelivery,
      updatedAt: shipment.deliveredAt || shipment.scheduledPickup,
      driverName: shipment.driver?.name,
      vehicleId: shipment.vehicle?.vehicleNumber,
    }));

    const topDrivers: LogisticsDriver[] = sortByNumber(
      drivers.slice(0, 8).map((driver) => {
        const cleanedName = sanitizeName(driver.name) || "Driver";
        return {
          id: driver._id,
          name: cleanedName,
          employeeId: driver.employeeId,
          route: `${cleanedName.split(" ")[0]}'s assigned lane`,
          status: driver.availabilityStatus === "On Trip" ? "Driving" : driver.availabilityStatus === "On Leave" ? "Off Duty" : "Available",
          tripsCompleted: driver.completedTrips,
          onTimeRate: driver.onTimeRate,
          safetyScore: driver.safetyScore,
          fuelEfficiency: Math.max(74, Math.min(99, driver.safetyScore - 3 + Math.round(driver.onTimeRate / 12))),
        };
      }),
      (item) => item.onTimeRate + item.safetyScore
    );

    const monthlyRouteEfficiency = dashboard.deliveriesTrend.map((entry, index) => ({
      month: entry.month,
      efficiency: Math.min(99, Math.max(63, entry.deliveries - (dashboard.delayAnalytics[index]?.delays || 0) * 2 + 18)),
      deliveries: entry.deliveries,
      delays: dashboard.delayAnalytics[index]?.delays || 0,
    }));

    const maintenanceLogs: LogisticsMaintenanceLog[] = sortByNumber(
      vehicles.slice(0, 8).map((vehicle) => ({
        id: vehicle._id,
        vehicleId: vehicle.vehicleNumber,
        status: vehicle.status,
        lastServiceAt: vehicle.lastServiceDate,
        nextServiceAt: vehicle.nextServiceDate,
        fuelLevel: vehicle.fuelLevel ?? Math.max(28, Math.round(vehicle.capacity / 400)),
      })),
      (item) => item.fuelLevel
    );

    const liveAlerts: LogisticsAlert[] = [
      ...delayedShipments.slice(0, 2).map((shipment, index) => ({
        id: shipment._id,
        title: `Shipment ${shipment.shipmentId} delayed`,
        details: `${shipment.origin} → ${shipment.destination} requires escalation.`,
        severity: index === 0? ("critical" as const): ("high" as const),
        createdAt: shipment.estimatedDelivery,
        acknowledged: false,
      })),
      ...maintenanceVehicles.slice(0, 2).map((vehicle) => ({
        id: vehicle._id,
        title: `${vehicle.vehicleNumber} maintenance warning`,
        details: `Next service due on ${formatTimestamp(vehicle.nextServiceDate)}.`,
        severity: "medium" as const,
        createdAt: vehicle.nextServiceDate,
        acknowledged: false,
      })),
    ].slice(0, 4);

    const activityFeed: LogisticsLog[] = [
      {
        id: `log-${shipments[0]?._id || "1"}`,
        actor: shipments[0]?.driver?.name || "Control Tower",
        title: "Shipment handoff updated",
        description: `${shipments[0]?.shipmentId || "SHP-0000"} moved to active dispatch queue.`,
        timestamp: shipments[0]?.estimatedDelivery || new Date().toISOString(),
        tone: "high",
      },
      {
        id: `log-${vehicles[0]?._id || "2"}`,
        actor: vehicles[0]?.vehicleNumber || "Fleet Desk",
        title: "Vehicle status synchronized",
        description: `${vehicles[0]?.vehicleNumber || "TRK-000"} is now ${vehicles[0]?.status || "Available"}.`,
        timestamp: vehicles[0]?.nextServiceDate || new Date().toISOString(),
        tone: "medium",
      },
      {
        id: `log-${notifications[0]?._id || "3"}`,
        actor: notifications[0]?.type || "Operations",
        title: "Notification broadcast",
        description: notifications[0]?.message || "Control tower pushed a live update.",
        timestamp: notifications[0]?.createdAt || new Date().toISOString(),
        tone: "low",
      },
    ];

    const kpis: LogisticsKpi[] = [
      {
        label: "Total Deliveries",
        value: deliveredShipments.length,
        delta: `${deliveredShipments.length - delayedShipments.length >= 0 ? "+" : ""}${deliveredShipments.length - delayedShipments.length} net`,
        tone: "low",
        hint: "Delivered successfully this cycle",
      },
      {
        label: "Active Vehicles",
        value: activeVehicles.length,
        delta: `${activeVehicles.length - maintenanceVehicles.length} in service`,
        tone: "medium",
        hint: "Connected to live routes",
      },
      {
        label: "Delayed Shipments",
        value: delayedShipments.length,
        delta: delayedShipments.length > 0 ? "Escalations pending" : "Stable",
        tone: delayedShipments.length > 0 ? "critical" : "low",
        hint: "Needs control tower review",
      },
      {
        label: "Fleet Health",
        value: `${fleetHealth}%`,
        delta: `${maintenanceVehicles.length} maintenance`,
        tone: fleetHealth >= 85 ? "low" : "medium",
        hint: "Vehicle reliability index",
      },
      {
        label: "Total Drivers",
        value: drivers.length,
        delta: `${onDutyDrivers.length} on duty`,
        tone: "low",
        hint: "Registered logistics operators",
      },
      {
        label: "Warehouse Efficiency",
        value: `${warehouseEfficiency}%`,
        delta: `${Math.max(0, shipmentRows.filter((item) => item.status === "Ready").length)} ready to load`,
        tone: warehouseEfficiency >= 85 ? "low" : "medium",
        hint: "Dispatch throughput score",
      },
    ];

    return {
      activeVehicles,
      delayedShipments,
      maintenanceVehicles,
      lowFuelVehicles,
      onDutyDrivers,
      warehouseEfficiency,
      fleetHealth,
      routeEfficiency,
      riskScore,
      liveAlerts,
      activityFeed,
      maintenanceLogs,
      shipmentRows,
      topDrivers,
      monthlyRouteEfficiency,
      kpis,
      monthlyDeliveries: dashboard.deliveriesTrend,
      fleetUtilization: dashboard.fleetUtilization,
      fuelUsage: dashboard.fuelUsage,
      delayAnalytics: dashboard.delayAnalytics,
    };
  }, [dashboard.deliveriesTrend, dashboard.delayAnalytics, dashboard.fleetUtilization, dashboard.fuelUsage, drivers, notifications, shipments, vehicles]);

  const summaryBadges = useMemo(
    () => [
      { label: "Risk", value: `${derived.riskScore}%`, tone: derived.riskScore > 60 ? "text-rose-700" : "text-emerald-700" },
      { label: "Route Score", value: `${derived.routeEfficiency}%`, tone: "text-cyan-800" },
      { label: "Live", value: `${derived.activeVehicles.length + derived.delayedShipments.length}`, tone: "text-amber-700" },
    ],
    [derived.activeVehicles.length, derived.delayedShipments.length, derived.riskScore, derived.routeEfficiency]
  );

  const driverChartData = useMemo(
    () =>
      derived.topDrivers.slice(0, 6).map((driver) => {
        const cleaned = sanitizeName(driver.name) || "Driver";
        const parts = cleaned.split(" ");
        return {
          ...driver,
          name: cleaned,
          labelTop: parts[0] || "Driver",
          labelBottom: parts[1] ? `${parts[1][0]}.` : "",
        };
      }),
    [derived.topDrivers]
  );

  const renderDriverTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value?: string } }) => {
    const raw = payload?.value ? String(payload.value) : "";

    // Remove common titles/suffixes and extra punctuation, then pick first + last initial
    const cleaned = raw
      .replace(/\b(Mr|Mrs|Ms|Miss|Dr|Sr|Jr|II|III|IV)\.?\b/gi, "")
      .replace(/\bdev\b/gi, "")
      .replace(/\bdeveloper\b/gi, "")
      .replace(/[(),.]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const parts = cleaned.split(" ").filter(Boolean);
    const first = parts[0] || "Driver";
    const last = parts.length > 1 ? parts[parts.length - 1] : "";
    let label = last ? `${first} ${last[0]}.` : first;

    // Ensure label not too long; truncate first name if needed
    if (label.length > 12) {
      const shortFirst = first.slice(0, 8) + (first.length > 8 ? "…" : "");
      label = last ? `${shortFirst} ${last[0]}.` : shortFirst;
    }

    // Decide styling based on current theme so labels are visible in both modes
    const isDark = typeof document !== "undefined" && (document.documentElement.classList.contains("dark") || document.documentElement.dataset.theme === "dark");
    const fill = isDark ? "#E6EEF8" : "#475569";
    const weight = isDark ? 700 : 600;

    // Render rotated, right-aligned label to avoid horizontal overlap
    return (
      <g transform={`translate(${x ?? 0},${y ?? 0}) rotate(-25)`}> 
        <text x={0} y={0} textAnchor="end" fill={fill} fontSize={12} fontWeight={weight}>
          <tspan x={0} dy="0">{label}</tspan>
        </text>
      </g>
    );
  };

  const renderChartByKey = (chartKey: ChartViewKey, expanded = false) => {
    if (chartKey === "monthlyDeliveries") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={derived.monthlyDeliveries} margin={{ top: 8, right: 14, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="adminDeliveriesExpanded" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.65} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.18)" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }} />
            <Area type="monotone" dataKey="deliveries" stroke="#22d3ee" strokeWidth={2} fill="url(#adminDeliveriesExpanded)" isAnimationActive={!expanded} />
            <Line type="monotone" dataKey={(entry: { deliveries: number }) => entry.deliveries - 10} stroke="#8b5cf6" strokeDasharray="4 4" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (chartKey === "fleetUtilization") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={derived.fleetUtilization} dataKey="value" nameKey="status" innerRadius={expanded ? 72 : 55} outerRadius={expanded ? 132 : 95} paddingAngle={3}>
              {derived.fleetUtilization.map((entry, index) => (
                <Cell key={entry.status} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartKey === "fuelUsage") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={derived.fuelUsage} margin={{ top: 8, right: 14, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="fuelGradientExpanded" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.18)" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }} />
            <Area type="monotone" dataKey="liters" stroke="#14b8a6" strokeWidth={2} fill="url(#fuelGradientExpanded)" isAnimationActive={!expanded} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (chartKey === "driverPerformance") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={driverChartData} margin={{ top: 8, right: 10, left: 4, bottom: expanded ? 6 : 22 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.18)" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              interval={0}
              angle={0}
              textAnchor="middle"
              minTickGap={expanded ? 6 : 8}
              height={expanded ? 44 : 36}
              tick={renderDriverTick}
            />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }} />
            <Bar dataKey="onTimeRate" fill="#22d3ee" radius={[10, 10, 0, 0]} isAnimationActive={!expanded} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={derived.monthlyRouteEfficiency} margin={{ top: 8, right: 14, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.18)" />
          <XAxis dataKey="month" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }} />
          <Line type="monotone" dataKey="efficiency" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="deliveries" stroke="#22d3ee" strokeWidth={2} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const chartTitles: Record<ChartViewKey, string> = {
    monthlyDeliveries: "Monthly delivery analytics",
    fleetUtilization: "Fleet utilization",
    fuelUsage: "Fuel usage trends",
    driverPerformance: "Driver performance",
    routeEfficiency: "Route efficiency",
  };

  const detailTitles: Record<Exclude<DashboardViewKey, ChartViewKey>, string> = {
    alerts: "Critical alerts",
    shipments: "Live shipment feed",
    maintenance: "Maintenance warnings",
    activity: "System activity timeline",
    drivers: "Top drivers",
    insights: "Executive insights",
  };

  const renderDetailList = (view: Exclude<DashboardViewKey, ChartViewKey>) => {
    if (view === "alerts") {
      return derived.liveAlerts.map((alert) => (
        <div key={alert.id} className="rounded-2xl border border-border bg-muted/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-foreground">{alert.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{alert.details}</p>
            </div>
            <Badge className={cn("whitespace-nowrap border", alert.severity === "critical" ? "border-rose-400/30 bg-rose-400/10 text-rose-800" : alert.severity === "high" ? "border-amber-400/30 bg-amber-400/10 text-amber-800" : "border-cyan-400/30 bg-cyan-400/10 text-cyan-800")}>
              {alert.severity}
            </Badge>
          </div>
        </div>
      ));
    }

    if (view === "shipments") {
      return derived.shipmentRows.map((row) => (
        <div key={row.id} className="rounded-2xl border border-border bg-muted/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-foreground">{row.shipmentId}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{row.route}</p>
              <p className="mt-1 text-xs text-slate-600">Warehouse: {row.warehouse}</p>
            </div>
            <Badge className={cn("whitespace-nowrap border", statusTone[row.status] || "border-border bg-muted/60 text-slate-700")}>{row.status}</Badge>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <span>Priority: {row.priority}</span>
            <span>{row.eta ? formatTimestamp(row.eta) : "--"}</span>
          </div>
        </div>
      ));
    }

    if (view === "maintenance") {
      return derived.maintenanceLogs.map((vehicle) => (
        <div key={vehicle.id} className="rounded-2xl border border-border bg-muted/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-foreground">{vehicle.vehicleId}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Service due {formatTimestamp(vehicle.nextServiceAt)}</p>
              <p className="mt-1 text-xs text-slate-600">Fuel reserve {vehicle.fuelLevel}%</p>
            </div>
            <Badge className={cn("whitespace-nowrap border", statusTone[vehicle.status] || "border-border bg-muted/60 text-slate-700")}>{vehicle.status}</Badge>
          </div>
        </div>
      ));
    }

    if (view === "activity") {
      return derived.activityFeed.map((item) => (
        <div key={item.id} className="rounded-2xl border border-border bg-muted/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.actor}</p>
              <p className="mt-2 text-sm text-slate-700">{item.description}</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">{formatTimestamp(item.timestamp)}</span>
          </div>
        </div>
      ));
    }

    if (view === "drivers") {
      return derived.topDrivers.map((driver) => (
        <div key={driver.id} className="rounded-2xl border border-border bg-muted/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-foreground">{driver.name}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{driver.tripsCompleted} completed deliveries</p>
              <p className="mt-1 text-xs text-slate-600">On-time {driver.onTimeRate}% • Safety {driver.safetyScore}%</p>
            </div>
            <Badge className="whitespace-nowrap border border-border bg-background text-slate-700">{driver.status}</Badge>
          </div>
        </div>
      ));
    }

    return [
      { label: "Fuel efficiency", value: "Fleet burn is stable across the active route map." },
      { label: "Delay forecast", value: "Traffic pressure may affect 2 shipments in the next cycle." },
      { label: "Warehouse load", value: "Dispatch queue is aligned to the Bangalore and Chennai lanes." },
    ].map((item) => (
      <div key={item.label} className="rounded-2xl border border-border bg-muted/60 p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">{item.label}</p>
        <p className="mt-2 text-base text-foreground">{item.value}</p>
      </div>
    ));
  };

  const isChartView = (view: DashboardViewKey | null): view is ChartViewKey =>
    view === "monthlyDeliveries" || view === "fleetUtilization" || view === "fuelUsage" || view === "driverPerformance" || view === "routeEfficiency";

  return (
    <div className="space-y-6 text-slate-100">
      <section className="overflow-hidden rounded-[28px] border border-cyan-400/15 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-cyan-950/20 lg:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <LiveIndicator tone="cyan" className="border-cyan-300 bg-cyan-100 text-cyan-900" />
              <Badge className="border-cyan-300 bg-cyan-100 text-cyan-900 hover:bg-cyan-100">Admin Control Tower</Badge>
              <Badge className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/5">
                Last sync {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Badge>
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">Enterprise operations dashboard</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 lg:text-base">
                Fleet, drivers, shipments, and warehouse throughput are being monitored live. This view is tuned for executive oversight, escalation handling,
                and global dispatch control.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {summaryBadges.map((item) => (
                <div key={item.label} className="rounded-full border border-slate-300 bg-slate-100 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-700">
                  <span className="text-slate-600">{item.label}</span> <span className={item.tone}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px] xl:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-400">
                <span>Control status</span>
                <Sparkles className="h-4 w-4 text-cyan-300" />
              </div>
              <p className="mt-4 text-2xl font-semibold text-white">System live</p>
              <p className="mt-2 text-sm text-slate-300">Telemetry, alerts, and dispatches are refreshing continuously.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-slate-900 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-400">
                <span>Risk posture</span>
                <ShieldAlert className="h-4 w-4 text-rose-300" />
              </div>
              <p className="mt-4 text-2xl font-semibold text-white">{derived.riskScore}%</p>
              <p className="mt-2 text-sm text-slate-300">Predictive alerts compiled from fleet, route, and shipment pressure.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {derived.kpis.map((item, index) => (
          <motion.div key={item.label} variants={metricCardVariants} initial="hidden" animate="visible" transition={{ delay: index * 0.05 }}>
            <Card className="h-full border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-400">
                  <span>{item.label}</span>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-cyan-200">
                    {index === 0 ? <PackageCheck className="h-4 w-4" /> : null}
                    {index === 1 ? <Truck className="h-4 w-4" /> : null}
                    {index === 2 ? <TimerReset className="h-4 w-4" /> : null}
                    {index === 3 ? <Gauge className="h-4 w-4" /> : null}
                    {index === 4 ? <UserCheck className="h-4 w-4" /> : null}
                    {index === 5 ? <Warehouse className="h-4 w-4" /> : null}
                  </div>
                </div>
                <p className="text-3xl font-semibold text-white">{item.value}</p>
                <p className="text-sm text-slate-300">{item.hint}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ArrowRight className="h-4 w-4" />
                  {item.delta}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      item.tone === "critical" ? "bg-rose-400" : item.tone === "medium" ? "bg-amber-400" : "bg-cyan-400"
                    )}
                    style={{ width: `${Math.min(100, 48 + index * 8)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <BarChart3 className="h-4 w-4 text-cyan-300" /> Monthly delivery analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("monthlyDeliveries")}
                className={smallButtonClasses}
              >
                <Maximize2 className="h-3.5 w-3.5" /> View full
              </button>
              <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">Animated</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[320px]">
            {renderChartByKey("monthlyDeliveries")}
          </CardContent>
        </Card>

        <Card className="h-full border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Layers3 className="h-4 w-4 text-cyan-300" /> Fleet utilization
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("fleetUtilization")}
                className={smallButtonClasses}
              >
                <Maximize2 className="h-3.5 w-3.5" /> View full
              </button>
              <Badge className="border-white/10 bg-white/5 text-slate-100">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[320px]">
            {renderChartByKey("fleetUtilization")}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        <Card className="border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Wrench className="h-4 w-4 text-cyan-300" /> Fuel usage trends
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("fuelUsage")}
                className={smallButtonClasses}
              >
                <Maximize2 className="h-3.5 w-3.5" /> View full
              </button>
              <Badge className="border-white/10 bg-white/5 text-slate-100">Auto-scale</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {renderChartByKey("fuelUsage")}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30">
          <CardHeader className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <TrendingUp className="h-4 w-4 text-cyan-300" /> Driver performance
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("driverPerformance")}
                className={smallButtonClasses}
              >
                <Maximize2 className="h-3.5 w-3.5" /> View full
              </button>
              <Badge className="self-center whitespace-nowrap border-white/10 bg-white/5 text-slate-100">Live</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {renderChartByKey("driverPerformance")}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30 2xl:col-span-1">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <MapPinned className="h-4 w-4 text-cyan-300" /> Route efficiency
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("routeEfficiency")}
                className={smallButtonClasses}
              >
                <Maximize2 className="h-3.5 w-3.5" /> View full
              </button>
              <Badge className="border-white/10 bg-white/5 text-slate-100">Projected</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {renderChartByKey("routeEfficiency")}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="w-full max-w-full border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30">
          <CardHeader className="flex min-h-[72px] items-center justify-between gap-3 pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Bell className="h-4 w-4 text-cyan-300" /> Critical alerts
            </CardTitle>
            <Badge className="self-center whitespace-nowrap border-rose-400/20 bg-rose-400/10 text-rose-100">{derived.liveAlerts.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-white/10 pt-3">
            {Array.from({ length: 3 }).map((_, index) => {
              const alert = derived.liveAlerts[index];

              return (
                <div key={alert?.id ?? `alert-${index}`} className={cardItemClasses}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{alert?.title ?? "Monitoring in progress"}</p>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.24em]",
                        alert?.severity === "critical"
                          ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
                          : alert?.severity === "high"
                            ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
                            : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                      )}
                    >
                      {alert?.severity ?? "info"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{alert?.details ?? "Live alerts will appear here as events are detected."}</p>
                </div>
              );
            })}
            <div className="flex items-center justify-end border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setActiveView("alerts")}
                className={seeMoreButtonClasses}
              >
                See more
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-full border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30">
          <CardHeader className="flex min-h-[72px] items-center justify-between gap-3 pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Truck className="h-4 w-4 text-cyan-300" /> Live shipment feed
            </CardTitle>
            <Badge className="self-center whitespace-nowrap border-white/10 bg-white/5 text-slate-100">
              Real-time
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-white/10 pt-3">
            {Array.from({ length: 3 }).map((_, index) => {
              const shipment = shipments[index];
              const progress = shipment
                ? shipment.status === "Delivered"
                  ? 100
                  : shipment.status === "In Transit"
                    ? 66
                    : shipment.status === "Delayed"
                      ? 42
                      : 24
                : 0;

              return (
                <div key={shipment?._id ?? `shipment-${index}`} className={cardItemClasses}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{shipment?.shipmentId ?? "Shipment preview"}</p>
                      <p className="text-xs text-slate-400">{shipment ? `${shipment.origin} → ${shipment.destination}` : "Awaiting live shipment data"}</p>
                    </div>
                    <Badge className={cn("border", shipment ? statusTone[shipment.status] || "border-white/10 bg-white/5 text-slate-100" : "border-white/10 bg-white/5 text-slate-100")}>
                      {shipment?.status ?? "Live"}
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{shipment?.priority ?? "Preview"}</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-end border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setActiveView("shipments")}
                className={seeMoreButtonClasses}
              >
                See more
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-full border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30">
          <CardHeader className="flex min-h-[72px] items-center justify-between gap-3 pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Wrench className="h-4 w-4 text-cyan-300" /> Maintenance warnings
            </CardTitle>
            <Badge className="self-center whitespace-nowrap border-amber-400/20 bg-amber-400/10 text-amber-100">Watch list</Badge>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-white/10 pt-3">
            {Array.from({ length: 3 }).map((_, index) => {
              const vehicle = derived.maintenanceLogs[index];

              return (
                <div key={vehicle?.id ?? `vehicle-${index}`} className={cardItemClasses}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{vehicle?.vehicleId ?? "Vehicle preview"}</p>
                      <p className="text-xs text-slate-400">{vehicle ? `Service due ${formatTimestamp(vehicle.nextServiceAt)}` : "Awaiting maintenance data"}</p>
                    </div>
                    <span className={cn("rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.24em]", vehicle ? statusTone[vehicle.status] || "border-white/10 bg-white/5 text-slate-100" : "border-white/10 bg-white/5 text-slate-100")}>
                      {vehicle?.status ?? "Update"}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className={cn("h-full rounded-full transition-all duration-500", vehicle && vehicle.fuelLevel < 30 ? "bg-rose-400" : vehicle && vehicle.fuelLevel < 50 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${Math.min(100, vehicle?.fuelLevel ?? 25)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Fuel reserve {vehicle?.fuelLevel ?? "--"}%</p>
                </div>
              );
            })}
            <div className="flex items-center justify-end border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setActiveView("maintenance")}
                className={seeMoreButtonClasses}
              >
                See more
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30">
          <CardHeader className="flex min-h-[72px] items-center justify-between gap-3 pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Globe2 className="h-4 w-4 text-cyan-300" /> System activity timeline
            </CardTitle>
            <Badge className="self-center whitespace-nowrap border-white/10 bg-white/5 text-slate-100">Audit</Badge>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-white/10 pt-3">
            {([
              {
                id: "activity-1",
                actor: shipments[0]?.driver?.name || "Control Tower",
                title: "Shipment handoff updated",
                description: `${shipments[0]?.shipmentId || "SHP-0000"} moved to active dispatch queue.`,
                timestamp: shipments[0]?.estimatedDelivery || new Date().toISOString(),
              },
              {
                id: "activity-2",
                actor: vehicles[0]?.vehicleNumber || "Fleet Desk",
                title: "Vehicle status synchronized",
                description: `${vehicles[0]?.vehicleNumber || "TRK-000"} is now ${vehicles[0]?.status || "Available"}.`,
                timestamp: vehicles[0]?.nextServiceDate || new Date().toISOString(),
              },
              {
                id: "activity-3",
                actor: notifications[0]?.type || "Operations",
                title: "Notification broadcast",
                description: notifications[0]?.message || "Control tower pushed a live update.",
                timestamp: notifications[0]?.createdAt || new Date().toISOString(),
              },
            ] as LogisticsLog[]).map((item, index) => (
              <div key={item.id} className={cn("flex gap-3", cardItemClasses)}>
                <div className={cn("mt-1 h-2.5 w-2.5 rounded-full", index === 0 ? "bg-cyan-400" : index === 1 ? "bg-amber-400" : "bg-emerald-400")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <span className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{formatTimestamp(item.timestamp)}</span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">{item.actor}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-end border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setActiveView("activity")}
                className={seeMoreButtonClasses}
              >
                See more
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <PackageCheck className="h-4 w-4 text-cyan-300" /> Recent shipments
            </CardTitle>
            <Badge className="border-white/10 bg-white/5 text-slate-100">Live table</Badge>
          </CardHeader>
          <CardContent className="space-y-4 overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">
                  <th className="px-3 py-2">Shipment</th>
                  <th className="px-3 py-2">Route</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Progress</th>
                  <th className="px-3 py-2">ETA</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {derived.shipmentRows.map((row) => (
                  <tr key={row.id} className="rounded-2xl border border-border bg-card/60">
                    <td className="px-3 py-3">
                      <div className="text-sm font-semibold text-foreground">{row.shipmentId}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">{row.warehouse}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400">{row.route}</td>
                    <td className="px-3 py-3">
                      <Badge className={cn("border", row.status ? statusTone[row.status] || "border-border bg-muted/60 text-foreground" : "border-border bg-muted/60 text-foreground")}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 w-40">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${row.progress}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400">{row.eta ? formatTimestamp(row.eta) : "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="flex h-full flex-col gap-4">
                <Card className="flex-1 border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30">
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                      <AlertTriangle className="h-4 w-4 text-cyan-300" /> Vehicle maintenance logs
                    </CardTitle>
                    <Badge className="border-white/10 bg-white/5 text-slate-100">Updated</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 border-t border-white/10 pt-3">
                    {[
                      { title: "Brake inspection completed", vehicle: "TRK-204", meta: "Completed today", status: "Resolved", tone: "emerald" },
                      { title: "Oil replacement scheduled", vehicle: "VAN-118", meta: "Due tomorrow", status: "Scheduled", tone: "amber" },
                      { title: "Tire pressure alert resolved", vehicle: "TRK-391", meta: "Resolved 2h ago", status: "Closed", tone: "cyan" },
                    ].map((item) => (
                      <div key={item.title} className={cardItemClasses}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.vehicle} • {item.meta}</p>
                          </div>
                          <span className={cn("rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.24em]", item.tone === "emerald" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-700" : item.tone === "amber" ? "border-amber-400/20 bg-amber-400/10 text-amber-700" : "border-cyan-400/20 bg-cyan-400/10 text-cyan-700")}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-end border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => setActiveView("drivers")}
                        className={seeMoreButtonClasses}
                      >
                        See more
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex-1 border-white/10 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-950/30">
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                      <UserCheck className="h-4 w-4 text-cyan-300" /> Top drivers
                    </CardTitle>
                    <Badge className="border-white/10 bg-white/5 text-slate-100">Ranking</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 border-t border-white/10 pt-3">
                    {derived.topDrivers.slice(0, 3).map((driver, index) => {
                      const initials = driver.name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase();
                      const deliveryScore = Math.round((driver.onTimeRate + driver.safetyScore) / 2);
                      const statusLabel = index === 0 ? "Elite" : index === 1 ? "Reliable" : "Efficient";

                      return (
                        <div key={driver.id} className={cn("flex items-center gap-3", cardItemClasses)}>
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cyan-700 text-base font-bold text-white">
                              {initials}
                            </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{driver.name}</p>
                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{driver.tripsCompleted} completed deliveries</p>
                              </div>
                              <span className="rounded-full border border-transparent bg-cyan-700 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-white font-semibold">
                                {statusLabel}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                              <span className="rounded-full border border-border bg-background px-2 py-1">Score {deliveryScore}%</span>
                              <span className="rounded-full border border-border bg-background px-2 py-1">On-time {driver.onTimeRate}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-end border-t border-white/10 pt-3">
                      <button
                        type="button"
                        className={seeMoreButtonClasses}
                      >
                        See more
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

        <Card className="xl:col-span-2 border-white/10 bg-gradient-to-br from-cyan-400/10 to-slate-900 text-slate-100 shadow-lg shadow-slate-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <ShieldAlert className="h-4 w-4 text-cyan-300" /> Executive insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-white/10 pt-3">
            {[
              { label: "Fuel efficiency", value: "Fleet burn is stable across the active route map." },
              { label: "Delay forecast", value: "Traffic pressure may affect 2 shipments in the next cycle." },
              { label: "Warehouse load", value: "Dispatch queue is aligned to the Bangalore and Chennai lanes." },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
            <div className="flex items-center justify-end border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setActiveView("insights")}
                className={seeMoreButtonClasses}
              >
                See more
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Modal
        open={Boolean(activeView)}
        title={activeView ? `${isChartView(activeView) ? chartTitles[activeView] : detailTitles[activeView]} - Full view` : "View full"}
        onClose={() => setActiveView(null)}
        fullscreen
      >
        <div className="h-[72vh] w-full overflow-y-auto pr-1">
          {activeView && isChartView(activeView) ? (
            <div className="h-full w-full">{renderChartByKey(activeView, true)}</div>
          ) : activeView ? (
            <div className="space-y-3">{renderDetailList(activeView)}</div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};
