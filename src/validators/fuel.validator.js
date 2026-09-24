const { z } = require('zod');

const createFuelLogSchema = z.object({
  body: z.object({
    vehicleId: z.union([z.number().int(), z.string()]),
    date: z.string().min(1, 'Refueling date is required'),
    fuelAmount: z.number().positive('Fuel amount must be a positive number'),
    cost: z.number().positive('Cost must be a positive number'),
    odometer: z.number().nonnegative('Odometer must be a non-negative number'),
    driverName: z.string().min(1, 'Driver signature name is required')
  })
});

const updateFuelLogSchema = z.object({
  body: createFuelLogSchema.shape.body.partial()
});

module.exports = {
  createFuelLogSchema,
  updateFuelLogSchema
};
