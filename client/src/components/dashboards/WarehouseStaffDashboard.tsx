import { useMemo } from "react";
import { Box, ClipboardList, Package, Truck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";

export const WarehouseStaffDashboard = () => {
  const sim = useSmartFleetSimulation();
  const shipments = sim.shipments ?? [];
  const inventory = sim.inventory ?? [];
  const docks = sim.docks ?? [];

  const incoming = useMemo(() => (shipments ?? []).filter((s) => s?.status === "Pending" || s?.status === "Ready"), [shipments]);
  const pickQueue = useMemo(() => (inventory ?? []).filter((i) => i?.pickPriority && i?.pickPriority !== "Low"), [inventory]);
  const activeDocks = useMemo(() => (docks ?? []).filter((d) => d?.status === "Active"), [docks]);

  return (
    <div className="space-y-6 text-slate-100">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Incoming Shipments" value={incoming.length} hint="Awaiting receive" icon={Truck} />
        <StatCard title="Pick & Pack Queue" value={pickQueue.length} hint="Items to pick" icon={ClipboardList} />
        <StatCard title="Inventory SKUs" value={inventory.length} hint="Total SKUs" icon={Package} />
        <StatCard title="Active Docks" value={activeDocks.length} hint="Loading bays" icon={Box} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receive Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {incoming.slice(0, 8).map((s) => (
              <div key={s._id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <p className="font-medium">{s.shipmentId}</p>
                  <p className="text-xs text-muted-foreground">{s.origin} → {s.destination}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Status: {s.status}</p>
                  <p className="text-xs text-muted-foreground">Priority: {s.priority}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dock Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeDocks.slice(0, 6).map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <p className="font-medium">Dock {d.dockNumber}</p>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{d.status}</p>
                  <p className="text-xs text-muted-foreground">ETA: {d.eta ?? "--"}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pick Priorities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pickQueue.slice(0, 8).map((i) => (
              <div key={i.sku} className="rounded-lg border border-border/60 p-3">
                <p className="font-medium">{i.sku}</p>
                <p className="text-xs text-muted-foreground">Qty: {i.quantity} • Loc: {i.location}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full rounded-md bg-primary/10 px-3 py-2 text-left text-sm text-primary">Start receiving shipment</button>
            <button className="w-full rounded-md bg-emerald-600/10 px-3 py-2 text-left text-sm text-emerald-400">Create putaway task</button>
            <button className="w-full rounded-md bg-amber-600/10 px-3 py-2 text-left text-sm text-amber-400">Generate pick list</button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default WarehouseStaffDashboard;
