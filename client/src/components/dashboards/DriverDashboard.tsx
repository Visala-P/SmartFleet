import { useMemo } from "react";
import { ArrowRight, Clock, Fuel, Navigation, PhoneCall, ShieldAlert, Truck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";
import { useAuth } from "@/context/AuthContext";

export const DriverDashboard = () => {
  const { user } = useAuth();
  const { shipments, vehicles, updateShipment } = useSmartFleetSimulation();

  const myShipments = useMemo(() => shipments.filter((s) => s.driverName === user?.name || s.driverId === user?.id), [shipments, user]);
  const inProgress = myShipments.filter((s) => s.status === "In Transit");
  const pending = myShipments.filter((s) => s.status === "Ready" || s.status === "Pending");
  const currentTrip = inProgress[0] || pending[0] || myShipments[0];

  return (
    <div className="space-y-4 pb-28 text-slate-100 md:space-y-6 md:pb-0">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Assigned Trips" value={myShipments.length} hint="Total assigned" icon={Truck} />
        <StatCard title="On Route" value={inProgress.length} hint="Currently driving" icon={Navigation} />
        <StatCard title="Pending" value={pending.length} hint="Awaiting pickup" icon={Clock} />
        <StatCard title="Fuel Level" value={`${vehicles.find((v) => v.assignedDriver === user?.name)?.fuelLevel ?? "--"}%`} hint="Assigned vehicle" icon={Fuel} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/60 lg:col-span-2">
          <CardHeader className="space-y-1">
            <CardTitle>Current Trip</CardTitle>
            <p className="text-xs text-muted-foreground">Touch-friendly trip details for mobile use</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Current route</p>
                  <p className="mt-1 text-lg font-semibold">{currentTrip ? `${currentTrip.origin} → ${currentTrip.destination}` : "No active trip"}</p>
                </div>
                <div className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                  {currentTrip?.status ?? "Standby"}
                </div>
              </div>
              <div className="mt-4 h-40 rounded-2xl border border-border/50 bg-gradient-to-br from-cyan-500/10 to-slate-900" />
            </div>

            <div className="grid gap-2">
              {inProgress.concat(pending).slice(0, 4).map((s) => (
                <div key={s._id} className="flex items-center justify-between rounded-2xl border border-border/60 p-3">
                  <div>
                    <p className="font-medium">{s.shipmentId}</p>
                    <p className="text-xs text-muted-foreground">{s.origin} → {s.destination}</p>
                  </div>
                  <button
                    className="inline-flex h-10 items-center rounded-full bg-emerald-600/10 px-4 text-sm font-medium text-emerald-300 transition hover:bg-emerald-600/20"
                    onClick={() => updateShipment(s._id, { status: "Delivered" })}
                  >
                    Mark delivered
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle>Vehicle</CardTitle>
            <p className="text-xs text-muted-foreground">Assigned unit and quick actions</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border/60 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Assigned vehicle</p>
              <p className="mt-2 text-2xl font-semibold">{vehicles.find((v) => v.assignedDriver === user?.name)?.vehicleNumber ?? "—"}</p>
              <p className="mt-1 text-sm text-muted-foreground">Status: {vehicles.find((v) => v.assignedDriver === user?.name)?.status ?? "—"}</p>
            </div>
            <button className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary/10 px-4 text-sm font-medium text-primary transition hover:bg-primary/15">
              Report issue
            </button>
            <button className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-600/10 px-4 text-sm font-medium text-emerald-300 transition hover:bg-emerald-600/20">
              Check in
            </button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle>Quick Navigation</CardTitle>
            <p className="text-xs text-muted-foreground">Optimized for one-handed use</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="inline-flex h-12 w-full items-center justify-between rounded-2xl bg-primary/10 px-4 text-sm font-medium text-primary transition hover:bg-primary/15">
              Start navigation <ArrowRight className="h-4 w-4" />
            </button>
            <button className="inline-flex h-12 w-full items-center justify-between rounded-2xl bg-amber-600/10 px-4 text-sm font-medium text-amber-400 transition hover:bg-amber-600/20">
              Call dispatcher <PhoneCall className="h-4 w-4" />
            </button>
            <button className="inline-flex h-12 w-full items-center justify-between rounded-2xl bg-rose-600/10 px-4 text-sm font-medium text-rose-400 transition hover:bg-rose-600/20">
              Request support <ShieldAlert className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle>Delivery Log</CardTitle>
            <p className="text-xs text-muted-foreground">Recent trip history</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {myShipments.slice(0, 4).map((s) => (
              <div key={s._id} className="rounded-2xl border border-border/60 p-3">
                <p className="text-sm font-medium">
                  {s.shipmentId} - {s.status}
                </p>
                <p className="text-xs text-muted-foreground">ETA: {s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleTimeString() : "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-3 gap-2">
          <button className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-medium text-primary">
            Nav
          </button>
          <button className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-600/10 text-sm font-medium text-emerald-300">
            Done
          </button>
          <button className="inline-flex h-12 items-center justify-center rounded-2xl bg-amber-600/10 text-sm font-medium text-amber-400">
            Help
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
