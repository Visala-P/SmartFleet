import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";
import { useToast } from "@/hooks/useToast";
import type { Driver } from "@/types";

interface DriverForm {
  employeeId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  availabilityStatus: Driver["availabilityStatus"];
}

const statusColors: Record<Driver["availabilityStatus"], string> = {
  Available: "bg-emerald-500/15 text-emerald-300",
  "On Trip": "bg-cyan-500/15 text-cyan-300",
  "On Leave": "bg-slate-500/20 text-slate-300",
};

export const DriversPage = () => {
  const { drivers, createDriver, updateDriver, deleteDriver } = useSmartFleetSimulation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Driver["availabilityStatus"] | "">("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [open, setOpen] = useState(false);
  const { pushToast } = useToast();

  const { register, handleSubmit, reset } = useForm<DriverForm>({ defaultValues: { availabilityStatus: "Available" } });

  useEffect(() => {
    if (editing) {
      reset({
        employeeId: editing.employeeId,
        name: editing.name,
        phone: editing.phone,
        licenseNumber: editing.licenseNumber,
        availabilityStatus: editing.availabilityStatus,
      });
    } else {
      reset({ availabilityStatus: "Available" });
    }
  }, [editing, reset]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return drivers.filter((driver) => {
      const matchesQuery =
        !query ||
        driver.name.toLowerCase().includes(query) ||
        driver.employeeId.toLowerCase().includes(query) ||
        driver.licenseNumber.toLowerCase().includes(query);

      const matchesStatus = !statusFilter || driver.availabilityStatus === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [drivers, search, statusFilter]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const submit = async (values: DriverForm) => {
    if (editing) {
      updateDriver(editing._id, values);
      pushToast({ title: "Driver updated", description: `${values.name} profile saved.` });
    } else {
      createDriver({ ...values, rating: 4.6, completedTrips: 0, onTimeRate: 93, safetyScore: 95 });
      pushToast({ title: "Driver added", description: `${values.name} is now in the roster.` });
    }

    setOpen(false);
    setEditing(null);
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        title: "Driver",
        render: (item: Driver) => (
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-300">
              {item.name
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </div>
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{item.employeeId}</p>
            </div>
          </div>
        ),
      },
      { key: "phone", title: "Phone", render: (item: Driver) => item.phone },
      { key: "license", title: "License", render: (item: Driver) => item.licenseNumber },
      {
        key: "status",
        title: "Availability",
        render: (item: Driver) => <Badge className={statusColors[item.availabilityStatus]}>{item.availabilityStatus}</Badge>,
      },
      { key: "trips", title: "Trips", render: (item: Driver) => item.completedTrips.toLocaleString() },
      { key: "rating", title: "Rating", render: (item: Driver) => item.rating.toFixed(1) },
      {
        key: "actions",
        title: "Actions",
        render: (item: Driver) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(item);
                setOpen(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                deleteDriver(item._id);
                pushToast({ title: "Driver removed", variant: "warning" });
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteDriver, pushToast]
  );

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {drivers.slice(0, 4).map((driver) => (
          <Card key={driver._id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-300">
                  {driver.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{driver.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{driver.employeeId}</p>
                </div>
                <Badge className={statusColors[driver.availabilityStatus]}>{driver.availabilityStatus}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <p className="font-semibold text-foreground">{driver.completedTrips}</p>
                  Trips
                </div>
                <div>
                  <p className="font-semibold text-foreground">{driver.onTimeRate}%</p>
                  On-time
                </div>
                <div>
                  <p className="font-semibold text-foreground">{driver.safetyScore}%</p>
                  Safety
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <Input placeholder="Search by name, employee ID or license" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Driver["availabilityStatus"] | "")}
          >
            <option value="">All statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="On Leave">On Leave</option>
          </select>
          <Button className="md:ml-auto" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Driver
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <DataTable
            loading={false}
            data={rows}
            columns={columns}
            emptyTitle="No drivers available"
            emptyDescription="Add drivers to start assignment and tracking."
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit driver profile" : "Add driver profile"}>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
          <Input placeholder="Employee ID" {...register("employeeId", { required: true })} />
          <Input placeholder="Full name" {...register("name", { required: true })} />
          <Input placeholder="Phone" {...register("phone", { required: true })} />
          <Input placeholder="License number" {...register("licenseNumber", { required: true })} />
          <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" {...register("availabilityStatus")}>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="On Leave">On Leave</option>
          </select>
          <div className="md:col-span-2">
            <Button className="w-full">{editing ? "Save Driver" : "Create Driver"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
