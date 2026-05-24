import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useSmartFleetSimulation } from "@/context/SmartFleetSimulationContext";
import type { NotificationItem } from "@/types";

const types = ["All", "Shipment Delay", "Maintenance", "Task", "Info"] as const;

export const NotificationsPage = () => {
  const { notifications, markNotificationRead } = useSmartFleetSimulation();
  const [typeFilter, setTypeFilter] = useState<(typeof types)[number]>("All");

  const items = useMemo(() => {
    if (typeFilter === "All") return notifications;
    return notifications.filter((item) => item.type === typeFilter);
  }, [notifications, typeFilter]);

  const unreadCount = useMemo(() => notifications.filter((item) => item.isReadBy.length === 0).length, [notifications]);

  if (!notifications.length) {
    return <EmptyState title="No notifications" description="You are all caught up." />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold">Notification Center</p>
            <p className="text-xs text-muted-foreground">Unread alerts refresh automatically from operations.</p>
          </div>
          <div className="md:ml-auto flex items-center gap-2">
            <Badge>{unreadCount} unread</Badge>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {items.map((item: NotificationItem) => (
          <Card key={item._id} className={item.isReadBy.length ? "opacity-75" : "border-cyan-400/30"}>
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{item.title}</p>
                  <Badge>{item.type}</Badge>
                  {!item.isReadBy.length ? <Badge className="bg-cyan-500/15 text-cyan-300">Unread</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <Button variant="secondary" onClick={() => markNotificationRead(item._id)}>
                {item.isReadBy.length ? "Marked" : "Mark as read"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
