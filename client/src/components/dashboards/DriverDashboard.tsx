import { useMemo, useState } from "react";
import { ArrowRight, Clock, Fuel, MapPinned, Navigation, PhoneCall, ShieldAlert, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";
import { useAuth } from "@/context/AuthContext";

const fallbackRoutePoints = [
  { label: "Origin", lat: 17.385, lng: 78.4867 },
  { label: "Checkpoint", lat: 17.442, lng: 78.499 },
  { label: "Delivery", lat: 17.512, lng: 78.45 },
];

export const DriverDashboard = () => {
  const { user } = useAuth();
  const { shipments, vehicles, notifications, updateShipment } = useSmartFleetSimulation();
  const [routeMessage, setRouteMessage] = useState<string>("Route is optimized for current conditions.");

  const myShipments = useMemo(
    () => shipments.filter((shipment) => shipment.driver?._id === user?.id || shipment.driver?.name === user?.name),
    [shipments, user]
  );
  const inProgress = myShipments.filter((shipment) => shipment.status === "In Transit");
  const pending = myShipments.filter((shipment) => shipment.status === "Pending" || shipment.status === "Delayed");
  const currentTrip = inProgress[0] || pending[0] || myShipments[0] || null;
  const assignedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.driverAssigned?.name === user?.name || vehicle.driverAssigned?._id === user?.id) ?? null,
    [vehicles, user]
  );
  const routeProgress = currentTrip?.progress ?? (currentTrip?.status === "In Transit" ? 68 : currentTrip?.status === "Delayed" ? 42 : currentTrip ? 18 : 0);
  const driverNotifications = useMemo(
    () => notifications.filter((notification) => notification.audienceRoles.includes("Driver") || notification.audienceRoles.includes("Admin")).slice(0, 5),
    [notifications]
  );

  const simulateReroute = () => {
    if (!currentTrip) return;

    updateShipment(currentTrip._id, { status: "In Transit", progress: Math.min(100, routeProgress + 18) });
    setRouteMessage(`Reroute simulated for ${currentTrip.shipmentId}. Updated ETA and route progress.`);
  };

  const clearRouteMessage = () => {
    setRouteMessage("Route is optimized for current conditions.");
  };

  return (
    <div className="space-y-4 pb-28 text-foreground md:space-y-6 md:pb-0">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Assigned Trips" value={myShipments.length} hint="Total assigned" icon={Truck} />
        <StatCard title="On Route" value={inProgress.length} hint="Currently driving" icon={Navigation} />
        <StatCard title="Pending" value={pending.length} hint="Awaiting pickup" icon={Clock} />
        <StatCard title="Fuel Level" value={`${assignedVehicle?.fuelLevel ?? "--"}%`} hint="Assigned vehicle" icon={Fuel} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-slate-200 dark:border-white/10 lg:col-span-2">
          <CardHeader className="space-y-1">
            <CardTitle>Current Trip</CardTitle>
            <p className="text-xs text-slate-600 dark:text-slate-400">Touch-friendly trip details for mobile use</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">Current route</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{currentTrip ? `${currentTrip.origin} → ${currentTrip.destination}` : "No active trip"}</p>
                </div>
                <Badge className="border-slate-200 dark:border-white/10 bg-background/80 text-foreground">{currentTrip?.status ?? "Standby"}</Badge>
              </div>
              <div className="mt-4 rounded-2xl border border-border/50 bg-[linear-gradient(135deg,rgba(8,145,178,0.14),rgba(15,23,42,0.04))] p-4">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Route progress</span>
                  <span>{routeProgress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${routeProgress}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{routeMessage}</p>
              </div>
            </div>

            <div className="grid gap-2">
              {inProgress.concat(pending).slice(0, 4).map((shipment) => (
                <div key={shipment._id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                  <div>
                    <p className="font-medium text-foreground">{shipment.shipmentId}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{shipment.origin} → {shipment.destination}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center rounded-full bg-emerald-600/10 px-4 text-sm font-medium text-emerald-600 transition hover:bg-emerald-600/20 dark:text-emerald-300"
                    onClick={() => updateShipment(shipment._id, { status: "Delivered", progress: 100 })}
                  >
                    Mark delivered
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-white/10">
          <CardHeader className="space-y-1">
            <CardTitle>Vehicle</CardTitle>
            <p className="text-xs text-slate-600 dark:text-slate-400">Assigned unit and quick actions</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">Assigned vehicle</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{assignedVehicle?.vehicleNumber ?? "—"}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Status: {assignedVehicle?.status ?? "—"}</p>
            </div>
            <button type="button" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary/10 px-4 text-sm font-medium text-primary transition hover:bg-primary/15">
              Report issue
            </button>
            <button type="button" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-600/10 px-4 text-sm font-medium text-emerald-600 transition hover:bg-emerald-600/20 dark:text-emerald-300">
              Check in
            </button>
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-amber-600/10 px-4 text-sm font-medium text-amber-600 transition hover:bg-amber-600/20 dark:text-amber-300"
              onClick={simulateReroute}
            >
              Simulate reroute
            </button>
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-600/10 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-600/20 dark:text-slate-300"
              onClick={clearRouteMessage}
            >
              Clear route note
            </button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-slate-200 dark:border-white/10">
          <CardHeader className="space-y-1">
            <CardTitle>Quick Navigation</CardTitle>
            <p className="text-xs text-slate-600 dark:text-slate-400">Optimized for one-handed use</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <button type="button" className="inline-flex h-12 w-full items-center justify-between rounded-2xl bg-primary/10 px-4 text-sm font-medium text-primary transition hover:bg-primary/15">
              Start navigation <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" className="inline-flex h-12 w-full items-center justify-between rounded-2xl bg-amber-600/10 px-4 text-sm font-medium text-amber-600 transition hover:bg-amber-600/20 dark:text-amber-300">
              Call dispatcher <PhoneCall className="h-4 w-4" />
            </button>
            <button type="button" className="inline-flex h-12 w-full items-center justify-between rounded-2xl bg-rose-600/10 px-4 text-sm font-medium text-rose-600 transition hover:bg-rose-600/20 dark:text-rose-300">
              Request support <ShieldAlert className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-white/10">
          <CardHeader className="space-y-1">
            <CardTitle>Route map</CardTitle>
            <p className="text-xs text-slate-600 dark:text-slate-400">Google Maps fallback coordinates and tracked milestones</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-44 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-[linear-gradient(135deg,rgba(8,145,178,0.12),rgba(15,23,42,0.04))] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">Tracked route</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Fallback coordinates</p>
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
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-slate-200 dark:border-white/10">
          <CardHeader className="space-y-1">
            <CardTitle>Delivery Log</CardTitle>
            <p className="text-xs text-slate-600 dark:text-slate-400">Recent trip history</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {myShipments.slice(0, 4).map((shipment) => (
              <div key={shipment._id} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <p className="text-sm font-medium text-foreground">
                  {shipment.shipmentId} - {shipment.status}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">ETA: {shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleTimeString() : "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-white/10">
          <CardHeader className="space-y-1">
            <CardTitle>Notifications</CardTitle>
            <p className="text-xs text-slate-600 dark:text-slate-400">Recent updates for your route</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {driverNotifications.map((notification) => (
              <div key={notification._id} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{notification.title}</p>
                  <Badge className="border-slate-200 dark:border-white/10 bg-background/80 text-foreground">{notification.type}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{notification.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-3 gap-2">
          <button type="button" className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-medium text-primary">
            Nav
          </button>
          <button type="button" className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-600/10 text-sm font-medium text-emerald-600 dark:text-emerald-300">
            Done
          </button>
          <button type="button" className="inline-flex h-12 items-center justify-center rounded-2xl bg-amber-600/10 text-sm font-medium text-amber-600 dark:text-amber-300">
            Help
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
