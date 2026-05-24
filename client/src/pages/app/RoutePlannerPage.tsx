import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";

export const RoutePlannerPage = () => {
  const { dashboard } = useSmartFleetSimulation();

  const efficiency = useMemo(() => dashboard.deliveriesTrend.map((d) => ({ month: d.month, value: Math.max(42, d.deliveries - 8) })), [dashboard]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Route Planner</h2>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Optimization Forecast</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficiency}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#06b6d4" fillOpacity={0.12} fill="#06b6d4" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Button>Run optimization</Button>
              <Button variant="secondary">Simulate reroute</Button>
              <Button variant="destructive">Clear suggested routes</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default RoutePlannerPage;
