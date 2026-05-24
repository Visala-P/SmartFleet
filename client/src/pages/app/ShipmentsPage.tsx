import { Eye, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";
import { useToast } from "@/hooks/useToast";
import type { Shipment } from "@/types";

interface ShipmentForm {
  shipmentId: string;
  title: string;
  origin: string;
  destination: string;
  priority: Shipment["priority"];
  scheduledPickup: string;
  estimatedDelivery: string;
}

const statuses: Shipment["status"][] = ["Pending", "In Transit", "Delivered", "Delayed"];
const priorityOrder: Shipment["priority"][] = ["Critical", "High", "Medium", "Low"];

const statusProgress: Record<Shipment["status"], number> = {
  Pending: 14,
  "In Transit": 65,
  Delivered: 100,
  Delayed: 42,
};

export const ShipmentsPage = () => {
  const { shipments, vehicles, drivers, createShipment, updateShipment, deleteShipment } = useSmartFleetSimulation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Shipment["status"] | "">("");
  const [priorityFilter, setPriorityFilter] = useState<Shipment["priority"] | "">("");
  const [selected, setSelected] = useState<Shipment | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shipment | null>(null);
  const { pushToast } = useToast();

  const { register, handleSubmit, reset } = useForm<ShipmentForm>({ defaultValues: { priority: "Medium" } });

  useEffect(() => {
    if (!editing) return;
    reset({
      shipmentId: editing.shipmentId,
      title: editing.title,
      origin: editing.origin,
      destination: editing.destination,
      priority: editing.priority,
      scheduledPickup: editing.scheduledPickup.slice(0, 16),
      estimatedDelivery: editing.estimatedDelivery.slice(0, 16),
    });
  }, [editing, reset]);

  useEffect(() => {
    if (selected) {
      const refreshed = shipments.find((item) => item._id === selected._id);
      if (refreshed) setSelected(refreshed);
    }
  }, [shipments, selected]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return shipments
      .filter((item) => {
        const matchesQuery =
          !query ||
          item.shipmentId.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query) ||
          item.origin.toLowerCase().includes(query) ||
          item.destination.toLowerCase().includes(query);

        const matchesStatus = !statusFilter || item.status === statusFilter;
        const matchesPriority = !priorityFilter || item.priority === priorityFilter;
        return matchesQuery && matchesStatus && matchesPriority;
      })
      .sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));
  }, [shipments, search, statusFilter, priorityFilter]);

  const create = async (values: ShipmentForm) => {
    if (editing) {
      updateShipment(editing._id, values);
      pushToast({ title: "Shipment updated", description: `${values.shipmentId} saved successfully.` });
    } else {
      createShipment({ ...values, status: "Pending", weight: 1200 });
      pushToast({ title: "Shipment created", description: `${values.shipmentId} added to the queue.` });
    }
    setOpen(false);
    setEditing(null);
    reset({ priority: "Medium" });
  };

  const columns = useMemo(
    () => [
      { key: "shipmentId", title: "Shipment ID", render: (item: Shipment) => item.shipmentId },
      { key: "source", title: "Source", render: (item: Shipment) => item.origin },
      { key: "destination", title: "Destination", render: (item: Shipment) => item.destination },
      { key: "vehicle", title: "Vehicle", render: (item: Shipment) => item.vehicle?.vehicleNumber || "Unassigned" },
      { key: "driver", title: "Driver", render: (item: Shipment) => item.driver?.name || "Unassigned" },
      {
        key: "eta",
        title: "ETA",
        render: (item: Shipment) => new Date(item.estimatedDelivery).toLocaleString(),
      },
      { key: "status", title: "Status", render: (item: Shipment) => <Badge>{item.status}</Badge> },
      {
        key: "progress",
        title: "Progress",
        render: (item: Shipment) => (
          <div className="w-40 space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${statusProgress[item.status]}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{statusProgress[item.status]}%</p>
          </div>
        ),
      },
      {
        key: "actions",
        title: "Actions",
        render: (item: Shipment) => (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(item)}>
              <Eye className="mr-2 h-4 w-4" />
              Details
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {
              setEditing(item);
              setOpen(true);
            }}>
              Edit
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-4">
          <Input placeholder="Search shipment, source or destination" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Shipment["status"] | "") }>
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as Shipment["priority"] | "") }>
            <option value="">All priorities</option>
            {priorityOrder.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
          <Button className="lg:ml-auto" onClick={() => {
            setEditing(null);
            setOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Create Shipment
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statuses.map((status) => (
          <Card key={status}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{status}</p>
              <p className="mt-2 text-3xl font-semibold">{shipments.filter((item) => item.status === status).length}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardContent className="p-4">
          <DataTable
            loading={false}
            data={filtered}
            columns={columns}
            emptyTitle="No shipments found"
            emptyDescription="Create a shipment to start tracking movement through the control tower."
            page={1}
            totalPages={1}
            onPageChange={() => undefined}
          />
        </CardContent>
      </Card>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit shipment" : "Create shipment"}
      >
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(create)}>
          <Input placeholder="Shipment ID" {...register("shipmentId", { required: true })} />
          <Input placeholder="Title" {...register("title", { required: true })} />
          <Input placeholder="Origin" {...register("origin", { required: true })} />
          <Input placeholder="Destination" {...register("destination", { required: true })} />
          <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" {...register("priority")}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          <Input type="datetime-local" {...register("scheduledPickup", { required: true })} />
          <Input type="datetime-local" {...register("estimatedDelivery", { required: true })} />
          <div className="md:col-span-2">
            <Button className="w-full">{editing ? "Save Shipment" : "Create Shipment"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.shipmentId || "Shipment details"}>
        {selected ? (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Route</p>
                  <p className="mt-2 font-semibold">{selected.origin}</p>
                  <p className="mt-1 text-sm text-muted-foreground">to {selected.destination}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Assigned Resources</p>
                  <p className="mt-2 font-semibold">{selected.vehicle?.vehicleNumber || "No vehicle assigned"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.driver?.name || "No driver assigned"}</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">Delivery progress</p>
                <Badge>{selected.status}</Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${statusProgress[selected.status]}%` }} />
              </div>
            </div>

            <div className="space-y-3 border-l border-border pl-4">
              {selected.timeline.map((event, index) => (
                <div key={index} className="relative">
                  <span className="absolute -left-[22px] mt-1 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{event.label}</p>
                  <p className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{event.note}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                value={selected.status}
                onChange={(e) => {
                  updateShipment(selected._id, { status: e.target.value as Shipment["status"] });
                  setSelected({ ...selected, status: e.target.value as Shipment["status"] });
                }}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                onClick={() => {
                  deleteShipment(selected._id);
                  setSelected(null);
                }}
              >
                Delete Shipment
              </Button>
              <Button
                onClick={() => {
                  setEditing(selected);
                  setOpen(true);
                }}
              >
                Edit Shipment
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
