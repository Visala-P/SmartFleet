import { useMemo, useState } from "react";
import { AlertTriangle, Activity, ArrowRight, MapPinned, Truck, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";

type RouteSuggestion = {
  id: string;
  shipmentRefId: string;
  shipmentId: string;
  vehicleNumber: string;
  driverName: string;
  eta: string;
  progress: number;
};

const fallbackRoutePoints = [
  { label: "Warehouse A", lat: 17.385, lng: 78.4867 },
  { label: "Hub Stop", lat: 17.442, lng: 78.499 },
  { label: "Customer Zone", lat: 17.512, lng: 78.45 },
];

export const TransportManagerDashboard = () => {
  const { shipments, vehicles, drivers, updateShipment } = useSmartFleetSimulation();
  const [suggestedRoutes, setSuggestedRoutes] = useState<RouteSuggestion[]>([]);

  const activeShipments = useMemo(() => shipments.filter((s) => s.status === "In Transit" || s.status === "Pending"), [shipments]);
  const delayed = useMemo(() => shipments.filter((s) => s.status === "Delayed"), [shipments]);
  const availableVehicles = useMemo(() => vehicles.filter((v) => v.status === "Available"), [vehicles]);
  const availableDrivers = useMemo(() => drivers.filter((d) => d.availabilityStatus === "Available"), [drivers]);
  const analyticsData = useMemo(
    () => [
      { name: "Active", value: activeShipments.length },
      { name: "Delayed", value: delayed.length },
      { name: "Suggested", value: suggestedRoutes.length },
    ],
    [activeShipments.length, delayed.length, suggestedRoutes.length]
  );

  const runOptimization = () => {
    const generated = delayed.slice(0, 3).map((shipment, index) => ({
      id: `${shipment._id}-suggested`,
      shipmentRefId: shipment._id,
      shipmentId: shipment.shipmentId,
      vehicleNumber: availableVehicles[index % Math.max(1, availableVehicles.length)]?.vehicleNumber ?? vehicles[index % Math.max(1, vehicles.length)]?.vehicleNumber ?? "TBD",
      driverName: availableDrivers[index % Math.max(1, availableDrivers.length)]?.name ?? drivers[index % Math.max(1, drivers.length)]?.name ?? "TBD",
      eta: new Date(Date.now() + (index + 2) * 60 * 60 * 1000).toLocaleTimeString(),
      progress: 24 + index * 17,
    }));

    setSuggestedRoutes(generated);
  };

  const simulateReroute = () => {
    if (!suggestedRoutes.length) {
      runOptimization();
      return;
    }

    suggestedRoutes.forEach((route) => updateShipment(route.shipmentRefId, { status: "In Transit" }));
    setSuggestedRoutes((current) => current.map((route) => ({ ...route, progress: Math.min(100, route.progress + 18) })));
  };

  const clearSuggestedRoutes = () => setSuggestedRoutes([]);

  return (
    <div className="space-y-6 text-foreground">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Deliveries In Transit" value={activeShipments.length} hint="On road or queued" icon={Truck} />
        <StatCard title="Delayed Routes" value={delayed.length} hint="Requires reroute" icon={AlertTriangle} />
        <StatCard title="Available Vehicles" value={availableVehicles.length} hint="Ready for assignment" icon={Activity} />
        <StatCard title="Driver Availability" value={availableDrivers.length} hint="Standby drivers" icon={Users} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="w-full max-w-full lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Shipment Scheduling</CardTitle>
            <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">Live</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              {activeShipments.slice(0, 6).map((shipment) => (
                <div key={shipment._id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{shipment.shipmentId}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {shipment.origin} → {shipment.destination}
                      </p>
                    </div>
                    <Badge className="border-slate-200 dark:border-white/10 bg-background/80 text-foreground">{shipment.status}</Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${shipment.status === "In Transit" ? 65 : 18}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>ETA: {new Date(shipment.estimatedDelivery).toLocaleDateString()}</span>
                    <button
                      type="button"
                      className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"
                      onClick={() => updateShipment(shipment._id, { status: "In Transit" })}
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-full">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Route Optimization</CardTitle>
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300">Estimate</Badge>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-slate-200 dark:border-white/10 pt-3">
            {[
              { label: "Delayed routes", value: delayed.length, hint: "Need reroute review" },
              { label: "Available vehicles", value: availableVehicles.length, hint: "Ready to assign" },
              { label: "Available drivers", value: availableDrivers.length, hint: "Standby pool" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-sm text-primary">{item.value}</p>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{item.hint}</p>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 dark:border-white/10 pt-3">
              <button
                type="button"
                onClick={runOptimization}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary transition hover:bg-primary/15"
              >
                Run Optimization
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={simulateReroute}
                className="rounded-full border border-slate-200 dark:border-white/10 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600 transition hover:bg-emerald-500/15 dark:text-emerald-300"
              >
                Simulate Reroute
              </button>
              <button
                type="button"
                onClick={clearSuggestedRoutes}
                className="rounded-full border border-slate-200 dark:border-white/10 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-600 transition hover:bg-rose-500/15 dark:text-rose-300"
              >
                Clear Suggested Routes
              </button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="w-full max-w-full">
          <CardHeader>
            <CardTitle>Active Shipments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeShipments.slice(0, 8).map((shipment) => (
              <div key={shipment._id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <div>
                  <p className="font-medium">{shipment.shipmentId}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {shipment.origin} → {shipment.destination}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{shipment.progress ?? 0}%</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{shipment.priority}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="w-full max-w-full">
          <CardHeader>
            <CardTitle>Vehicle Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {vehicles.slice(0, 6).map((vehicle) => (
              <div key={vehicle._id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <div>
                  <p className="font-medium">{vehicle.vehicleNumber}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{vehicle.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{vehicle.status}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Fuel: {vehicle.fuelLevel ?? "--"}%</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="w-full max-w-full">
          <CardHeader>
            <CardTitle>Driver Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {drivers.slice(0, 6).map((driver) => (
              <div key={driver._id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <div>
                  <p className="font-medium">{driver.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">ID: {driver.employeeId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{driver.availabilityStatus}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Trips: {driver.completedTrips}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="w-full max-w-full">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Live operations feed</CardTitle>
            <LiveIndicator tone="emerald" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <p className="text-sm">Shipment SHP-{1000 + index} assigned to TRK-{800 + index}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{new Date().toLocaleTimeString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="w-full max-w-full">
          <CardHeader>
            <CardTitle>Route tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-44 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-[linear-gradient(135deg,rgba(8,145,178,0.12),rgba(15,23,42,0.04))] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">Fallback coordinates</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Google Maps route tracking</p>
                </div>
                <MapPinned className="h-5 w-5 stroke-[2.4] text-cyan-700 dark:text-cyan-400" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                {fallbackRoutePoints.map((point) => (
                  <div key={point.label} className="rounded-xl border border-slate-200 dark:border-white/10 bg-background/70 p-2">
                    <p className="font-semibold text-foreground">{point.label}</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {point.lat.toFixed(3)}, {point.lng.toFixed(3)}
                    </p>
                  </div>
                ))}
              </div>
              <a
                className="mt-3 inline-flex rounded-full border border-slate-200 dark:border-white/10 bg-background/80 px-3 py-2 text-xs font-semibold text-primary"
                href={`https://www.google.com/maps/dir/${fallbackRoutePoints.map((point) => `${point.lat},${point.lng}`).join("/")}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-200 dark:border-white/10 p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">Suggested routes</p>
              {(suggestedRoutes.length
                ? suggestedRoutes
                : [{ id: "empty", shipmentRefId: "", shipmentId: "No suggestions", vehicleNumber: "—", driverName: "—", eta: "—", progress: 0 }]
              ).map((route) => (
                <div key={route.id} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{route.shipmentId}</p>
                    <Badge className="border-slate-200 dark:border-white/10 bg-background/80 text-foreground">{route.progress}%</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Vehicle: {route.vehicleNumber} • Driver: {route.driverName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">ETA: {route.eta}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="w-full max-w-full">
          <CardHeader>
            <CardTitle>Analytics snapshot</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="w-full max-w-full">
          <CardHeader>
            <CardTitle>Optimization details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedRoutes.length ? (
              suggestedRoutes.map((route) => (
                <div key={route.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                  <p className="font-medium">{route.shipmentId}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Route progress: {route.progress}%</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Run optimization to populate suggested reroutes.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default TransportManagerDashboard;
