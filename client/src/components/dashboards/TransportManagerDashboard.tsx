import { useMemo } from "react";
import { AlertTriangle, Activity, ArrowRight, Truck, Users } from "lucide-react";

import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";

const colors = ["#06b6d4", "#38bdf8", "#4f46e5", "#f59e0b"];

export const TransportManagerDashboard = () => {
  const { shipments, vehicles, drivers, dashboard, createShipment, updateShipment } = useSmartFleetSimulation();

  const activeShipments = useMemo(() => shipments.filter((s) => s.status === "In Transit" || s.status === "Pending"), [shipments]);
  const delayed = useMemo(() => shipments.filter((s) => s.status === "Delayed"), [shipments]);
  const availableVehicles = useMemo(() => vehicles.filter((v) => v.status === "Available"), [vehicles]);
  const availableDrivers = useMemo(() => drivers.filter((d) => d.availabilityStatus === "Available"), [drivers]);

  return (
    <div className="space-y-6 text-slate-100">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Deliveries In Transit" value={activeShipments.length} hint="On road or queued" icon={Truck} />
        <StatCard title="Delayed Routes" value={delayed.length} hint="Requires reroute" icon={AlertTriangle} />
        <StatCard title="Available Vehicles" value={availableVehicles.length} hint="Ready for assignment" icon={Activity} />
        <StatCard title="Driver Availability" value={availableDrivers.length} hint="Standby drivers" icon={Users} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Shipment Scheduling</CardTitle>
            <Badge>Live</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              {activeShipments.slice(0, 6).map((s) => (
                <div key={s._id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{s.shipmentId}</p>
                      <p className="text-xs text-muted-foreground">{s.origin} → {s.destination}</p>
                    </div>
                    <Badge>{s.status}</Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${s.status === "In Transit" ? 65 : 18}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>ETA: {new Date(s.estimatedDelivery).toLocaleDateString()}</span>
                    <button
                      className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"
                      onClick={() => updateShipment(s._id, { status: "In Transit" })}
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Route Optimization</CardTitle>
            <Badge variant="secondary">Estimate</Badge>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-border/60 pt-3">
            {[
              { label: "Delayed routes", value: delayed.length, hint: "Need reroute review" },
              { label: "Available vehicles", value: availableVehicles.length, hint: "Ready to assign" },
              { label: "Available drivers", value: availableDrivers.length, hint: "Standby pool" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-sm text-primary">{item.value}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
              </div>
            ))}
            <div className="flex items-center justify-end border-t border-border/60 pt-3">
              <button className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary transition hover:bg-primary/15">
                See more
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Shipments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeShipments.slice(0, 8).map((s) => (
              <div key={s._id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <p className="font-medium">{s.shipmentId}</p>
                  <p className="text-xs text-muted-foreground">{s.origin} → {s.destination}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{s.progress ?? 0}%</p>
                  <p className="text-xs text-muted-foreground">{s.priority}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {vehicles.slice(0, 6).map((v) => (
              <div key={v._id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <p className="font-medium">{v.vehicleNumber}</p>
                  <p className="text-xs text-muted-foreground">{v.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{v.status}</p>
                  <p className="text-xs text-muted-foreground">Fuel: {v.fuelLevel ?? "--"}%</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {drivers.slice(0, 6).map((d) => (
              <div key={d._id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {d.employeeId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{d.availabilityStatus}</p>
                  <p className="text-xs text-muted-foreground">Trips: {d.completedTrips}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Live operations feed</CardTitle>
            <LiveIndicator tone="emerald" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-3">
                <p className="text-sm">Shipment SHP-{1000 + i} assigned to TRK-{800 + i}</p>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleTimeString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2">
              <button className="rounded-lg bg-primary/10 px-3 py-2 text-left text-sm text-primary">Create scheduled shipment</button>
              <button className="rounded-lg bg-amber-600/10 px-3 py-2 text-left text-sm text-amber-400">Assign driver to vehicle</button>
              <button className="rounded-lg bg-rose-600/10 px-3 py-2 text-left text-sm text-rose-400">Escalate delayed routes</button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default TransportManagerDashboard;