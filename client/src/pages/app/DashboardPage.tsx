import { useMemo } from "react";
import { Activity, ArrowRight, Fuel, Timer, Truck, UserCheck, Waypoints, ShieldAlert, Route, Gauge, Wrench, Sparkles } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { StatCard } from "@/components/dashboard/StatCard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import TransportManagerDashboard from "@/components/dashboards/TransportManagerDashboard";
import WarehouseStaffDashboard from "@/components/dashboards/WarehouseStaffDashboard";
import DriverDashboard from "@/components/dashboards/DriverDashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";

export const DashboardPage = () => {
  const { user } = useAuth();
  const { dashboard, shipments, notifications } = useSmartFleetSimulation();

  if (user?.role === "Admin") {
    return <AdminDashboard />;
  }
  if (user?.role === "Transport Manager") {
    return <TransportManagerDashboard />;
  }
  if (user?.role === "Warehouse Staff") {
    return <WarehouseStaffDashboard />;
  }
  if (user?.role === "Driver") {
    return <DriverDashboard />;
  }

  const recentShipments = useMemo(() => shipments.slice(0, 6), [shipments]);
  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);
  const smartInsights = useMemo(() => {
    const fuelAverage = Math.round(dashboard.fuelUsage.reduce((sum, item) => sum + item.liters, 0) / dashboard.fuelUsage.length);
    const delayRate = Math.round((dashboard.kpis.delayedShipments / Math.max(1, shipments.length)) * 100);
    const fleetHealth = Math.max(52, 98 - dashboard.kpis.delayedShipments * 4 - dashboard.fleetUtilization.find((item) => item.status === "Maintenance")!.value * 3);
    const deliveryEfficiency = Math.max(58, 100 - delayRate);
    const predictedDelays = dashboard.kpis.delayedShipments + Math.max(1, Math.round(dashboard.kpis.activeDeliveries * 0.12));
    const routeOptimization = Math.min(98, 82 + Math.round((dashboard.fleetUtilization.find((item) => item.status === "Available")?.value || 0) * 1.5));

    return {
      riskScore: Math.min(100, delayRate * 2 + (100 - fleetHealth) + (dashboard.kpis.activeDeliveries > 4 ? 8 : 0)),
      deliveryEfficiency,
      fleetHealth,
      routeOptimization,
      predictedDelays,
      fuelAverage,
      trafficWarning: dashboard.kpis.activeDeliveries > 3 ? "Traffic congestion detected near Chennai route." : "Route flow is stable across active lanes.",
      maintenanceNote:
        dashboard.kpis.delayedShipments > 2
          ? "2 vehicles currently under maintenance review."
          : "Maintenance queue is within normal threshold.",
      fuelInsight:
        fuelAverage < 7200
          ? "Fleet efficiency improved by 9% compared to last week."
          : "Vehicle TRK-104 shows 18% higher fuel usage this week.",
      delayInsight:
        predictedDelays > 3 ? `3 shipments approaching delivery deadline.` : "No critical delivery deadline risk detected.",
      routeInsight:
        routeOptimization > 90 ? "Suggested route via NH16 saves 12% fuel consumption." : "Alternative routing can improve ETA by 7%.",
    };
  }, [dashboard, shipments.length]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <span>Risk Score</span>
              <ShieldAlert className="h-4 w-4" />
            </div>
            <p className="mt-4 text-3xl font-semibold">{smartInsights.riskScore}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-red-400" style={{ width: `${smartInsights.riskScore}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <span>Delivery Efficiency</span>
              <Gauge className="h-4 w-4" />
            </div>
            <p className="mt-4 text-3xl font-semibold">{smartInsights.deliveryEfficiency}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${smartInsights.deliveryEfficiency}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <span>Fleet Health</span>
              <Wrench className="h-4 w-4" />
            </div>
            <p className="mt-4 text-3xl font-semibold">{smartInsights.fleetHealth}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-cyan-400" style={{ width: `${smartInsights.fleetHealth}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <span>Route Score</span>
              <Route className="h-4 w-4" />
            </div>
            <p className="mt-4 text-3xl font-semibold">{smartInsights.routeOptimization}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-indigo-400" style={{ width: `${smartInsights.routeOptimization}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <span>Predicted Delays</span>
              <Timer className="h-4 w-4" />
            </div>
            <p className="mt-4 text-3xl font-semibold">{smartInsights.predictedDelays}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              Heuristic risk estimate
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Live Operations Insights</CardTitle>
            <Badge>Auto-refresh</Badge>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              { title: "Delay prediction", body: smartInsights.delayInsight, tone: "border-red-400/20 bg-red-400/10" },
              { title: "Route optimization", body: smartInsights.routeInsight, tone: "border-indigo-400/20 bg-indigo-400/10" },
              { title: "Fuel intelligence", body: smartInsights.fuelInsight, tone: "border-emerald-400/20 bg-emerald-400/10" },
              { title: "Maintenance alert", body: smartInsights.maintenanceNote, tone: "border-amber-400/20 bg-amber-400/10" },
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl border p-4 ${item.tone}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-6">{item.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>AI-Style Assistant</CardTitle>
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { query: "Show delayed shipments", response: `${dashboard.kpis.delayedShipments} shipment(s) need escalation.` },
              { query: "Fleet status", response: `${dashboard.kpis.vehiclesActive} active vehicles, ${dashboard.fleetUtilization.find((item) => item.status === "Maintenance")?.value || 0} in maintenance.` },
              { query: "Fuel alerts", response: smartInsights.fuelInsight },
            ].map((item) => (
              <div key={item.query} className="rounded-xl border border-border/70 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{item.query}</p>
                <p className="mt-2 text-sm">{item.response}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Active Deliveries" value={dashboard.kpis.activeDeliveries} hint="Live on-road shipments" icon={Activity} />
        <StatCard title="Delayed Shipments" value={dashboard.kpis.delayedShipments} hint="Requires attention" icon={Timer} />
        <StatCard title="Vehicles Active" value={dashboard.kpis.vehiclesActive} hint="Fleet running today" icon={Truck} />
        <StatCard title="Fuel Consumption" value={`${dashboard.kpis.fuelConsumption} L`} hint="Current month burn" icon={Fuel} />
        <StatCard title="Drivers On Duty" value={dashboard.kpis.driversOnDuty} hint="Assigned to routes" icon={UserCheck} />
        <StatCard title="Monthly Trips" value={dashboard.deliveriesTrend.reduce((sum, item) => sum + item.deliveries, 0)} hint="Trips logged in dashboard" icon={Waypoints} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Deliveries Trend</CardTitle>
            <Badge variant="secondary">Live</Badge>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.deliveriesTrend}>
                <defs>
                  <linearGradient id="delGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="deliveries" stroke="#4f46e5" fill="url(#delGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fleet Utilization</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dashboard.fleetUtilization} dataKey="value" nameKey="status" outerRadius={80} fill="#06b6d4" />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Shipments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentShipments.map((shipment) => (
              <div key={shipment._id} className="rounded-lg border border-border/70 p-3 transition hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{shipment.shipmentId}</p>
                  <Badge>{shipment.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{shipment.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {shipment.origin} → {shipment.destination}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                    style={{
                      width:
                        shipment.status === "Delivered"
                          ? "100%"
                          : shipment.status === "In Transit"
                            ? "65%"
                            : shipment.status === "Delayed"
                              ? "42%"
                              : "18%",
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotifications.map((item) => (
              <div key={item._id} className="rounded-lg border border-border/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <Badge>{item.type}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Trend (6 months)</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboard.fuelUsage}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="liters" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delay Analytics</CardTitle>
        </CardHeader>
        <CardContent className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboard.delayAnalytics}>
              <defs>
                <linearGradient id="delayGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="delays" stroke="#f97316" fill="url(#delayGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
