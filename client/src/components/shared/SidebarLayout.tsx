import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, SunMedium } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import smartFleetLogo from "@/assets/logo.png";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
}

interface SidebarLayoutProps {
  title: string;
  subtitle?: string;
  brandName?: string;
  userName: string;
  role: string;
  navigation: SidebarNavItem[];
  children: React.ReactNode;
  onLogout: () => void;
}

const ThemeToggle = ({ theme, toggleTheme }: { theme: "light" | "dark"; toggleTheme: () => void }) => (
  <motion.button
    type="button"
    className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_0_24px_rgba(15,23,42,0.08)] backdrop-blur-md transition hover:border-border/80 hover:bg-muted"
    onClick={toggleTheme}
    whileHover={{ scale: 1.03, y: -1 }}
    whileTap={{ scale: 0.98 }}
    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
  >
    <span className="sr-only">Theme toggle</span>
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
    <span className="pointer-events-none absolute -bottom-10 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-medium tracking-[0.18em] text-foreground shadow-lg group-hover:block">
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </span>
  </motion.button>
);

export const SidebarLayout = ({
  title,
  subtitle = "",
  brandName = "SmartFleet",
  userName,
  role,
  navigation,
  children,
  onLogout,
}: SidebarLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarWidthClass = collapsed ? "md:w-20 lg:w-20" : "md:w-72 lg:w-72";
  const contentOffsetClass = collapsed ? "md:pl-20 lg:pl-20" : "md:pl-72 lg:pl-72";

  const navigationItems = useMemo(
    () =>
      navigation.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact ?? item.to === "/app"}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
                "group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-semibold transition-all duration-200",
              isActive
                ? "border-cyan-300 bg-cyan-100 text-cyan-900 shadow-[0_0_18px_rgba(14,116,144,0.14)]"
                : "text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className={cn("flex-1 truncate transition-opacity", collapsed ? "md:hidden lg:hidden" : "")}>{item.label}</span>
          {item.badge ? (
            <span className={cn("rounded-full bg-slate-200 px-2 py-0.5 text-[10px] uppercase tracking-[0.24em] text-slate-700", collapsed ? "md:hidden lg:hidden" : "")}>{item.badge}</span>
          ) : null}
        </NavLink>
      )),
    [collapsed, navigation]
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.1),transparent_45%)]" />

      <AnimatePresence>
        {mobileOpen ? (
          <motion.button
            key="overlay"
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-border bg-card/95 px-4 py-5 backdrop-blur-xl transition-all duration-300 md:flex",
          sidebarWidthClass
        )}
      >
        <div className="flex items-center gap-3 px-1">
          <img src={smartFleetLogo} alt="SmartFleet" className="h-10 w-10 shrink-0 rounded-2xl object-contain shadow-[0_0_24px_rgba(34,211,238,0.12)]" />
          <div className={cn("min-w-0 transition-opacity", collapsed ? "md:hidden lg:hidden" : "")}>
            <p className="truncate text-sm font-semibold tracking-[0.14em] text-foreground">{brandName}</p>
          </div>
        </div>

        <div className={cn("mt-5 flex items-center justify-between rounded-2xl border border-border bg-muted/60 px-3 py-3", collapsed ? "md:hidden lg:hidden" : "")}> 
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
            {userName !== role ? <p className="truncate text-xs font-semibold text-muted-foreground">{role}</p> : null}
          </div>
          <LiveIndicator compact tone="cyan" className="border-cyan-300 bg-cyan-100 text-cyan-900" />
        </div>

        <nav className="mt-6 space-y-2 overflow-y-auto pr-1">{navigationItems}</nav>

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            className={cn("w-full justify-start gap-3 rounded-2xl border border-border px-3 py-3 text-foreground hover:bg-muted", collapsed ? "md:justify-center lg:justify-center" : "")}
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn("transition-opacity", collapsed ? "md:hidden lg:hidden" : "")}>Logout</span>
          </Button>
        </div>

      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.aside
            key="mobile-drawer"
            className="fixed inset-y-0 left-0 z-50 w-[86vw] max-w-sm border-r border-border bg-card/98 px-4 py-5 shadow-2xl shadow-black/20 md:hidden"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={smartFleetLogo} alt="SmartFleet" className="h-9 w-9 rounded-2xl object-contain" />
                <p className="text-sm font-semibold tracking-[0.14em] text-foreground">{brandName}</p>
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-full border border-border p-2 text-foreground">
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-muted/60 p-3">
              <p className="text-sm font-semibold text-foreground">{userName}</p>
              {userName !== role ? <p className="text-xs font-semibold text-muted-foreground">{role}</p> : null}
            </div>

            <nav className="mt-6 space-y-2">{navigationItems}</nav>

            <div className="mt-6 rounded-2xl border border-border bg-card p-4">
              <LiveIndicator tone="cyan" className="border-cyan-300 bg-cyan-100 text-cyan-900" />
              <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
              <button
                type="button"
                onClick={onLogout}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <main className={cn("dashboard-contrast relative min-h-screen transition-[padding] duration-300", contentOffsetClass)}>
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-4 backdrop-blur-xl lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card p-2 text-foreground md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="hidden items-center justify-center rounded-xl border border-border bg-card p-2 text-foreground md:inline-flex"
                onClick={() => setCollapsed((current) => !current)}
                aria-label="Toggle sidebar width"
              >
                {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </button>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-foreground">{title}</p>
                {subtitle ? <p className="truncate text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">{subtitle}</p> : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                Connected
              </div>
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              <div className="hidden rounded-xl border border-border bg-card px-3 py-2 text-right sm:block">
                <p className="text-sm font-semibold text-foreground">{userName}</p>
                {userName !== role ? <p className="text-xs font-medium text-muted-foreground">{role}</p> : null}
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-4 lg:px-6 lg:py-6">{children}</div>
      </main>
    </div>
  );
};