import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const toneClass: Record<string, string> = {
  Pending: "bg-slate-600 text-white border-slate-600",
  "In Transit": "bg-indigo-600 text-white border-indigo-700",
  Delivered: "bg-emerald-600 text-white border-emerald-700",
  Delayed: "bg-rose-600 text-white border-rose-700",
  High: "bg-amber-600 text-white border-amber-700",
  Critical: "bg-rose-600 text-white border-rose-700",
};

export const Badge = ({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
      toneClass[String(children)] || "border-border bg-secondary text-secondary-foreground",
      className
    )}
    {...props}
  >
    {children}
  </span>
);
