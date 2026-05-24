import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, SunMedium } from "lucide-react";

import { useTheme } from "@/context/ThemeContext";

interface NavbarProps {
  title: string;
  userName: string;
  role: string;
  onOpenSidebar: () => void;
}

export const Navbar = ({ title, userName, role, onOpenSidebar }: NavbarProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="glass sticky top-0 z-20 mb-6 flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-lg p-2 transition hover:bg-secondary lg:hidden" onClick={onOpenSidebar}>
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground shadow-sm backdrop-blur-md transition hover:border-border hover:bg-secondary/70"
          onClick={toggleTheme}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.98 }}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ opacity: 0, scale: 0.7, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 45 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.span>
          </AnimatePresence>
          <span className="pointer-events-none absolute -bottom-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-border/70 bg-background px-2.5 py-1 text-[10px] font-medium tracking-[0.14em] shadow-lg group-hover:block">
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </span>
        </motion.button>
        <div className="hidden rounded-lg border border-border px-3 py-2 text-right sm:block">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </header>
  );
};
