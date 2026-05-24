import { useMemo, useState } from "react";
import { Box, ClipboardList, Package, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/dashboard/StatCard";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";

type DetailSection = "incoming" | "outgoing" | "docks" | "pickQueue" | "loadingTasks" | null;

export const WarehouseStaffDashboard = () => {
  const sim = useSmartFleetSimulation();
  const shipments = sim.shipments ?? [];
  const inventory = sim.inventory ?? [];
  const docks = sim.docks ?? [];
  const [dispatchedTaskIds, setDispatchedTaskIds] = useState<string[]>([]);
  const [activeDetail, setActiveDetail] = useState<DetailSection>(null);

  const activeDocks = useMemo(
    () =>
      (docks.length
        ? docks
        : Array.from({ length: 4 }).map((_, index) => ({
            id: `dock-${index + 1}`,
            dockNumber: index + 1,
            label: index % 2 === 0 ? "Inbound receiving" : "Outbound staging",
            status: index < 2 ? "Active" : "Queued",
            eta: `${8 + index}:30 AM`,
          })))
        .map((dock, index) => ({
          ...dock,
          shipmentId: shipments[index]?.shipmentId ?? "—",
        })),
    [docks, shipments]
  );

  const incoming = useMemo(() => shipments.filter((s) => s?.status === "Pending" || s?.status === "In Transit"), [shipments]);
  const outgoing = useMemo(() => shipments.filter((s) => s?.status === "Delivered" || s?.status === "Delayed"), [shipments]);
  const incomingDisplay = useMemo(
    () =>
      incoming.slice(0, 8).map((shipment, index) => ({
        id: shipment._id,
        shipmentId: shipment.shipmentId,
        route: `${shipment.origin} → ${shipment.destination}`,
        status: shipment.status,
        priority: shipment.priority,
        dock: index + 1,
        window: `${8 + index}:00 - ${9 + index}:00`,
        note: index % 2 === 0 ? "Receiving bay" : "Unload queue",
      })),
    [incoming]
  );
  const outgoingDisplay = useMemo(
    () =>
      outgoing.slice(0, 8).map((shipment, index) => ({
        id: shipment._id,
        shipmentId: shipment.shipmentId,
        route: `${shipment.origin} → ${shipment.destination}`,
        status: shipment.status,
        priority: shipment.priority,
        vehicle: shipment.vehicle?.vehicleNumber ?? `TRK-${820 + index}`,
        gate: `Gate ${index + 1}`,
        departure: `${10 + index}:30 AM`,
        note: index % 2 === 0 ? "Dispatch ready" : "Loaded for departure",
      })),
    [outgoing]
  );
  const pickQueue = useMemo(
    () =>
      [...incoming].slice(0, 6).map((shipment, index) => ({
        id: `${shipment._id}-pick-${index}`,
        shipmentId: shipment.shipmentId,
        sku: shipment.title,
        location: shipment.origin,
        quantity: Math.max(1, 3 + index),
        priority: index === 0 ? "Critical" : index < 3 ? "High" : "Medium",
      })),
    [incoming]
  );
  const loadingTasks = useMemo(
    () =>
      incoming.slice(0, 5).map((shipment, index) => ({
        id: `${shipment._id}-load-${index}`,
        title: shipment.shipmentId,
        status: index === 0 ? "Loading now" : index < 3 ? "Queued" : "Awaiting dock",
        note: shipment.origin,
        dispatchFrom: shipment.origin,
        dispatchTo: shipment.destination,
        dock: activeDocks[index % Math.max(1, activeDocks.length)]?.dockNumber ?? index + 1,
        window: `${8 + index}:00 - ${9 + index}:00`,
      })),
    [incoming, activeDocks]
  );

  const pendingLoadingTasks = loadingTasks.filter((task) => !dispatchedTaskIds.includes(task.id));

  const handleDispatchTask = (taskId: string) => {
    setDispatchedTaskIds((current) => (current.includes(taskId) ? current : [taskId, ...current]));
  };

  const statusClass = (status: string) =>
    status === "Critical" || status === "Loading now"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
      : status === "High" || status === "Queued"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

  const detailTitle: Record<Exclude<DetailSection, null>, string> = {
    incoming: "Incoming Shipments",
    outgoing: "Outgoing Shipments",
    docks: "Dock Assignments",
    pickQueue: "Pick Priorities",
    loadingTasks: "Loading Tasks",
  };

  const openDetail = (section: Exclude<DetailSection, null>) => setActiveDetail(section);

  const renderDetailContent = () => {
    if (activeDetail === "incoming") {
      return incomingDisplay.map((s) => (
        <div key={s.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{s.shipmentId}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{s.route}</p>
            </div>
            <Badge className={statusClass(s.priority)}>{s.priority}</Badge>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{s.note} • Dock {s.dock} • Window {s.window}</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Status: {s.status}</p>
        </div>
      ));
    }

    if (activeDetail === "outgoing") {
      return outgoingDisplay.map((s) => (
        <div key={s.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{s.shipmentId}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{s.route}</p>
            </div>
            <Badge className={statusClass(s.status)}>{s.status}</Badge>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{s.note} • Vehicle {s.vehicle} • {s.gate}</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Priority: {s.priority} • Depart {s.departure}</p>
        </div>
      ));
    }

    if (activeDetail === "docks") {
      return activeDocks.map((dock) => (
        <div key={dock.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Dock {dock.dockNumber}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{dock.label}</p>
            </div>
            <Badge className={statusClass(dock.status)}>{dock.status}</Badge>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Shipment: {dock.shipmentId}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">ETA: {dock.eta ?? "--"}</p>
        </div>
      ));
    }

    if (activeDetail === "pickQueue") {
      return pickQueue.map((item) => (
        <div key={item.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{item.shipmentId}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{item.sku}</p>
            </div>
            <Badge className={statusClass(item.priority)}>{item.priority}</Badge>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Qty: {item.quantity} • Loc: {item.location}</p>
        </div>
      ));
    }

    if (activeDetail === "loadingTasks") {
      return pendingLoadingTasks.map((task) => (
        <div key={task.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{task.note}</p>
            </div>
            <Badge className={statusClass(task.status)}>{task.status}</Badge>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Dispatch: {task.dispatchFrom} → {task.dispatchTo}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Dock {task.dock} • Window {task.window}</p>
        </div>
      ));
    }

    return null;
  };

  return (
    <div className="space-y-6 text-foreground">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Incoming Shipments" value={incoming.length} hint="Awaiting receive" icon={Truck} />
        <StatCard title="Outgoing Shipments" value={outgoing.length} hint="Ready to dispatch" icon={Box} />
        <StatCard title="Pick & Pack Queue" value={pickQueue.length} hint="Items to pick" icon={ClipboardList} />
        <StatCard title="Inventory SKUs" value={inventory.length} hint="Total stocked items" icon={Package} />
        <StatCard title="Active Docks" value={activeDocks.filter((dock) => dock.status === "Active").length} hint="Loading bays" icon={Box} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 items-stretch">
        <Card className="h-full w-full max-w-full">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Incoming Shipments</CardTitle>
            <button type="button" className="rounded-full border border-slate-200 dark:border-white/10 bg-background/80 px-3 py-1 text-xs font-semibold text-primary" onClick={() => openDetail("incoming")}>See more</button>
          </CardHeader>
          <CardContent className="space-y-2">
            {incomingDisplay.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <div>
                  <p className="font-medium">{s.shipmentId}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{s.route}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{s.note} • Dock {s.dock} • Window {s.window}</p>
                </div>
                <div className="text-right">
                  <Badge className={statusClass(s.priority)}>{s.priority}</Badge>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{s.status}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full w-full max-w-full">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Outgoing Shipments</CardTitle>
            <button type="button" className="rounded-full border border-slate-200 dark:border-white/10 bg-background/80 px-3 py-1 text-xs font-semibold text-primary" onClick={() => openDetail("outgoing")}>See more</button>
          </CardHeader>
          <CardContent className="space-y-2">
            {outgoingDisplay.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <div>
                  <p className="font-medium">{s.shipmentId}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{s.route}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{s.note} • Vehicle {s.vehicle} • {s.gate}</p>
                </div>
                <div className="text-right">
                  <Badge className={statusClass(s.status)}>{s.status}</Badge>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{s.priority} • Depart {s.departure}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 items-stretch">
        <Card className="h-full w-full max-w-full">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Dock Assignments</CardTitle>
            <button type="button" className="rounded-full border border-slate-200 dark:border-white/10 bg-background/80 px-3 py-1 text-xs font-semibold text-primary" onClick={() => openDetail("docks")}>See more</button>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeDocks.slice(0, 3).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <div>
                  <p className="font-medium">Dock {d.dockNumber}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{d.label}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Shipment: {d.shipmentId}</p>
                </div>
                <div className="text-right">
                  <Badge className={statusClass(d.status)}>{d.status}</Badge>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">ETA: {d.eta ?? "--"}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="h-full w-full max-w-full">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Pick Priorities</CardTitle>
            <button type="button" className="rounded-full border border-slate-200 dark:border-white/10 bg-background/80 px-3 py-1 text-xs font-semibold text-primary" onClick={() => openDetail("pickQueue")}>See more</button>
          </CardHeader>
          <CardContent className="space-y-2">
            {pickQueue.slice(0, 3).map((i) => (
              <div key={i.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{i.shipmentId}</p>
                  <Badge className={statusClass(i.priority)}>{i.priority}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{i.sku}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Qty: {i.quantity} • Loc: {i.location}</p>
              </div>
            ))}
          </CardContent>
        </Card>

      </section>

      <section className="grid grid-cols-1 gap-4">
        <Card className="w-full max-w-full">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Loading Tasks</CardTitle>
            <button type="button" className="rounded-full border border-slate-200 dark:border-white/10 bg-background/80 px-3 py-1 text-xs font-semibold text-primary" onClick={() => openDetail("loadingTasks")}>See more</button>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingLoadingTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{task.note}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Dispatch: {task.dispatchFrom} → {task.dispatchTo}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Dock {task.dock} • Window {task.window}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={statusClass(task.status)}>{task.status}</Badge>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 dark:border-white/10 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/15"
                    onClick={() => handleDispatchTask(task.id)}
                  >
                    Dispatch
                  </button>
                </div>
              </div>
            ))}
            {!pendingLoadingTasks.length ? <p className="text-sm text-slate-600 dark:text-slate-400">All loading tasks have been dispatched.</p> : null}
          </CardContent>
        </Card>
      </section>

      <Modal open={Boolean(activeDetail)} title={activeDetail ? detailTitle[activeDetail] : "Details"} onClose={() => setActiveDetail(null)}>
        <div className="space-y-3">
          {renderDetailContent()}
        </div>
      </Modal>
    </div>
  );
};

export default WarehouseStaffDashboard;
