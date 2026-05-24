import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { VehicleDrawer } from "@/components/dashboard/VehicleDrawer";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";
import { useToast } from "@/hooks/useToast";
import type { Vehicle } from "@/types";

interface VehicleFormValues {
  vehicleNumber: string;
  type: string;
  capacity: number;
  status: Vehicle["status"];
  insuranceExpiryDate: string;
  lastServiceDate: string;
  nextServiceDate: string;
}

export const FleetPage = () => {
  const { vehicles, createVehicle, updateVehicle, deleteVehicle } = useSmartFleetSimulation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const { pushToast } = useToast();

  const { register, handleSubmit, reset } = useForm<VehicleFormValues>({ defaultValues: { status: "Available" } });

  const filtered = useMemo(() => {
    const searchValue = search.toLowerCase();
    return vehicles.filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.vehicleNumber.toLowerCase().includes(searchValue) ||
        item.type.toLowerCase().includes(searchValue) ||
        item.driverAssigned?.name?.toLowerCase().includes(searchValue);

      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (!editing) {
      reset({ status: "Available" });
      return;
    }

    reset({
      vehicleNumber: editing.vehicleNumber,
      type: editing.type,
      capacity: editing.capacity,
      status: editing.status,
      insuranceExpiryDate: editing.insuranceExpiryDate.slice(0, 10),
      lastServiceDate: editing.lastServiceDate.slice(0, 10),
      nextServiceDate: editing.nextServiceDate.slice(0, 10),
    });
  }, [editing, reset]);

  const onCreate = async (values: VehicleFormValues) => {
    const payload = { ...values, fuelLevel: 100 } as Omit<Vehicle, "_id">;
    if (editing) {
      updateVehicle(editing._id, payload);
      pushToast({ title: "Vehicle updated", description: `${values.vehicleNumber} saved successfully.` });
    } else {
      createVehicle(payload);
      pushToast({ title: "Vehicle created", description: "Fleet record added successfully." });
    }

    setOpen(false);
    setEditing(null);
    reset({ status: "Available" });
  };

  const onDelete = async (id: string) => {
    deleteVehicle(id);
    pushToast({ title: "Vehicle removed", variant: "warning" });
  };

  const maintenanceAlerts = useMemo(
    () =>
      vehicles.filter((vehicle) => {
        const daysUntilService = Math.ceil((new Date(vehicle.nextServiceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilService <= 30;
      }),
    [vehicles]
  );

  const columns = useMemo(
    () => [
      { key: "number", title: "Vehicle ID", render: (item: Vehicle) => item.vehicleNumber },
      { key: "type", title: "Type", render: (item: Vehicle) => item.type },
      { key: "driver", title: "Driver Assigned", render: (item: Vehicle) => item.driverAssigned?.name || "Not assigned" },
      {
        key: "fuel",
        title: "Fuel Level",
        render: (item: Vehicle) => (
          <div className="w-36 space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-cyan-400" style={{ width: `${item.fuelLevel ?? 65}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{item.fuelLevel ?? 65}%</p>
          </div>
        ),
      },
      { key: "status", title: "Status", render: (item: Vehicle) => <Badge>{item.status}</Badge> },
      {
        key: "lastService",
        title: "Last Service",
        render: (item: Vehicle) => new Date(item.lastServiceDate).toLocaleDateString(),
      },
      {
        key: "actions",
        title: "Actions",
        render: (item: Vehicle) => (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setSelectedVehicle(item)}>
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(item);
                setOpen(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(item._id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [onDelete]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <Input placeholder="Search by vehicle number/type" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="Available">Available</option>
            <option value="In Transit">In Transit</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Inactive">Inactive</option>
          </select>
          <Button
            className="md:ml-auto"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        {maintenanceAlerts.slice(0, 3).map((vehicle) => (
          <Card key={vehicle._id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{vehicle.vehicleNumber}</p>
                  <p className="text-xs text-muted-foreground">{vehicle.type}</p>
                </div>
                <Badge>Maintenance</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Service due on {new Date(vehicle.nextServiceDate).toLocaleDateString()}.
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardContent className="p-4">
          <DataTable
            data={rows}
            columns={columns}
            emptyTitle="No fleet records"
            emptyDescription="Add your first vehicle to start transport allocation."
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            loading={false}
          />
        </CardContent>
      </Card>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit vehicle" : "Add vehicle"}
      >
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(onCreate)}>
          <Input placeholder="Vehicle Number" {...register("vehicleNumber", { required: true })} />
          <Input placeholder="Type" {...register("type", { required: true })} />
          <Input type="number" placeholder="Capacity" {...register("capacity", { valueAsNumber: true, required: true })} />
          <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" {...register("status")}>
            <option value="Available">Available</option>
            <option value="In Transit">In Transit</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Inactive">Inactive</option>
          </select>
          <Input type="date" {...register("insuranceExpiryDate", { required: true })} />
          <Input type="date" {...register("lastServiceDate", { required: true })} />
          <Input type="date" {...register("nextServiceDate", { required: true })} />

          <div className="md:col-span-2">
            <Button className="w-full">{editing ? "Save Vehicle" : "Create Vehicle"}</Button>
          </div>
        </form>
      </Modal>

      <VehicleDrawer open={!!selectedVehicle} vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
    </div>
  );
};
