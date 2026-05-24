const { z } = require("zod");

const driverSchema = z.object({
  body: z.object({
    employeeId: z.string().min(2),
    name: z.string().min(2),
    phone: z.string().min(7),
    licenseNumber: z.string().min(3),
    availabilityStatus: z.enum(["Available", "On Trip", "On Leave"]).optional(),
    rating: z.number().min(0).max(5).optional(),
    completedTrips: z.number().min(0).optional(),
    onTimeRate: z.number().min(0).max(100).optional(),
    safetyScore: z.number().min(0).max(100).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = { driverSchema };
