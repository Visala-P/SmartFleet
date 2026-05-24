import { Box } from "lucide-react";

export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="glass flex flex-col items-center justify-center rounded-xl p-10 text-center">
    <Box className="mb-3 h-8 w-8 text-slate-600 dark:text-slate-400" />
    <p className="font-semibold text-foreground">{title}</p>
    <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">{description}</p>
  </div>
);
