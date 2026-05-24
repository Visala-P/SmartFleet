import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Fuel, Wrench, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Vehicle } from "@/types";

interface VehicleDrawerProps {
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
}

const getRisk = (vehicle: Vehicle) => {
  const fuel = vehicle.fuelLevel ?? 65;
  const daysUntilService = Math.ceil((new Date(vehicle.nextServiceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (vehicle.status === "Maintenance" || fuel < 20 || daysUntilService <= 3) return "High";
  if (fuel < 35 || daysUntilService <= 10) return "Medium";
  return "Low";
};

export const VehicleDrawer = ({ open, vehicle, onClose }: VehicleDrawerProps) => {
  return (
    <AnimatePresence>
      {open && vehicle ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 h-full w-full max-w-xl border-l border-border/70 bg-background shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Vehicle details</p>
                <h3 className="text-lg font-semibold">{vehicle.vehicleNumber}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 p-5">
              <Card>
                <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Type</p>
                    <p className="mt-1 font-semibold">{vehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Status</p>
                    <Badge className="mt-1">{vehicle.status}</Badge>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Driver</p>
                    <p className="mt-1 font-semibold">{vehicle.driverAssigned?.name || "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Capacity</p>
                    <p className="mt-1 font-semibold">{vehicle.capacity.toLocaleString()} kg</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Fuel className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.22em]">Fuel</span>
                    </div>
                    <p className="mt-3 text-3xl font-semibold">{vehicle.fuelLevel ?? 65}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wrench className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.22em]">Risk</span>
                    </div>
                    <p className="mt-3 text-3xl font-semibold">{getRisk(vehicle)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.22em]">Next service</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold">{new Date(vehicle.nextServiceDate).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Smart insight</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {vehicle.fuelLevel && vehicle.fuelLevel < 20
                      ? `${vehicle.vehicleNumber} has critically low fuel for the next route.`
                      : vehicle.status === "Maintenance"
                        ? `${vehicle.vehicleNumber} is under maintenance review.`
                        : `${vehicle.vehicleNumber} is healthy for active dispatch.`}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
};
