import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const StatCard = ({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  hint: string;
  icon: LucideIcon;
}) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="rounded-lg bg-primary/15 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{hint}</p>
      </CardContent>
    </Card>
  </motion.div>
);
