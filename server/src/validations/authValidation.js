const { z } = require("zod");

const signupSchema = z
  .object({
    body: z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Enter a valid email address"),
      password: z.string().min(5, "Password must be at least 5 characters"),
      confirmPassword: z.string().min(5, "Confirm your password"),
      role: z.enum(["driver", "warehouse_staff"]),
    }),
    params: z.object({}).optional(),
    query: z.object({}).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.body.password !== value.body.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body", "confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(5, "Password must be at least 5 characters"),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = { signupSchema, loginSchema };
