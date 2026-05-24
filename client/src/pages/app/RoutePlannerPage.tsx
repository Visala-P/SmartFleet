import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";

type SuggestedRoute = {
  id: string;
  month: string;
  value: number;
  status: "Optimized" | "Rerouted" | "Cleared";
};

const fallbackRoutePoints = [
  { label: "Hub A", lat: 17.385, lng: 78.4867 },
  { label: "Hub B", lat: 17.442, lng: 78.499 },
  { label: "Hub C", lat: 17.512, lng: 78.45 },
];

export const RoutePlannerPage = () => {
  const { dashboard } = useSmartFleetSimulation();
  const [suggestions, setSuggestions] = useState<SuggestedRoute[]>([]);
  const [statusMessage, setStatusMessage] = useState("Ready to optimize routes.");

  const efficiency = useMemo(() => dashboard.deliveriesTrend.map((d) => ({ month: d.month, value: Math.max(42, d.deliveries - 8) })), [dashboard]);

  const runOptimization = () => {
    const next = efficiency.slice(0, 4).map((item, index) => ({
      id: `${item.month}-${index}`,
      month: item.month,
      value: item.value + (index % 2 === 0 ? 4 : 2),
      status: "Optimized" as const,
    }));
    setSuggestions(next);
    setStatusMessage("Optimization generated for current route window.");
  };

  const simulateReroute = () => {
    setSuggestions((current) =>
      current.length
        ? current.map((item, index) => ({ ...item, value: item.value + 6 + index, status: "Rerouted" as const }))
        : efficiency.slice(0, 4).map((item, index) => ({ id: `${item.month}-${index}`, month: item.month, value: item.value + 6, status: "Rerouted" as const }))
    );
    setStatusMessage("Reroute simulation applied to the selected lanes.");
  };

  const clearSuggestedRoutes = () => {
    setSuggestions([]);
    setStatusMessage("Suggested routes cleared.");
  };

  const openGoogleMaps = `https://www.google.com/maps/dir/${fallbackRoutePoints.map((point) => `${point.lat},${point.lng}`).join("/")}`;

  return (
    <div className="space-y-6 text-foreground">
      <h2 className="text-2xl font-semibold">Route Planner</h2>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="w-full max-w-full">
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

        <Card className="w-full max-w-full">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3">
              <Button type="button" onClick={runOptimization}>Run Optimization</Button>
              <Button type="button" variant="secondary" onClick={simulateReroute}>
                Simulate Reroute
              </Button>
              <Button type="button" variant="outline" onClick={clearSuggestedRoutes}>
                Clear Suggested Routes
              </Button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{statusMessage}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="w-full max-w-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Suggested Routes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(suggestions.length ? suggestions : efficiency.slice(0, 4).map((item, index) => ({ id: `${item.month}-${index}`, month: item.month, value: item.value, status: "Cleared" as const }))).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3">
                <div>
                  <p className="font-medium">{item.month}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Projected efficiency: {item.value}%</p>
                </div>
                <Badge className="border-slate-200 dark:border-white/10 bg-background/80 text-foreground">{item.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="w-full max-w-full">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Route Tracking</CardTitle>
            <a
              className="inline-flex shrink-0 rounded-full border border-slate-200 dark:border-white/10 bg-background/80 px-3 py-2 text-xs font-semibold text-primary"
              href={openGoogleMaps}
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps
            </a>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="min-h-56 rounded-2xl border border-slate-200 dark:border-white/10 bg-[linear-gradient(135deg,rgba(8,145,178,0.12),rgba(15,23,42,0.04))] p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">Fallback coordinates</p>
              <div className="mt-4 grid gap-2 text-xs">
                {fallbackRoutePoints.map((point) => (
                  <div key={point.label} className="rounded-xl border border-slate-200 dark:border-white/10 bg-background/70 p-3">
                    <p className="font-semibold text-foreground">{point.label}</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {point.lat.toFixed(3)}, {point.lng.toFixed(3)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default RoutePlannerPage;
