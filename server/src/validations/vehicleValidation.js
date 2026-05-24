const { z } = require("zod");

const vehicleSchema = z.object({
  body: z.object({
    vehicleNumber: z.string().min(3),
    type: z.string().min(2),
    capacity: z.number().positive(),
    driverAssigned: z.string().optional(),
    status: z.enum(["Available", "In Transit", "Maintenance", "Inactive"]).optional(),
    fuelType: z.string().optional(),
    fuelConsumptionKmPerL: z.number().positive().optional(),
    insuranceExpiryDate: z.string(),
    lastServiceDate: z.string(),
    nextServiceDate: z.string(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = { vehicleSchema };
