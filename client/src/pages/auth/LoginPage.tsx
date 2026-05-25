import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import logoSrc from "@/assets/logo.png";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(5),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (isAuthenticated) return <Navigate to="/app" replace />;

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await login(values.email, values.password);
      navigate("/app");
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Invalid credentials");
        return;
      }

      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-foreground">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img src={logoSrc} alt="SmartFleet" className="h-14 w-auto object-contain" />
          <p className="text-base font-semibold uppercase tracking-[0.36em] text-cyan-700 dark:text-cyan-100/75">SMART FLEET</p>
        </div>
        <Card className="border-border/70 bg-card/95 text-foreground shadow-2xl">
          <CardContent className="space-y-4 p-7">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Welcome to SmartFleet</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Sign in to your transport control tower.</p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Input placeholder="Email" {...register("email")} />
                {errors.email ? <p className="mt-1 text-xs text-red-500">{errors.email.message}</p> : null}
              </div>
              <div>
                <Input type="password" placeholder="Password" {...register("password")} />
                {errors.password ? <p className="mt-1 text-xs text-red-500">{errors.password.message}</p> : null}
              </div>

              {error ? <p className="text-xs text-red-500">{error}</p> : null}

              <Button className="w-full" disabled={isSubmitting}>
                <LogIn className="mr-2 h-4 w-4" />
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Need an account? <Link to="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">Sign up</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
