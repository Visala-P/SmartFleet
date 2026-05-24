import { AnimatePresence, motion } from "framer-motion";

import { useToast } from "@/hooks/useToast";

const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
};

export const ToastRegion = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(380px,92vw)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            type="button"
            className={`glass pointer-events-auto rounded-2xl border p-3 text-left shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${styles[toast.variant || "success"]}`}
            onClick={() => removeToast(toast.id)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <p className="text-sm font-semibold text-foreground">{toast.title}</p>
            {toast.description ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{toast.description}</p> : null}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};
