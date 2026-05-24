import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";

export const DispatchPage = () => {
  const { shipments, vehicles, drivers, updateShipment, updateVehicle } = useSmartFleetSimulation();
  const pending = useMemo(() => shipments.filter((s) => s.status === "Pending"), [shipments]);
  const [assigning, setAssigning] = useState<string | null>(null);
const handleAssign = (
  shipmentId: string,
  vehicleId: string,
  driverId?: string
) => {
  setAssigning(shipmentId);

  const selectedVehicle = vehicles.find((v) => v._id === vehicleId);

  const selectedDriver = driverId
    ? drivers.find((d) => d._id === driverId)
    : undefined;

  updateShipment(shipmentId, {
    vehicle: selectedVehicle
      ? {
          _id: selectedVehicle._id,
          vehicleNumber: selectedVehicle.vehicleNumber,
        }
      : undefined,

    driver: selectedDriver
      ? {
          _id: selectedDriver._id,
          name: selectedDriver.name,
        }
      : undefined,

    status: "In Transit",
  });

  updateVehicle(vehicleId, {
    status: "In Transit",

    driverAssigned: selectedDriver
      ? {
          _id: selectedDriver._id,
          name: selectedDriver.name,
          employeeId: selectedDriver.employeeId,
        }
      : undefined,
  });

  setTimeout(() => setAssigning(null), 600);
};

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Dispatch</h2>
      <section className="grid gap-4 md:grid-cols-2">
        {pending.map((s) => (
          <Card key={s._id}>
            <CardHeader>
              <CardTitle>{s.shipmentId} — {s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">{s.origin} → {s.destination}</p>
              <div className="relative z-10 mt-3 flex flex-wrap items-center gap-3 overflow-visible">
                <select className="rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-sm" defaultValue={vehicles.find((v) => v.status === "Available")?._id || ""}>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>{v.vehicleNumber} — {v.type} ({v.status})</option>
                  ))}
                </select>
                <select className="rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-sm" defaultValue={drivers.find((d) => d.availabilityStatus === "Available")?._id || ""}>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>{d.name} ({d.availabilityStatus})</option>
                  ))}
                </select>
                <Button onClick={() => handleAssign(s._id, vehicles.find((v) => v.status === "Available")?._id || vehicles[0]._id, drivers.find((d) => d.availabilityStatus === "Available")?._id)} disabled={assigning === s._id}>{assigning === s._id ? "Assigning..." : "Assign & Dispatch"}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
};

export default DispatchPage;
