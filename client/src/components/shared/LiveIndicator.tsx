import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type LiveIndicatorTone = "emerald" | "cyan" | "amber" | "rose";

const toneClasses: Record<LiveIndicatorTone, string> = {
  emerald: "border-emerald-300 bg-emerald-100 text-emerald-800",
  cyan: "border-cyan-300 bg-cyan-100 text-cyan-900",
  amber: "border-amber-300 bg-amber-100 text-amber-800",
  rose: "border-rose-300 bg-rose-100 text-rose-800",
};

interface LiveIndicatorProps {
  label?: string;
  tone?: LiveIndicatorTone;
  compact?: boolean;
  className?: string;
}

export const LiveIndicator = ({ label = "LIVE", tone = "emerald", compact = false, className }: LiveIndicatorProps) => (
  <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em]", toneClasses[tone], className)}>
    <span className="relative flex h-2.5 w-2.5 items-center justify-center">
      <motion.span
        className="absolute h-full w-full rounded-full bg-current opacity-35"
        animate={{ scale: [1, 1.9, 1], opacity: [0.45, 0, 0.45] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative h-2 w-2 rounded-full bg-current" />
    </span>
    <span>{compact ? "Live" : label}</span>
  </div>
);