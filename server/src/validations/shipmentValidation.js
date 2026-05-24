const { z } = require("zod");

const shipmentSchema = z.object({
  body: z.object({
    shipmentId: z.string().min(2),
    title: z.string().min(2),
    origin: z.string().min(2),
    destination: z.string().min(2),
    vehicle: z.string().optional(),
    driver: z.string().optional(),
    status: z.enum(["Pending", "In Transit", "Delivered", "Delayed"]).optional(),
    priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
    weight: z.number().min(0).optional(),
    scheduledPickup: z.string(),
    estimatedDelivery: z.string(),
    deliveredAt: z.string().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = { shipmentSchema };
