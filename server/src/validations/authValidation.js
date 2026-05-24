const { z } = require("zod");

const signupSchema = z
  .object({
    body: z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Enter a valid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string().min(6, "Confirm your password"),
      role: z.enum(["Admin", "Transport Manager", "Driver", "Warehouse Staff"]).optional(),
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
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = { signupSchema, loginSchema };
