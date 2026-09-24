const { z } = require('zod');

const createMaintenanceLogSchema = z.object({
  body: z.object({
    vehicleId: z.union([z.number().int(), z.string()]),
    serviceType: z.string().min(1, 'Service type is required'),
    date: z.string().min(1, 'Scheduled date is required'),
    cost: z.number().nonnegative('Cost must be a non-negative number'),
    provider: z.string().min(1, 'Service provider center is required'),
    status: z.enum(['scheduled', 'in_progress', 'completed']).optional(),
    notes: z.string().optional()
  })
});

const updateMaintenanceStatusSchema = z.object({
  body: z.object({
    status: z.enum(['scheduled', 'in_progress', 'completed'])
  })
});

module.exports = {
  createMaintenanceLogSchema,
  updateMaintenanceStatusSchema
};
