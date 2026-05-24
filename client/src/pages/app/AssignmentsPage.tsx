import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";

export const AssignmentsPage = () => {
  const { shipments, updateShipment } = useSmartFleetSimulation();
  const assigned = useMemo(() => shipments.filter((s) => s.driver || s.vehicle), [shipments]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Assignments</h2>
      <section className="grid gap-4 md:grid-cols-2">
        {assigned.map((s) => (
          <Card key={s._id}>
            <CardHeader>
              <CardTitle>{s.shipmentId}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">{s.origin} → {s.destination}</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm">Vehicle: {s.vehicle?.vehicleNumber || "—"}</p>
                  <p className="text-sm">Driver: {s.driver?.name || "—"}</p>
                </div>
                <Button variant="ghost" onClick={() => updateShipment(s._id, { driver: undefined, vehicle: undefined })}>Unassign</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
};

export default AssignmentsPage;
