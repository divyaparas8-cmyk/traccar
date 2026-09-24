const { z } = require('zod');

const createDriverSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Driver full name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    email: z.string().email('Valid email is required'),
    licenseNumber: z.string().min(5, 'License number must be at least 5 characters'),
    experience: z.string().optional(),
    avatar: z.string().optional(),
    assignedVehicleId: z.union([z.number().int(), z.string()]).optional().nullable()
  })
});

const updateDriverSchema = z.object({
  body: createDriverSchema.shape.body.partial()
});

const assignVehicleSchema = z.object({
  body: z.object({
    vehicleId: z.union([z.number().int(), z.string()]).optional().nullable()
  })
});

module.exports = {
  createDriverSchema,
  updateDriverSchema,
  assignVehicleSchema
};
