const { z } = require('zod');

const createVehicleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Vehicle model name is required'),
    plate: z.string().min(1, 'License plate is required'),
    vin: z.string().min(1, 'Chassis VIN is required'),
    engineNumber: z.string().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    manufactureYear: z.number().int().optional(),
    type: z.enum(['truck', 'van', 'car', 'bus']).optional(),
    status: z.enum(['active', 'maintenance', 'inactive']).optional(),
    gpsEnabled: z.boolean().optional(),
    fuelType: z.enum(['Diesel', 'Petrol', 'Electric', 'Hybrid']).optional(),
    tankCapacity: z.number().nonnegative().optional(),
    grossPayload: z.number().nonnegative().optional(),
    netPayload: z.number().nonnegative().optional(),
    insuranceExpiry: z.string().min(1, 'Insurance expiry is required'),
    keuringExpiry: z.string().min(1, 'Keuring expiry is required'),
    traccarDeviceId: z.union([z.number().int(), z.string()]).optional().nullable(),
    trackerImei: z.string().optional().nullable(),
    driverId: z.union([z.number().int(), z.string()]).optional().nullable(),
    photo: z.string().optional()
  })
});

const updateVehicleSchema = z.object({
  body: createVehicleSchema.shape.body.partial()
});

module.exports = {
  createVehicleSchema,
  updateVehicleSchema
};
