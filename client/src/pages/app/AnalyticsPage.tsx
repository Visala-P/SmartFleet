import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Fuel, Gauge, ShieldAlert, Users2, Warehouse } from "lucide-react";

import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";

const DATE_FILTERS = ["7d", "30d", "90d", "180d"] as const;

const chartColors = ["#22d3ee", "#38bdf8", "#4f46e5", "#14b8a6", "#f59e0b"];

const AdminAnalytics = ({ range }: { range: (typeof DATE_FILTERS)[number] }) => {
  const { dashboard, drivers, shipments, vehicles } = useSmartFleetSimulation();

  const routeEfficiency = useMemo(
    () =>
      dashboard.deliveriesTrend.map((item, index) => ({
        month: item.month,
        efficiency: Math.max(68, 98 - dashboard.delayAnalytics[index]?.delays * 2),
      })),
    [dashboard.deliveriesTrend, dashboard.delayAnalytics]
  );

  const fuelUsage = useMemo(
    () => dashboard.fuelUsage.map((item) => ({ ...item, liters: range === "7d" ? Math.round(item.liters * 0.24) : item.liters })),
    [dashboard.fuelUsage, range]
  );

  const statusBreakdown = useMemo(
    () => [
      { name: "Delivered", value: shipments.filter((item) => item.status === "Delivered").length, color: "#10b981" },
      { name: "In Transit", value: shipments.filter((item) => item.status === "In Transit").length, color: "#06b6d4" },
      { name: "Pending", value: shipments.filter((item) => item.status === "Pending").length, color: "#6366f1" },
      { name: "Delayed", value: shipments.filter((item) => item.status === "Delayed").length, color: "#f97316" },
    ],
    [shipments]
  );

  const driverPerformance = useMemo(
    () =>
      drivers.slice(0, 8).map((driver) => ({
        name: driver.name.split(" ")[0],
        onTimeRate: driver.onTimeRate,
        safetyScore: driver.safetyScore,
      })),
    [drivers]
  );

  const warehouseEfficiency = Math.max(64, Math.min(98, 72 + shipments.filter((item) => item.status === "Delivered").length * 2 - shipments.filter((item) => item.status === "Delayed").length * 3));
  const operationalLoad = Math.min(100, dashboard.kpis.activeDeliveries * 11 + dashboard.kpis.delayedShipments * 7 + vehicles.filter((item) => item.status === "Maintenance").length * 9);
  const systemAlerts = shipments.filter((item) => item.status === "Delayed").length + vehicles.filter((item) => item.status === "Maintenance").length;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Global Delivery Analytics" value={dashboard.kpis.activeDeliveries} hint="Live deliveries in motion" icon={Activity} />
        <StatCard title="Fleet Utilization" value={`${dashboard.fleetUtilization.find((item) => item.status === "Available")?.value ?? 0}%`} hint="Available capacity" icon={Gauge} />
        <StatCard title="Fuel Trends" value={`${dashboard.kpis.fuelConsumption} L`} hint="Monthly burn snapshot" icon={Fuel} />
        <StatCard title="Driver Performance" value={`${Math.round(driverPerformance.reduce((sum, item) => sum + item.onTimeRate, 0) / Math.max(1, driverPerformance.length))}%`} hint="Average on-time rate" icon={Users2} />
        <StatCard title="Warehouse Efficiency" value={`${warehouseEfficiency}%`} hint="Throughput score" icon={Warehouse} />
        <StatCard title="System Alerts" value={systemAlerts} hint="Requires oversight" icon={ShieldAlert} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Operations overview</CardTitle>
            <Badge variant="secondary">Global</Badge>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Revenue posture</p>
              <p className="mt-2 text-2xl font-semibold">Stable</p>
              <p className="mt-2 text-sm text-muted-foreground">Operational load sits at {operationalLoad}% of current capacity.</p>
            </div>
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">System alerts</p>
              <p className="mt-2 text-2xl font-semibold">{systemAlerts}</p>
              <p className="mt-2 text-sm text-muted-foreground">Delays and maintenance warnings combined.</p>
            </div>
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Warehouse score</p>
              <p className="mt-2 text-2xl font-semibold">{warehouseEfficiency}%</p>
              <p className="mt-2 text-sm text-muted-foreground">Inbound and outbound flow remain within target.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Global status mix</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={58} outerRadius={94} paddingAngle={4}>
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly deliveries</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.deliveriesTrend}>
                <defs>
                  <linearGradient id="deliveriesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="deliveries" stroke="#4f46e5" fill="url(#deliveriesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route efficiency</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeEfficiency}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="efficiency" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Fleet utilization</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dashboard.fleetUtilization} dataKey="value" nameKey="status" outerRadius={92} innerRadius={60}>
                  {dashboard.fleetUtilization.map((entry, index) => (
                    <Cell key={entry.status} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuel trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelUsage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="liters" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driverPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="onTimeRate" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="safetyScore" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

const TransportManagerAnalytics = ({ range }: { range: (typeof DATE_FILTERS)[number] }) => {
  const { dashboard, shipments, vehicles, drivers } = useSmartFleetSimulation();

  const routeEfficiency = useMemo(
    () =>
      dashboard.deliveriesTrend.map((item, index) => ({
        month: item.month,
        value: Math.max(60, item.deliveries - (dashboard.delayAnalytics[index]?.delays || 0) * 2),
      })),
    [dashboard.deliveriesTrend, dashboard.delayAnalytics]
  );

  const activeDeliveries = shipments.filter((item) => item.status === "In Transit" || item.status === "Pending");
  const delayedShipments = shipments.filter((item) => item.status === "Delayed");
  const availableVehicles = vehicles.filter((item) => item.status === "Available");
  const availableDrivers = drivers.filter((item) => item.availabilityStatus === "Available");
  const dispatchPerformance = Math.max(68, 94 - delayedShipments.length * 6 + availableVehicles.length * 2 - availableDrivers.length);

  const availabilityBreakdown = [
    { name: "Vehicles", value: availableVehicles.length, color: "#22d3ee" },
    { name: "Drivers", value: availableDrivers.length, color: "#4f46e5" },
    { name: "Delayed", value: delayedShipments.length, color: "#f97316" },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold">Analytics Window</p>
            <p className="text-xs text-muted-foreground">Transport control metrics tuned for dispatch and route execution</p>
          </div>
          <div className="md:ml-auto">
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={range} disabled>
              {DATE_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Route Efficiency" value={`${Math.max(60, Math.round(routeEfficiency.reduce((sum, item) => sum + item.value, 0) / Math.max(1, routeEfficiency.length)))}%`} hint="Planned vs executed routes" icon={undefined as never} />
        <StatCard title="Active Deliveries" value={activeDeliveries.length} hint="On-road and queued" icon={undefined as never} />
        <StatCard title="Delayed Shipments" value={delayedShipments.length} hint="Needs re-routing" icon={undefined as never} />
        <StatCard title="Vehicle Availability" value={availableVehicles.length} hint="Ready for dispatch" icon={undefined as never} />
        <StatCard title="Driver Availability" value={availableDrivers.length} hint="Available for assignment" icon={undefined as never} />
        <StatCard title="Dispatch Performance" value={`${dispatchPerformance}%`} hint="Throughput score" icon={undefined as never} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Route efficiency trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={routeEfficiency}>
                <defs>
                  <linearGradient id="tmRouteGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#06b6d4" fill="url(#tmRouteGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispatch performance</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={availabilityBreakdown} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={4}>
                    {availabilityBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 rounded-2xl border border-border/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Operational focus</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Keep vehicle and driver pools aligned to active lanes, then use delayed shipment counts to rebalance dispatch priorities.
              </p>
              <div className="rounded-xl border border-border/70 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Active queue</p>
                <p className="mt-2 text-2xl font-semibold">{activeDeliveries.length}</p>
              </div>
              <div className="rounded-xl border border-border/70 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Delay pressure</p>
                <p className="mt-2 text-2xl font-semibold">{delayedShipments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Resource availability</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={availabilityBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Delivery pressure</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.deliveriesTrend.map((item, index) => ({ month: item.month, active: item.deliveries, delayed: dashboard.delayAnalytics[index]?.delays || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="active" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                <Bar dataKey="delayed" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export const AnalyticsPage = () => {
  const [range] = useState<(typeof DATE_FILTERS)[number]>("30d");
  const { user } = useAuth();

  if (user?.role === "Transport Manager") {
    return <TransportManagerAnalytics range={range} />;
  }

  return <AdminAnalytics range={range} />;
};