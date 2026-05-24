import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import logoSrc from "@/assets/logo.png";
import type { AuthUser } from "@/types";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
    role: z.enum(["Admin", "Transport Manager", "Driver", "Warehouse Staff"]),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

const roleOptions: AuthUser["role"][] = ["Admin", "Transport Manager", "Driver", "Warehouse Staff"];

export const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();
  const { pushToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "Warehouse Staff" },
  });

  if (isAuthenticated) return <Navigate to="/app" replace />;

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await signup(values);
      pushToast({
        title: "Account created",
        description: "Your account is ready. Please sign in to continue.",
        variant: "success",
      });
      navigate("/login", { replace: true });
    } catch {
      setError("Unable to register. Email may already be in use.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img src={logoSrc} alt="SmartFleet" className="h-14 w-auto object-contain" />
          <p className="text-base font-semibold uppercase tracking-[0.36em] text-cyan-100/75">SMART FLEET</p>
        </div>
        <Card>
          <CardContent className="space-y-4 p-7">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Create SmartFleet Account</h1>
              <p className="mt-1 text-sm text-muted-foreground">Sign up with your company email to continue.</p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Input placeholder="Full name" {...register("name")} />
                {errors.name ? <p className="mt-1 text-xs text-red-500">{errors.name.message}</p> : null}
              </div>
              <div>
                <Input placeholder="Email" {...register("email")} />
                {errors.email ? <p className="mt-1 text-xs text-red-500">{errors.email.message}</p> : null}
              </div>
              <div>
                <Input type="password" placeholder="Password" {...register("password")} />
                {errors.password ? <p className="mt-1 text-xs text-red-500">{errors.password.message}</p> : null}
              </div>
              <div>
                <Input type="password" placeholder="Confirm password" {...register("confirmPassword")} />
                {errors.confirmPassword ? <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p> : null}
              </div>

              <div>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  {...register("role")}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {errors.role ? <p className="mt-1 text-xs text-red-500">{errors.role.message}</p> : null}
              </div>

              {error ? <p className="text-xs text-red-500">{error}</p> : null}

              <Button className="w-full" disabled={isSubmitting}>
                <UserPlus className="mr-2 h-4 w-4" />
                {isSubmitting ? "Creating..." : "Create account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
