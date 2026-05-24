import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

import logoSrc from "@/assets/logo.png";
import { useAuth } from "@/context/AuthContext";

export const LandingPage = () => {
  const reduceMotion = useReducedMotion();
  const { isAuthenticated, logout } = useAuth();

  const featureItems = [
    {
      title: "Live route visibility",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-cyan-200">
          <path
            d="M12 21s6-4.35 6-10a6 6 0 10-12 0c0 5.65 6 10 6 10z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="11" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      title: "Fleet analytics in real time",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-cyan-200">
          <path d="M5 19V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M11 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17 19V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Manufacturing logistics control",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-cyan-200">
          <path
            d="M3 10h11v8H3zM14 13h4l3 3v2h-7z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="19" r="1.5" fill="currentColor" />
          <circle cx="18" cy="19" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-14%] top-[-18%] h-[34rem] w-[34rem] rounded-full bg-cyan-500/14 blur-3xl" />
        <div className="absolute right-[-12%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[10%] h-[22rem] w-[22rem] rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <img src={logoSrc} alt="SmartFleet" className="h-12 w-auto object-contain" />
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/signup"
                className="rounded-full border border-border bg-muted/60 px-4 py-2 text-sm font-medium text-foreground transition hover:border-cyan-300/40 hover:bg-muted"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="flex w-full items-center">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid w-full items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.12)]" />
                System status: operational
              </div>

              <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                <span className="block">SmartFleet Transport</span>
                <span className="block">Management</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base lg:text-lg">
                Internal operations portal for manufacturing and logistics teams. Authenticate to track vehicles, schedule deliveries, monitor fuel usage, and manage fleet dispatches.
              </p>

              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-cyan-400 px-6 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Launch Dashboard
                </Link>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md rounded-[28px] border border-border bg-card/80 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-4 lg:mt-10">
                <div className="grid gap-3">
                  {featureItems.map((item) => (
                    <div
                      key={item.title}
                      className="flex flex-row items-center justify-start gap-4 rounded-[20px] border border-border bg-muted/60 px-4 py-4 text-left shadow-none"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-600">
                        {item.icon}
                      </div>
                      <p className="min-w-0 text-[15px] font-semibold leading-snug text-foreground sm:text-base">
                        {item.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
